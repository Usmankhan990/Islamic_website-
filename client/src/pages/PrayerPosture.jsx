import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Prayer positions and their expected angles
const PRAYER_POSITIONS = {
  STANDING: { name: 'Qiyam (Standing)', icon: '🧍', color: '#22C55E', tip: 'Stand straight facing Qibla, hands folded' },
  BOWING: { name: "Ruku' (Bowing)", icon: '🙇', color: '#3B82F6', tip: 'Bend at 90° angle, hands on knees, back straight' },
  PROSTRATING: { name: 'Sujud (Prostration)', icon: '🤲', color: '#A855F7', tip: 'Forehead, nose, palms, knees and toes on the ground' },
  SITTING: { name: 'Tashahhud (Sitting)', icon: '🧎', color: '#F59E0B', tip: 'Sit upright, hands on thighs, right index finger pointing' },
  UNKNOWN: { name: 'Analyzing...', icon: '🔄', color: '#6B7280', tip: 'Position yourself in front of the camera' }
};

const KEYPOINTS = {
  NOSE: 0, LEFT_EYE: 1, RIGHT_EYE: 2, LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6, LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10, LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14, LEFT_ANKLE: 15, RIGHT_ANKLE: 16
};

function getAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function detectPosition(keypoints) {
  if (!keypoints || keypoints.length < 17) return 'UNKNOWN';
  const kp = keypoints;
  const hasConfidence = (idx) => kp[idx].score > 0.3;
  const nose = kp[KEYPOINTS.NOSE];
  const lShoulder = kp[KEYPOINTS.LEFT_SHOULDER];
  const rShoulder = kp[KEYPOINTS.RIGHT_SHOULDER];
  const lHip = kp[KEYPOINTS.LEFT_HIP];
  const rHip = kp[KEYPOINTS.RIGHT_HIP];
  const lKnee = kp[KEYPOINTS.LEFT_KNEE];
  const lAnkle = kp[KEYPOINTS.LEFT_ANKLE];
  if (!hasConfidence(KEYPOINTS.LEFT_SHOULDER) || !hasConfidence(KEYPOINTS.LEFT_HIP)) return 'UNKNOWN';
  const shoulderMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
  const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
  const torsoAngle = Math.abs(Math.atan2(shoulderMid.y - hipMid.y, shoulderMid.x - hipMid.x) * 180 / Math.PI);
  const noseAboveShoulders = nose.y < shoulderMid.y;
  const noseBelowHips = nose.y > hipMid.y;
  const noseNearHips = Math.abs(nose.y - hipMid.y) < 80;
  let hipAngle = 180;
  if (hasConfidence(KEYPOINTS.LEFT_KNEE) && hasConfidence(KEYPOINTS.LEFT_HIP)) hipAngle = getAngle(lShoulder, lHip, lKnee);
  let kneeAngle = 180;
  if (hasConfidence(KEYPOINTS.LEFT_KNEE) && hasConfidence(KEYPOINTS.LEFT_ANKLE)) kneeAngle = getAngle(lHip, lKnee, lAnkle);
  if (noseBelowHips && hipAngle < 90) return 'PROSTRATING';
  if (noseNearHips && hipAngle < 130 && hipAngle > 60) return 'BOWING';
  if (kneeAngle < 120 && noseAboveShoulders && hipAngle > 100) return 'SITTING';
  if (noseAboveShoulders && hipAngle > 150 && torsoAngle > 50) return 'STANDING';
  return 'UNKNOWN';
}

export default function PrayerPosture() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [position, setPosition] = useState('UNKNOWN');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const sessionStartRef = useRef(null);

  // Check premium access
  useEffect(() => {
    if (!user) { setCheckingAccess(false); return; }
    // Admin bypasses
    if (user.role === 'admin') { setIsPremium(true); setCheckingAccess(false); return; }
    api.get(`/users/${user.id}/subscription`)
      .then(r => { setIsPremium(r.data.isPremium); setCheckingAccess(false); })
      .catch(() => { setCheckingAccess(false); });
  }, [user]);

  // Load TensorFlow.js + MoveNet
  const loadModel = async () => {
    setLoading(true);
    setError('');
    try {
      // Dynamic import TF.js
      if (!window.tf) {
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');
      }
      if (!window.poseDetection) {
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
      }
      // Set backend
      await window.tf.setBackend('webgl');
      await window.tf.ready();
      
      const detector = await window.poseDetection.createDetector(
        window.poseDetection.SupportedModels.MoveNet,
        { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
      detectorRef.current = detector;
      setModelLoaded(true);
    } catch (err) {
      console.error('Model load error:', err);
      setError('Failed to load AI model. Please check your internet connection.');
    }
    setLoading(false);
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        sessionStartRef.current = Date.now();
        detectPose();
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access to use this feature.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setCameraActive(false);
    setPosition('UNKNOWN');
  };

  const detectPose = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const detect = async () => {
      if (!video.srcObject) return;
      try {
        const poses = await detectorRef.current.estimatePoses(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (poses.length > 0) {
          const keypoints = poses[0].keypoints;
          drawSkeleton(ctx, keypoints, canvas.width, canvas.height);
          const pos = detectPosition(keypoints);
          setPosition(pos);
          
          // Generate feedback
          generateFeedback(pos, keypoints);
        }
      } catch {}
      animRef.current = requestAnimationFrame(detect);
    };
    detect();
  }, []);

  const drawSkeleton = (ctx, keypoints, w, h) => {
    // Draw connections
    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
      [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16]
    ];

    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 3;
    connections.forEach(([a, b]) => {
      const ka = keypoints[a];
      const kb = keypoints[b];
      if (ka.score > 0.3 && kb.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(ka.x, ka.y);
        ctx.lineTo(kb.x, kb.y);
        ctx.stroke();
      }
    });

    // Draw keypoints
    keypoints.forEach(kp => {
      if (kp.score > 0.3) {
        ctx.fillStyle = '#D4A843';
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  };

  const generateFeedback = (pos, keypoints) => {
    const tips = [];
    const posInfo = PRAYER_POSITIONS[pos];
    
    if (pos === 'STANDING') {
      const lShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
      const rShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
      if (Math.abs(lShoulder.y - rShoulder.y) > 25) {
        tips.push({ type: 'warning', text: 'Keep your shoulders level and aligned' });
      } else {
        tips.push({ type: 'success', text: 'Good standing posture! ✅' });
      }
    } else if (pos === 'BOWING') {
      const lHip = keypoints[KEYPOINTS.LEFT_HIP];
      const lShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
      const lKnee = keypoints[KEYPOINTS.LEFT_KNEE];
      if (lKnee.score > 0.3) {
        const angle = getAngle(lShoulder, lHip, lKnee);
        if (angle > 100) tips.push({ type: 'warning', text: 'Bend more — aim for a 90° angle at the hips' });
        else tips.push({ type: 'success', text: 'Good bowing angle! ✅' });
      }
    } else if (pos === 'PROSTRATING') {
      tips.push({ type: 'success', text: 'Sujud detected. Keep forehead firmly on the ground ✅' });
    } else if (pos === 'SITTING') {
      tips.push({ type: 'success', text: 'Sitting position detected. Keep your back straight ✅' });
    }
    
    setFeedback(tips);
  };

  // Session timer
  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(() => {
      if (sessionStartRef.current) {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cameraActive]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const posInfo = PRAYER_POSITIONS[position];
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (checkingAccess) return <div className="page"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page container">
      <div className="pp-header">
        <h1 className="heading-xl">🕌 AI Prayer Posture Guide</h1>
        <p className="text-muted">Real-time feedback on your prayer positions using AI</p>
        <span className="pp-premium-badge">👑 Premium Feature</span>
      </div>

      {/* Premium Gate */}
      {!isPremium ? (
        <div className="pp-paywall animate-slide-up">
          <div className="pp-paywall-hero">
            <span style={{ fontSize: '4rem' }}>🕌</span>
            <h2 className="heading-lg" style={{ marginTop: 12 }}>Premium AI Prayer Guide</h2>
            <p className="text-muted" style={{ maxWidth: 500, margin: '12px auto' }}>
              Get real-time AI-powered feedback on your prayer posture using your device camera.
              Our advanced model detects Qiyam, Ruku', Sujud and Tashahhud positions.
            </p>
          </div>

          <div className="pp-paywall-features">
            {[
              { icon: '📸', text: 'Real-time camera pose detection' },
              { icon: '🤖', text: 'AI-powered body tracking (TensorFlow.js)' },
              { icon: '✅', text: 'Live feedback on prayer form' },
              { icon: '🧍', text: 'Detects Standing, Bowing, Prostration, Sitting' },
              { icon: '⏱️', text: 'Session timer & progress tracking' },
            ].map((f, i) => (
              <div key={i} className="pp-paywall-feature">
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="pp-paywall-cta">
            {!user ? (
              <>
                <p className="text-muted" style={{ marginBottom: 12 }}>Sign in to subscribe</p>
                <a href="#/login" className="btn btn-primary btn-lg">🔐 Login to Subscribe</a>
              </>
            ) : (
              <>
                <div className="pp-price-card">
                  <span className="pp-price">Premium</span>
                  <span className="pp-price-desc">Contact admin for subscription access</span>
                </div>
                <p className="text-sm text-muted" style={{ marginTop: 12 }}>Contact the administrator to upgrade your account to premium.</p>
              </>
            )}
          </div>

          {/* Preview cards */}
          <div className="pp-paywall-preview">
            <h4 style={{ textAlign: 'center', marginBottom: 16, color: 'var(--text-dim)' }}>What you'll get:</h4>
            <div className="pp-preview-grid">
              {Object.entries(PRAYER_POSITIONS).filter(([k]) => k !== 'UNKNOWN').map(([key, p]) => (
                <div key={key} className="pp-preview-card" style={{ '--pc': p.color }}>
                  <span style={{ fontSize: '2rem' }}>{p.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{p.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
        {/* Premium content below */}
      <div className="pp-layout">
        {/* Camera View */}
        <div className="pp-camera-section">
          <div className="pp-camera-wrapper">
            <video ref={videoRef} className="pp-video" playsInline muted 
              style={{ display: cameraActive ? 'block' : 'none' }} />
            <canvas ref={canvasRef} className="pp-canvas" 
              style={{ display: cameraActive ? 'block' : 'none' }} />
            
            {!cameraActive && (
              <div className="pp-placeholder">
                <span className="pp-placeholder-icon">📸</span>
                <h3>Camera Preview</h3>
                <p>Enable camera to start the AI prayer posture analysis</p>
              </div>
            )}

            {cameraActive && (
              <div className="pp-position-overlay" style={{ '--pos-color': posInfo.color }}>
                <span className="pp-pos-icon">{posInfo.icon}</span>
                <span className="pp-pos-name">{posInfo.name}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="pp-controls">
            {!modelLoaded && !loading && (
              <button className="btn btn-primary btn-lg pp-start-btn" onClick={loadModel}>
                🤖 Load AI Model
              </button>
            )}
            {loading && (
              <div className="pp-loading">
                <div className="spinner"></div>
                <span>Loading AI model (may take a moment)...</span>
              </div>
            )}
            {modelLoaded && !cameraActive && (
              <button className="btn btn-primary btn-lg pp-start-btn" onClick={startCamera}>
                📷 Start Camera
              </button>
            )}
            {cameraActive && (
              <button className="btn btn-danger btn-lg" onClick={stopCamera}>
                ⏹ Stop Camera
              </button>
            )}
            {error && <p className="pp-error">{error}</p>}
          </div>
        </div>

        {/* Feedback Panel */}
        <div className="pp-feedback-panel">
          {/* Current Position */}
          <div className="pp-status-card" style={{ '--pos-color': posInfo.color }}>
            <span className="pp-status-icon">{posInfo.icon}</span>
            <div>
              <h3 className="pp-status-name">{posInfo.name}</h3>
              <p className="pp-status-tip">{posInfo.tip}</p>
            </div>
          </div>

          {/* Session Info */}
          {cameraActive && (
            <div className="pp-session-card">
              <div className="pp-session-time">⏱ {formatTime(sessionTime)}</div>
              <div className="pp-session-label">Session Time</div>
            </div>
          )}

          {/* Live Feedback */}
          <div className="pp-feedback-list">
            <h4 style={{ marginBottom: 12, fontWeight: 700 }}>📋 Live Feedback</h4>
            {feedback.length === 0 ? (
              <p className="text-muted text-sm">Start camera to receive real-time feedback</p>
            ) : (
              feedback.map((f, i) => (
                <div key={i} className={`pp-feedback-item pp-feedback-${f.type}`}>
                  <span>{f.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{f.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Prayer Positions Guide */}
          <div className="pp-guide">
            <h4 style={{ marginBottom: 12, fontWeight: 700 }}>🕌 Prayer Positions</h4>
            {Object.entries(PRAYER_POSITIONS).filter(([k]) => k !== 'UNKNOWN').map(([key, p]) => (
              <div key={key} className={`pp-guide-item ${position === key ? 'active' : ''}`}
                style={{ '--gc': p.color }}>
                <span className="pp-guide-icon">{p.icon}</span>
                <div>
                  <span className="pp-guide-name">{p.name}</span>
                  <span className="pp-guide-tip">{p.tip}</span>
                </div>
                {position === key && <span className="pp-guide-active">● ACTIVE</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}

      <style>{`
        .pp-header { text-align: center; margin-bottom: 32px; }
        .pp-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
        .pp-camera-section { display: flex; flex-direction: column; gap: 16px; }
        .pp-camera-wrapper {
          position: relative; border-radius: var(--radius-xl); overflow: hidden;
          background: var(--surface); border: 2px solid var(--border); aspect-ratio: 4/3;
        }
        .pp-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        .pp-canvas { position: absolute; inset: 0; width: 100%; height: 100%; transform: scaleX(-1); pointer-events: none; }
        .pp-placeholder {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 12px;
        }
        .pp-placeholder-icon { font-size: 4rem; opacity: 0.4; }
        .pp-placeholder h3 { color: var(--text-muted); }
        .pp-placeholder p { color: var(--text-dim); font-size: 0.9rem; max-width: 280px; text-align: center; }
        .pp-position-overlay {
          position: absolute; top: 16px; left: 16px;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
          padding: 10px 20px; border-radius: var(--radius-full);
          display: flex; align-items: center; gap: 10px;
          border: 1px solid var(--pos-color);
        }
        .pp-pos-icon { font-size: 1.5rem; }
        .pp-pos-name { font-weight: 700; color: var(--pos-color); font-size: 0.95rem; }
        .pp-controls { display: flex; justify-content: center; gap: 12px; }
        .pp-start-btn { width: 100%; }
        .pp-loading { display: flex; align-items: center; gap: 12px; color: var(--text-muted); justify-content: center; }
        .pp-error { color: #EF4444; font-size: 0.9rem; text-align: center; margin-top: 8px; }
        
        .pp-feedback-panel { display: flex; flex-direction: column; gap: 16px; }
        .pp-status-card {
          display: flex; align-items: center; gap: 16px;
          background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--pos-color);
          border-radius: var(--radius-lg); padding: 20px;
        }
        .pp-status-icon { font-size: 2.5rem; }
        .pp-status-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.2rem; color: var(--pos-color); }
        .pp-status-tip { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }
        .pp-session-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
          padding: 16px; text-align: center;
        }
        .pp-session-time { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--accent); }
        .pp-session-label { font-size: 0.8rem; color: var(--text-dim); margin-top: 4px; }
        
        .pp-feedback-list {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px;
        }
        .pp-feedback-item {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          border-radius: var(--radius-md); margin-bottom: 4px; font-size: 0.9rem;
        }
        .pp-feedback-success { background: rgba(34,197,94,0.1); color: #22C55E; }
        .pp-feedback-warning { background: rgba(245,158,11,0.1); color: #F59E0B; }
        
        .pp-guide {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px;
        }
        .pp-guide-item {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          border-radius: var(--radius-md); transition: var(--transition); margin-bottom: 4px;
        }
        .pp-guide-item.active { background: rgba(var(--gc),0.1); border: 1px solid var(--gc); }
        .pp-guide-icon { font-size: 1.5rem; flex-shrink: 0; }
        .pp-guide-name { display: block; font-weight: 600; font-size: 0.9rem; }
        .pp-guide-tip { display: block; font-size: 0.75rem; color: var(--text-dim); }
        .pp-guide-active { color: var(--gc); font-weight: 700; font-size: 0.7rem; margin-left: auto; animation: pulse 1s infinite; }
        
        @media (max-width: 768px) {
          .pp-layout { grid-template-columns: 1fr; }
        }

        .pp-premium-badge {
          display: inline-block; margin-top: 12px; padding: 6px 18px;
          background: linear-gradient(135deg, #FFD700, #FFA500); color: #1a1a2e;
          border-radius: var(--radius-full); font-weight: 700; font-size: 0.85rem;
        }
        .pp-paywall {
          text-align: center; padding: 40px; max-width: 700px; margin: 0 auto;
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
        }
        .pp-paywall-hero { margin-bottom: 32px; }
        .pp-paywall-features {
          display: flex; flex-direction: column; gap: 8px; max-width: 400px; margin: 0 auto 32px;
        }
        .pp-paywall-feature {
          display: flex; align-items: center; gap: 12px; padding: 10px 16px;
          background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.9rem; text-align: left;
        }
        .pp-paywall-cta { margin-bottom: 32px; }
        .pp-price-card {
          display: inline-flex; flex-direction: column; padding: 20px 40px;
          background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1));
          border: 2px solid rgba(255,215,0,0.3); border-radius: var(--radius-lg);
        }
        .pp-price { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: #FFD700; }
        .pp-price-desc { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }
        .pp-preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .pp-preview-card {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 16px; background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-lg); border-top: 3px solid var(--pc);
        }
      `}</style>
    </div>
  );
}

