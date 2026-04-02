import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getPrayerTimes, getPrayerTimesByCity, getUserLocation, getNextPrayer, getQiblaDirection, METHODS } from '../services/prayerApi';

const AZAN_URL = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3';

export default function PrayerTimes() {
  const [timings, setTimings] = useState(null);
  const [meta, setMeta] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [qibla, setQibla] = useState(null);
  const [heading, setHeading] = useState(null);
  const [compassSupported, setCompassSupported] = useState(false);
  const [compassActive, setCompassActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState(2);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  // Notification state
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('prayer_notif') === 'true');
  const [azanMuted, setAzanMuted] = useState(() => localStorage.getItem('azan_muted') === 'true');
  const [azanPlaying, setAzanPlaying] = useState(false);
  const azanRef = useRef(null);
  const notifiedRef = useRef(new Set());

  useEffect(() => { loadByLocation(); }, []);

  const loadByLocation = async () => {
    setLoading(true);
    try {
      const { lat, lng } = await getUserLocation();
      const data = await getPrayerTimes(lat, lng, method);
      setTimings(data.timings);
      setMeta(data.meta);
      setNextPrayer(getNextPrayer(data.timings));
      const q = await getQiblaDirection(lat, lng);
      setQibla(q);
    } catch {
      try {
        const data = await getPrayerTimesByCity('Mecca', 'Saudi Arabia', method);
        setTimings(data.timings);
        setMeta(data.meta);
        setNextPrayer(getNextPrayer(data.timings));
      } catch { }
    }
    setLoading(false);
  };

  const loadByCity = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const data = await getPrayerTimesByCity(city, country || 'auto', method);
      setTimings(data.timings);
      setMeta(data.meta);
      setNextPrayer(getNextPrayer(data.timings));
    } catch { }
    setLoading(false);
  };

  // Enable/disable notifications
  const toggleNotifications = async () => {
    if (!notifEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setNotifEnabled(true);
          localStorage.setItem('prayer_notif', 'true');
        }
      }
    } else {
      setNotifEnabled(false);
      localStorage.setItem('prayer_notif', 'false');
    }
  };

  const toggleMute = () => {
    setAzanMuted(!azanMuted);
    localStorage.setItem('azan_muted', (!azanMuted).toString());
    if (azanPlaying && !azanMuted) {
      // Will be muted
    } else if (azanRef.current) {
      azanRef.current.pause();
      setAzanPlaying(false);
    }
  };

  const stopAzan = () => {
    if (azanRef.current) { azanRef.current.pause(); azanRef.current = null; }
    setAzanPlaying(false);
  };

  // Prayer notification checker — runs every 30 seconds
  useEffect(() => {
    if (!notifEnabled || !timings) return;
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const check = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      prayerNames.forEach(prayer => {
        const prayerTime = timings[prayer]?.substring(0, 5);
        if (prayerTime === currentTime && !notifiedRef.current.has(prayer + currentTime)) {
          notifiedRef.current.add(prayer + currentTime);

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🕌 ${prayer} Time`, {
              body: `It's time for ${prayer} prayer (${prayerTime})`,
              icon: '🕌',
              tag: `prayer-${prayer}`
            });
          }

          // Auto-play azan for Maghrib (or any prayer)
          if (prayer === 'Maghrib' && !azanMuted) {
            playAzan();
          }
        }
      });
    };

    const interval = setInterval(check, 30000);
    check(); // Check immediately
    return () => clearInterval(interval);
  }, [notifEnabled, timings, azanMuted]);

  const playAzan = () => {
    try {
      const audio = new Audio(AZAN_URL);
      audio.volume = 0.7;
      azanRef.current = audio;
      setAzanPlaying(true);
      audio.play().catch(() => {});
      audio.onended = () => setAzanPlaying(false);
    } catch {}
  };

  // Countdown timer
  useEffect(() => {
    if (!nextPrayer) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextPrayer.date - now;
      if (diff <= 0) { setCountdown('Now! 🕌'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  // Device Orientation
  useEffect(() => {
    if (typeof DeviceOrientationEvent !== 'undefined') setCompassSupported(true);
  }, []);

  const enableCompass = async () => {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') return;
      }
      const handler = (e) => {
        let h = e.webkitCompassHeading || (e.alpha ? (360 - e.alpha) : null);
        if (h !== null) setHeading(h);
      };
      window.addEventListener('deviceorientation', handler, true);
      setCompassActive(true);
    } catch { }
  };

  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerIcons = { Fajr: '🌅', Sunrise: '☀️', Dhuhr: '🌤️', Asr: '🌇', Maghrib: '🌆', Isha: '🌙' };
  const qiblaAngle = qibla?.direction || 0;
  const compassRotation = heading !== null ? -heading : 0;
  const qiblaNeedleRotation = heading !== null ? (qiblaAngle - heading) : qiblaAngle;

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 32 }}>
        <h1 className="heading-xl">🕐 Prayer Times</h1>
        <p className="text-muted">Accurate prayer times based on your location</p>
        {meta && <p className="text-sm" style={{ color: 'var(--accent)', marginTop: 8 }}>📍 {meta.timezone}</p>}
      </div>

      {/* Notification + Azan Controls */}
      <div className="prayer-notif-bar">
        <div className="flex items-center gap-md">
          <button className={`prayer-notif-toggle ${notifEnabled ? 'active' : ''}`} onClick={toggleNotifications}>
            <span className="toggle-track"><span className="toggle-thumb"></span></span>
            <span>{notifEnabled ? '🔔 Notifications ON' : '🔕 Notifications OFF'}</span>
          </button>
          <button className={`prayer-notif-toggle ${!azanMuted ? 'active' : ''}`} onClick={toggleMute}>
            <span className="toggle-track"><span className="toggle-thumb"></span></span>
            <span>{azanMuted ? '🔇 Azan Muted' : '🔊 Azan Audio ON'}</span>
          </button>
        </div>
        {azanPlaying && (
          <div className="azan-playing">
            <span className="azan-wave">🕌</span>
            <span>Azan Playing...</span>
            <button className="btn btn-sm btn-danger" onClick={stopAzan}>⏹ Stop</button>
          </div>
        )}
      </div>

      {/* Search by City */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
          <input type="text" className="form-input" placeholder="City name..." value={city} onChange={e => setCity(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
          <input type="text" className="form-input" placeholder="Country..." value={country} onChange={e => setCountry(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
          <select className="form-select" value={method} onChange={e => setMethod(Number(e.target.value))} style={{ maxWidth: 300 }}>
            {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn btn-primary" onClick={loadByCity}>🔍 Search</button>
          <button className="btn btn-outline" onClick={loadByLocation}>📍 My Location</button>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : timings ? (
        <>
          {/* Next Prayer Highlight */}
          {nextPrayer && (
            <div className="next-prayer-card animate-slide-up">
              <div className="next-prayer-label">NEXT PRAYER</div>
              <div className="next-prayer-name">{prayerIcons[nextPrayer.name]} {nextPrayer.name}</div>
              <div className="next-prayer-time">{nextPrayer.time}</div>
              <div className="next-prayer-countdown">{countdown}</div>
            </div>
          )}

          {/* Prayer Cards */}
          <div className="grid-3 gap-lg" style={{ marginTop: 24 }}>
            {prayers.map((p, i) => (
              <div key={p} className={`prayer-card card animate-slide-up ${nextPrayer?.name === p ? 'prayer-active' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="prayer-icon">{prayerIcons[p]}</span>
                <h3 className="heading-sm">{p}</h3>
                <p className="prayer-time-value">{timings[p]}</p>
              </div>
            ))}
          </div>

          {/* Live Qibla Compass */}
          {qibla && (
            <div className="qibla-section animate-slide-up" style={{ marginTop: 32 }}>
              <h2 className="heading-md text-center" style={{ marginBottom: 24 }}>🧭 Qibla Direction</h2>
              <div className="qibla-compass-wrapper">
                <div className="qibla-compass">
                  <svg viewBox="0 0 300 300" className="qibla-svg">
                    <circle cx="150" cy="150" r="140" fill="rgba(13,107,75,0.05)" stroke="var(--border)" strokeWidth="2" />
                    <circle cx="150" cy="150" r="120" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
                    {Array.from({ length: 72 }).map((_, i) => {
                      const angle = i * 5;
                      const isMajor = angle % 30 === 0;
                      const r1 = isMajor ? 125 : 130;
                      const r2 = 140;
                      const rad = (angle - 90) * Math.PI / 180;
                      return <line key={i} x1={150 + r1 * Math.cos(rad)} y1={150 + r1 * Math.sin(rad)} x2={150 + r2 * Math.cos(rad)} y2={150 + r2 * Math.sin(rad)} stroke={isMajor ? 'var(--text-muted)' : 'var(--text-dim)'} strokeWidth={isMajor ? 2 : 1} />;
                    })}
                    <g style={{ transform: `rotate(${compassRotation}deg)`, transformOrigin: '150px 150px', transition: heading !== null ? 'transform 0.3s ease' : 'none' }}>
                      <text x="150" y="30" textAnchor="middle" fill="#EF4444" fontSize="18" fontWeight="800" fontFamily="var(--font-heading)">N</text>
                      <text x="270" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="14" fontWeight="600">E</text>
                      <text x="150" y="280" textAnchor="middle" fill="var(--text-muted)" fontSize="14" fontWeight="600">S</text>
                      <text x="30" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="14" fontWeight="600">W</text>
                      <g style={{ transform: `rotate(${qiblaAngle}deg)`, transformOrigin: '150px 150px' }}>
                        <circle cx="150" cy="20" r="16" fill="var(--primary)" opacity="0.9" />
                        <text x="150" y="26" textAnchor="middle" fontSize="14">🕋</text>
                      </g>
                      <polygon points="150,42 144,56 156,56" fill="#EF4444" opacity="0.8" />
                    </g>
                    <g style={{ transform: `rotate(${qiblaNeedleRotation}deg)`, transformOrigin: '150px 150px', transition: 'transform 0.3s ease' }}>
                      <polygon points="150,55 143,150 157,150" fill="var(--primary)" opacity="0.9" />
                      <polygon points="150,245 143,150 157,150" fill="var(--text-dim)" opacity="0.4" />
                    </g>
                    <circle cx="150" cy="150" r="12" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
                    <circle cx="150" cy="150" r="4" fill="var(--primary)" />
                  </svg>
                  {compassActive && heading !== null && (
                    <div className="compass-live-badge"><span className="compass-live-dot"></span> LIVE</div>
                  )}
                </div>
                <div className="qibla-info">
                  <div className="qibla-info-card">
                    <span className="qibla-info-label">Qibla Direction</span>
                    <span className="qibla-info-value">{qiblaAngle.toFixed(1)}°</span>
                    <span className="qibla-info-sub">from True North</span>
                  </div>
                  {heading !== null && (
                    <div className="qibla-info-card">
                      <span className="qibla-info-label">You're Facing</span>
                      <span className="qibla-info-value">{heading.toFixed(0)}°</span>
                    </div>
                  )}
                  {compassSupported && !compassActive && (
                    <button className="btn btn-primary btn-block" onClick={enableCompass} style={{ marginTop: 12 }}>🧭 Enable Live Compass</button>
                  )}
                  {!compassSupported && <p className="text-sm text-muted" style={{ marginTop: 12, textAlign: 'center' }}>💡 Open on mobile for live compass tracking</p>}
                  {heading !== null && (
                    <div className="qibla-info-card" style={{ marginTop: 8 }}>
                      <span className="qibla-info-label">Difference</span>
                      <span className="qibla-info-value" style={{ color: Math.abs(qiblaAngle - heading) < 10 ? '#22C55E' : 'var(--accent)' }}>
                        {Math.abs(qiblaAngle - heading).toFixed(0)}°
                      </span>
                      <span className="qibla-info-sub">
                        {Math.abs(qiblaAngle - heading) < 5 ? '✅ You are facing Qibla!' :
                         Math.abs(qiblaAngle - heading) < 20 ? '↔️ Almost there, adjust slightly' :
                         '🔄 Turn to face Qibla'}
                      </span>
                    </div>
                  )}
                  <Link to="/prayer/posture" className="btn btn-accent btn-block" style={{ marginTop: 12 }}>🕌 AI Prayer Posture Guide</Link>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted" style={{ padding: 60 }}>Unable to load prayer times. Please search by city.</p>
      )}

      <style>{`
        .prayer-notif-bar {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
          padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
        }
        .prayer-notif-toggle {
          display: flex; align-items: center; gap: 10px; padding: 8px 16px;
          background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-full);
          color: var(--text-muted); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: var(--transition);
        }
        .prayer-notif-toggle.active { border-color: var(--primary); color: var(--primary-light); background: rgba(13,107,75,0.1); }
        .toggle-track {
          width: 36px; height: 20px; background: var(--surface-light); border-radius: 10px;
          position: relative; transition: var(--transition); display: inline-block;
        }
        .prayer-notif-toggle.active .toggle-track { background: var(--primary); }
        .toggle-thumb {
          width: 16px; height: 16px; background: white; border-radius: 50%;
          position: absolute; top: 2px; left: 2px; transition: var(--transition);
        }
        .prayer-notif-toggle.active .toggle-thumb { left: 18px; }
        .azan-playing {
          display: flex; align-items: center; gap: 10px; padding: 8px 16px;
          background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.3);
          border-radius: var(--radius-full); color: var(--accent); font-size: 0.85rem; font-weight: 600;
        }
        .azan-wave { animation: bounce 1s infinite; }
        .next-prayer-card {
          background: linear-gradient(135deg, rgba(13,107,75,0.2), rgba(13,107,75,0.05));
          border: 1px solid rgba(13,107,75,0.3); border-radius: var(--radius-xl); padding: 40px; text-align: center;
        }
        .next-prayer-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; }
        .next-prayer-name { font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; color: var(--primary-light); margin: 8px 0; }
        .next-prayer-time { font-size: 1.5rem; color: var(--accent); font-weight: 600; }
        .next-prayer-countdown { font-size: 2rem; font-weight: 800; color: var(--text); margin-top: 12px; font-family: var(--font-heading); }
        .prayer-card { text-align: center; }
        .prayer-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
        .prayer-time-value { font-size: 1.5rem; font-weight: 700; color: var(--accent); margin-top: 8px; font-family: var(--font-heading); }
        .prayer-active { border-color: var(--primary) !important; box-shadow: var(--shadow-glow); }
        .qibla-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 32px; }
        .qibla-compass-wrapper { display: flex; align-items: center; justify-content: center; gap: 40px; flex-wrap: wrap; }
        .qibla-compass { position: relative; width: 280px; height: 280px; flex-shrink: 0; }
        .qibla-svg { width: 100%; height: 100%; filter: drop-shadow(0 0 20px rgba(13,107,75,0.15)); }
        .compass-live-badge { position: absolute; top: -8px; right: -8px; background: var(--success); color: white; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .compass-live-dot { width: 6px; height: 6px; background: white; border-radius: 50%; animation: pulse 1s infinite; }
        .qibla-info { display: flex; flex-direction: column; gap: 12px; min-width: 200px; }
        .qibla-info-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
        .qibla-info-label { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .qibla-info-value { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--primary-light); line-height: 1; }
        .qibla-info-sub { font-size: 0.8rem; color: var(--text-muted); }
        @media (max-width: 768px) {
          .qibla-compass-wrapper { flex-direction: column; }
          .qibla-info { width: 100%; }
          .prayer-notif-bar { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
