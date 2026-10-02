import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { measurePose, classifyPose, createSmoother, createPrayerTracker, poseFeedback } from '../utils/prayerPose';

// Prayer positions shown in the UI
const PRAYER_POSITIONS = {
  STANDING: { name: 'Qiyam (Standing)', icon: '🧍', color: '#22C55E', tip: 'Stand straight facing Qibla, hands folded' },
  BOWING: { name: "Ruku' (Bowing)", icon: '🙇', color: '#3B82F6', tip: 'Bend to 90°, hands on knees, back flat' },
  PROSTRATING: { name: 'Sujud (Prostration)', icon: '🤲', color: '#A855F7', tip: 'Forehead, nose, palms, knees and toes on the ground' },
  SITTING: { name: 'Tashahhud (Sitting)', icon: '🧎', color: '#F59E0B', tip: 'Sit upright, hands on thighs' },
  UNKNOWN: { name: 'Analyzing...', icon: '🔄', color: '#6B7280', tip: 'Make sure your whole body is in the frame' }
};

const SKELETON = [[5, 6], [5, 7], [7, 9], [6, 8], [8, 10], [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16]];
const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
const POSE_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js';

const loadScript = (src) => new Promise((resolve, reject) => {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded) resolve();
    else { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); }
    return;
  }
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => { script.dataset.loaded = '1'; resolve(); };
  script.onerror = () => reject(new Error(`Could not load ${src}`));
  document.head.appendChild(script);
});

// Human-readable reason a camera couldn't start
function cameraErrorMessage(err) {
  if (!window.isSecureContext) return 'Camera needs a secure (https://) connection. Open the site over https.';
  switch (err?.name) {
    case 'NotAllowedError': return 'Camera permission was denied. Allow camera access in your browser settings and try again.';
    case 'NotFoundError': return 'No camera found on this device.';
    case 'NotReadableError': return 'The camera is being used by another app. Close it and try again.';
    default: return 'Could not start the camera. ' + (err?.message || '');
  }
}

const formatTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

export default function PrayerPosture() {
  const { user } = useAuth();
  const [access, setAccess] = useState({ checking: true, isPremium: false, requestedAt: null });
  const [requestMsg, setRequestMsg] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animRef = useRef(null);
  const runningRef = useRef(false);
  const smootherRef = useRef(null);
  const trackerRef = useRef(null);
  const lastFrameRef = useRef(0);
  const lastUiRef = useRef(0);

  const [phase, setPhase] = useState('idle'); // idle | loading | running | stopped
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState('UNKNOWN');
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const sessionStartRef = useRef(null);

  // Check premium access
  useEffect(() => {
    if (!user) { setAccess({ checking: false, isPremium: false, requestedAt: null }); return; }
    if (user.role === 'admin') { setAccess({ checking: false, isPremium: true, requestedAt: null }); return; }
    api.get(`/users/${user.id}/subscription`)
      .then(r => setAccess({ checking: false, isPremium: r.data.isPremium, requestedAt: r.data.requestedAt }))
      .catch(() => setAccess({ checking: false, isPremium: false, requestedAt: null }));
  }, [user]);

  const requestPremium = async () => {
    try {
      const r = await api.post('/users/me/premium-request');
      setRequestMsg(r.data.message);
      setAccess(a => ({ ...a, requestedAt: new Date().toISOString() }));
    } catch (err) {
      setRequestMsg(err.response?.data?.message || 'Could not send the request.');
    }
  };

  // TensorFlow.js + MoveNet, loaded once from CDN
  const loadModel = async () => {
    if (detectorRef.current) return;
    setLoadingText('Loading AI model (first time can take ~10 seconds)...');
    await loadScript(TFJS_URL);
    await loadScript(POSE_URL);
    const tf = window.tf;
    // Prefer GPU; fall back to CPU on devices without WebGL
    if (!(await tf.setBackend('webgl').catch(() => false))) await tf.setBackend('cpu');
    await tf.ready();
    detectorRef.current = await window.poseDetection.createDetector(
      window.poseDetection.SupportedModels.MoveNet,
      { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
  };

  const drawSkeleton = (ctx, keypoints, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    SKELETON.forEach(([a, b]) => {
      const ka = keypoints[a], kb = keypoints[b];
      if (ka.score > 0.3 && kb.score > 0.3) {
        ctx.beginPath(); ctx.moveTo(ka.x, ka.y); ctx.lineTo(kb.x, kb.y); ctx.stroke();
      }
    });
    keypoints.forEach(kp => {
      if (kp.score > 0.3) {
        ctx.fillStyle = '#D4A843';
        ctx.beginPath(); ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI); ctx.fill();
      }
    });
  };

  const detectLoop = async () => {
    if (!runningRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    const now = performance.now();
    const dt = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 0;
    lastFrameRef.current = now;
    try {
      if (video.readyState >= 2) {
        const poses = await detectorRef.current.estimatePoses(video);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const keypoints = poses[0]?.keypoints;
        const measures = keypoints ? measurePose(keypoints) : null;
        const stable = smootherRef.current(classifyPose(measures));
        const current = trackerRef.current.update(stable, dt);
        if (keypoints) drawSkeleton(ctx, keypoints, PRAYER_POSITIONS[stable].color);

        // Update React state at most ~4×/second
        if (now - lastUiRef.current > 250) {
          lastUiRef.current = now;
          setPosition(stable);
          setFeedback(poseFeedback(stable, measures));
          setStats({ ...current, timeIn: { ...current.timeIn } });
          setSessionTime((Date.now() - sessionStartRef.current) / 1000);
        }
      }
    } catch (err) {
      console.error('Pose detection error:', err);
    }
    animRef.current = requestAnimationFrame(detectLoop);
  };

  const start = async () => {
    setError('');
    setPhase('loading');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('Camera API not available in this browser.'), { name: 'Unsupported' });
      await loadModel();
      setLoadingText('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      canvasRef.current.width = video.videoWidth || 640;
      canvasRef.current.height = video.videoHeight || 480;

      smootherRef.current = createSmoother();
      trackerRef.current = createPrayerTracker();
      sessionStartRef.current = Date.now();
      lastFrameRef.current = 0;
      runningRef.current = true;
      setPosition('UNKNOWN');
      setStats(null);
      setSessionTime(0);
      setPhase('running');
      detectLoop();
    } catch (err) {
      console.error('Prayer guide start error:', err);
      const isCameraError = err?.name && ['NotAllowedError', 'NotFoundError', 'NotReadableError', 'OverconstrainedError', 'SecurityError', 'Unsupported'].includes(err.name);
      setError(isCameraError ? cameraErrorMessage(err) : 'Failed to load the AI model. Check your internet connection and try again.');
      stopStream();
      setPhase('idle');
    }
  };

  const stopStream = () => {
    runningRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  };

  const stop = () => {
    stopStream();
    if (trackerRef.current) setStats({ ...trackerRef.current.stats, timeIn: { ...trackerRef.current.stats.timeIn } });
    setPhase('stopped');
    setPosition('UNKNOWN');
    setFeedback([]);
  };

  // Release the camera when leaving the page
  useEffect(() => () => stopStream(), []);

  const posInfo = PRAYER_POSITIONS[position];
  const running = phase === 'running';

  if (access.checking) return <div className="page"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page container">
      <div className="pp-header">
        <h1 className="heading-xl">🕌 AI Prayer Posture Guide</h1>
        <p className="text-muted">Real-time feedback on your prayer positions using AI</p>
        <span className="pp-premium-badge">👑 Premium Feature</span>
      </div>

      {/* Premium Gate */}
      {!access.isPremium ? (
        <div className="pp-paywall animate-slide-up">
          <div className="pp-paywall-hero">
            <span style={{ fontSize: '4rem' }}>🕌</span>
            <h2 className="heading-lg" style={{ marginTop: 12 }}>Premium AI Prayer Guide</h2>
            <p className="text-muted" style={{ maxWidth: 500, margin: '12px auto' }}>
              Get real-time AI-powered feedback on your prayer posture using your device camera.
              It detects Qiyam, Ruku', Sujud and Tashahhud, and counts your rak'ahs.
            </p>
          </div>

          <div className="pp-paywall-features">
            {[
              { icon: '📸', text: 'Real-time camera pose detection — video never leaves your device' },
              { icon: '🤖', text: 'AI body tracking (TensorFlow.js MoveNet)' },
              { icon: '✅', text: 'Live feedback on ruku, sujud and sitting form' },
              { icon: '🔢', text: "Counts rak'ahs, ruku and sujud" },
              { icon: '⏱️', text: 'Session timer & time spent in each position' },
            ].map((f, i) => (
              <div key={i} className="pp-paywall-feature">
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="pp-paywall-cta">
            {!user ? (
              <>
                <p className="text-muted" style={{ marginBottom: 12 }}>Sign in to request premium access</p>
                <a href="#/login" className="btn btn-primary btn-lg">🔐 Login</a>
              </>
            ) : access.requestedAt ? (
              <div className="pp-price-card">
                <span className="pp-price">🙋 Request sent</span>
                <span className="pp-price-desc">{requestMsg || 'The admin will review your request and enable premium for your account.'}</span>
              </div>
            ) : (
              <>
                <button className="btn btn-accent btn-lg" onClick={requestPremium}>👑 Request Premium Access</button>
                <p className="text-sm text-muted" style={{ marginTop: 12 }}>The admin will be notified and can enable premium for your account.</p>
                {requestMsg && <p className="pp-error">{requestMsg}</p>}
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
        <div className="pp-layout">
          {/* Camera View */}
          <div className="pp-camera-section">
            <div className="pp-camera-wrapper">
              <video ref={videoRef} className="pp-video" playsInline muted style={{ display: running ? 'block' : 'none' }} />
              <canvas ref={canvasRef} className="pp-canvas" style={{ display: running ? 'block' : 'none' }} />

              {!running && (
                <div className="pp-placeholder">
                  {phase === 'loading' ? (
                    <>
                      <div className="spinner"></div>
                      <p>{loadingText}</p>
                    </>
                  ) : (
                    <>
                      <span className="pp-placeholder-icon">📸</span>
                      <h3>{phase === 'stopped' ? 'Session ended' : 'Camera Preview'}</h3>
                      <ul className="pp-setup">
                        <li>📱 Put your phone/laptop on the floor <strong>to your side</strong>, about 2–3 m away</li>
                        <li>🧍 Your <strong>whole body</strong> (head to feet) should be visible</li>
                        <li>💡 Use good lighting; the video stays on your device</li>
                      </ul>
                    </>
                  )}
                </div>
              )}

              {running && (
                <div className="pp-position-overlay" style={{ '--pos-color': posInfo.color }}>
                  <span className="pp-pos-icon">{posInfo.icon}</span>
                  <span className="pp-pos-name">{posInfo.name}</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="pp-controls">
              {running ? (
                <button className="btn btn-danger btn-lg pp-start-btn" onClick={stop}>⏹ Stop Session</button>
              ) : (
                <button className="btn btn-primary btn-lg pp-start-btn" onClick={start} disabled={phase === 'loading'}>
                  {phase === 'loading' ? 'Starting...' : phase === 'stopped' ? '🔄 Start New Session' : '▶ Start Prayer Guide'}
                </button>
              )}
            </div>
            {error && <p className="pp-error">⚠️ {error}</p>}
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

            {/* Session counters */}
            {stats && (
              <div className="pp-session-card">
                <div className="pp-counters">
                  <div><span className="pp-count">{stats.rakat}</span><span className="pp-session-label">Rak'ahs</span></div>
                  <div><span className="pp-count">{stats.ruku}</span><span className="pp-session-label">Ruku</span></div>
                  <div><span className="pp-count">{stats.sujud}</span><span className="pp-session-label">Sujud</span></div>
                  <div><span className="pp-count">{formatTime(sessionTime)}</span><span className="pp-session-label">Time</span></div>
                </div>
                <div className="pp-time-bars">
                  {['STANDING', 'BOWING', 'PROSTRATING', 'SITTING'].map(k => (
                    <div key={k} className="pp-time-row">
                      <span>{PRAYER_POSITIONS[k].icon} {PRAYER_POSITIONS[k].name.split(' ')[0]}</span>
                      <span className="pp-time-val">{formatTime(stats.timeIn[k])}</span>
                    </div>
                  ))}
                </div>
                {phase === 'stopped' && <p className="text-sm text-muted" style={{ marginTop: 8 }}>Session summary</p>}
              </div>
            )}

            {/* Live Feedback */}
            <div className="pp-feedback-list">
              <h4 style={{ marginBottom: 12, fontWeight: 700 }}>📋 Live Feedback</h4>
              {feedback.length === 0 ? (
                <p className="text-muted text-sm">Start a session to receive real-time feedback</p>
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
                <div key={key} className={`pp-guide-item ${position === key ? 'active' : ''}`} style={{ '--gc': p.color }}>
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
        .pp-setup { list-style: none; padding: 0 16px; margin: 0; display: flex; flex-direction: column; gap: 6px; max-width: 380px; }
        .pp-setup li { font-size: 0.85rem; color: var(--text-muted); text-align: left; }
        .pp-counters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .pp-counters > div { display: flex; flex-direction: column; align-items: center; }
        .pp-count { font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--accent); }
        .pp-time-bars { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; text-align: left; }
        .pp-time-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); }
        .pp-time-val { font-variant-numeric: tabular-nums; color: var(--text); }
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
        .pp-guide-item.active { background: color-mix(in srgb, var(--gc) 12%, transparent); border: 1px solid var(--gc); }
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
