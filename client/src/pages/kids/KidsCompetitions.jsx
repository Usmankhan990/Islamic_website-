import { useState, useEffect, useRef } from 'react';
import api, { API_BASE } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

// Uploaded files are served from the API server root (not /api)
const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
import { useAuth } from '../../context/AuthContext';

export default function KidsCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedComp, setSelectedComp] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showRecorder, setShowRecorder] = useState(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  // Audio recorder state
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    api.get('/competitions').then(r => { setCompetitions(r.data.competitions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? competitions : competitions.filter(c => c.status === filter);
  const statusColors = { upcoming: '#3B82F6', live: '#22C55E', completed: '#A855F7', cancelled: '#EF4444' };
  const typeIcons = { recitation: '🎤', quiz: '❓', hadith: '📚', general: '🌟' };

  const joinCompetition = async (id) => {
    try {
      await api.post(`/competitions/${id}/join`);
      alert(t('Successfully joined!') + ' 🎉');
    } catch (err) {
      alert(t(err.response?.data?.message || 'Failed to join'));
    }
  };

  const viewEntries = async (comp) => {
    setSelectedComp(comp);
    try {
      const r = await api.get(`/competitions/${comp.id}`);
      setEntries(r.data.entries || []);
    } catch { setEntries([]); }
  };

  const voteForEntry = async (entryId) => {
    try {
      const r = await api.post(`/competitions/entries/${entryId}/vote`);
      alert(t(r.data.message));
      if (selectedComp) viewEntries(selectedComp);
    } catch (err) {
      alert(t(err.response?.data?.message || 'Failed to vote'));
    }
  };

  // Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert(t('Microphone access denied. Please allow microphone access to record.'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const submitRecording = async (compId) => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recitation.webm');
      await api.post(`/competitions/${compId}/submit-recording`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(t('Recording submitted!') + ' 🎉');
      setShowRecorder(null);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) {
      alert(t(err.response?.data?.message || 'Upload failed'));
    }
    setUploading(false);
  };

  const cancelRecording = () => {
    setShowRecorder(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording(false);
  };

  const getTimeStatus = (comp) => {
    const now = new Date();
    const start = new Date(comp.start_time);
    const end = new Date(comp.end_time);
    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      return days > 0 ? t('Starts in {d}d {h}h', { d: days, h: hours }) : t('Starts in {h}h', { h: hours });
    }
    if (now >= start && now <= end) return '🔴 ' + t('LIVE NOW');
    return t('Ended');
  };

  return (
    <div className="page container">
      <div className="text-center" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800 }}>
          🏅 {t('Competitions')}
        </h1>
        <p className="text-muted">
          {t('Join Islamic quizzes, Quran recitation, and Hadith competitions — win prizes!')} 🎁
        </p>
      </div>

      <div className="comp-tabs">
        {[['all', '🌟', 'All'], ['upcoming', '📅', 'Upcoming'], ['live', '🔴', 'Live'], ['completed', '✅', 'Completed']].map(([k, icon, l]) => (
          <button key={k} className={`comp-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{icon} {t(l)}</button>
        ))}
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="comp-grid">
          {filtered.map((c, i) => (
            <div key={c.id} className="comp-card" style={{ '--comp-color': statusColors[c.status], animationDelay: `${i * 0.1}s` }}>
              <div className="comp-card-header">
                <span className="comp-type-icon">{typeIcons[c.type]}</span>
                <span className="comp-status-badge" style={{ background: `${statusColors[c.status]}22`, color: statusColors[c.status] }}>
                  {t(c.status).toUpperCase()}
                </span>
              </div>
              <h3 className="comp-card-title">{c.title}</h3>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>{c.description}</p>
              <div className="comp-card-info">
                <div>📅 {new Date(c.start_time).toLocaleString()}</div>
                <div>⏱️ {getTimeStatus(c)}</div>
                <div>👥 {t('{n} participants', { n: c.participant_count ?? 0 })}</div>
                {c.prize_description && <div>🎁 {t('Prize')}: {c.prize_description}</div>}
              </div>
              <div className="comp-card-actions">
                {user && (c.status === 'upcoming' || c.status === 'live') && (
                  <button className="btn btn-primary btn-sm" onClick={() => joinCompetition(c.id)}>🏅 {t('Join')}</button>
                )}
                {user && c.type === 'recitation' && (c.status === 'upcoming' || c.status === 'live') && (
                  <button className="btn btn-accent btn-sm" onClick={() => setShowRecorder(c.id)}>🎤 {t('Submit Recording')}</button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => viewEntries(c)}>👀 {t('View Entries')}</button>
              </div>

              {/* Audio Recorder */}
              {showRecorder === c.id && (
                <div className="recorder-panel">
                  <h4 style={{ marginBottom: 12, fontWeight: 700 }}>🎤 {t('Record Your Recitation')}</h4>
                  <div className="recorder-controls">
                    {!recording && !audioUrl && (
                      <button className="recorder-btn recorder-btn-start" onClick={startRecording}>
                        <span className="rec-dot"></span> {t('Start Recording')}
                      </button>
                    )}
                    {recording && (
                      <button className="recorder-btn recorder-btn-stop" onClick={stopRecording}>
                        ⏹️ {t('Stop Recording')}
                        <span className="rec-pulse"></span>
                      </button>
                    )}
                    {audioUrl && !recording && (
                      <div className="recorder-preview">
                        <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 8 }} />
                        <div className="flex gap-sm" style={{ marginTop: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => submitRecording(c.id)} disabled={uploading}>
                            {uploading ? '⏳ ' + t('Uploading...') : '✅ ' + t('Submit')}
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setAudioBlob(null); setAudioUrl(null); }}>🔄 {t('Re-record')}</button>
                          <button className="btn btn-danger btn-sm" onClick={cancelRecording}>✕ {t('Cancel')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center" style={{ gridColumn: '1 / -1', padding: 60 }}>
              <span style={{ fontSize: '4rem' }}>🏅</span>
              <p className="text-muted" style={{ marginTop: 16 }}>{t('No competitions found')}</p>
            </div>
          )}
        </div>
      )}

      {/* Entries / Voting Modal */}
      {selectedComp && (
        <div className="entries-overlay" onClick={() => setSelectedComp(null)}>
          <div className="entries-modal" onClick={e => e.stopPropagation()}>
            <div className="entries-modal-header">
              <h3>📊 {selectedComp.title} — {t('Entries')}</h3>
              <button className="entries-close" onClick={() => setSelectedComp(null)}>✕</button>
            </div>
            <div className="entries-list">
              {entries.length === 0 ? (
                <p className="text-center text-muted" style={{ padding: 40 }}>{t('No entries yet')}</p>
              ) : entries.map((entry, i) => (
                <div key={entry.id} className="entry-item">
                  <span className="entry-rank">{i + 1}</span>
                  <div className="entry-info">
                    <span className="entry-name">{entry.name}</span>
                    {entry.audio_url && (
                      <audio controls src={`${SERVER_ORIGIN}${entry.audio_url}`} style={{ height: 32, width: '100%', marginTop: 4 }} />
                    )}
                  </div>
                  <div className="entry-votes">
                    <span className="entry-vote-count">{entry.vote_count || 0} 🗳️</span>
                    {user && user.id !== entry.user_id && (
                      <button className="btn btn-sm btn-primary" onClick={() => voteForEntry(entry.id)}>{t('Vote')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .comp-tabs { display: flex; gap: 8px; margin-bottom: 24px; justify-content: center; flex-wrap: wrap; }
        .comp-tab {
          padding: 8px 18px; border-radius: var(--radius-full); font-weight: 600; font-size: 0.9rem;
          background: var(--surface); border: 1px solid var(--border); color: var(--text-muted);
          cursor: pointer; transition: var(--transition);
        }
        .comp-tab:hover { border-color: var(--primary); }
        .comp-tab.active { background: var(--primary); border-color: var(--primary); color: white; }
        .comp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
        .comp-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
          padding: 24px; border-top: 3px solid var(--comp-color); animation: slideUp 0.5s ease both;
          transition: var(--transition);
        }
        .comp-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
        .comp-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .comp-type-icon { font-size: 2rem; }
        .comp-status-badge { padding: 4px 12px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.75rem; }
        .comp-card-title { font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; }
        .comp-card-info { font-size: 0.85rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 16px; }
        .comp-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .recorder-panel {
          margin-top: 16px; padding: 16px; background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }
        .recorder-controls { display: flex; flex-direction: column; gap: 8px; }
        .recorder-btn {
          padding: 12px 24px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.9rem;
          cursor: pointer; border: none; display: flex; align-items: center; gap: 8px; justify-content: center;
          transition: var(--transition);
        }
        .recorder-btn-start { background: var(--primary); color: white; }
        .recorder-btn-start:hover { background: var(--primary-light); }
        .recorder-btn-stop { background: #EF4444; color: white; position: relative; }
        .rec-dot { width: 12px; height: 12px; background: #EF4444; border-radius: 50%; border: 2px solid white; }
        .rec-pulse { position: absolute; top: 50%; left: 20px; width: 12px; height: 12px; background: white; border-radius: 50%; animation: pulse 1s infinite; transform: translateY(-50%); }
        .recorder-preview { margin-top: 8px; }

        .entries-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .entries-modal {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl);
          width: 100%; max-width: 600px; max-height: 80vh; overflow: auto;
        }
        .entries-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface);
        }
        .entries-close { background: var(--surface-light); border: none; color: var(--text); padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; }
        .entries-list { padding: 16px 24px; }
        .entry-item {
          display: flex; align-items: center; gap: 14px; padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .entry-item:last-child { border-bottom: none; }
        .entry-rank {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          background: var(--surface-light); border-radius: 50%; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
        }
        .entry-info { flex: 1; min-width: 0; }
        .entry-name { font-weight: 600; display: block; }
        .entry-votes { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .entry-vote-count { font-weight: 700; color: var(--accent); }
        @media (max-width: 768px) {
          .comp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
