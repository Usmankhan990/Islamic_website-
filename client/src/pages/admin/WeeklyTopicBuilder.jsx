import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSurahs, getSurah } from '../../services/quranApi';

export default function WeeklyTopicBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', content_type: 'quran',
    target_audience: 'all', difficulty: 'beginner',
    week_start: new Date().toISOString().split('T')[0],
    week_end: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  // Content picker state
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState('');
  const [fromVerse, setFromVerse] = useState(1);
  const [toVerse, setToVerse] = useState(7);
  const [surahInfo, setSurahInfo] = useState(null);
  const [previewVerses, setPreviewVerses] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Hadith state
  const [hadithCollection, setHadithCollection] = useState('bukhari');
  const [hadithFrom, setHadithFrom] = useState(1);
  const [hadithTo, setHadithTo] = useState(5);
  const [hadithPreview, setHadithPreview] = useState([]);

  // Custom state
  const [customQuestions, setCustomQuestions] = useState([{ question_text: '', options: ['', '', '', ''], correct_answer: '' }]);

  // Load surahs on mount
  useEffect(() => {
    getSurahs().then(list => setSurahs(list)).catch(() => {});
  }, []);

  // When surah changes, update info
  useEffect(() => {
    if (selectedSurah) {
      const info = surahs.find(s => s.number == selectedSurah);
      setSurahInfo(info);
      if (info) { setToVerse(Math.min(toVerse, info.numberOfAyahs)); }
    }
  }, [selectedSurah]);

  // Preview Quran verses
  const previewContent = async () => {
    if (form.content_type === 'quran' && selectedSurah) {
      setLoadingPreview(true);
      try {
        const data = await getSurah(selectedSurah, 'en.asad');
        const verses = data.ayahs.filter(a => a.numberInSurah >= fromVerse && a.numberInSurah <= toVerse);
        setPreviewVerses(verses);
      } catch { }
      setLoadingPreview(false);
    }
  };

  // Save
  const save = async () => {
    setSaving(true);
    try {
      let content_data = {};
      if (form.content_type === 'quran') {
        content_data = {
          surah: parseInt(selectedSurah),
          surahName: surahInfo?.englishName || `Surah ${selectedSurah}`,
          fromVerse, toVerse,
          verses: previewVerses.map(v => ({ verse: v.numberInSurah, text: v.text, translation: v.text }))
        };
      } else if (form.content_type === 'hadith') {
        content_data = {
          collection: hadithCollection, fromNumber: hadithFrom, toNumber: hadithTo,
          hadiths: hadithPreview.length > 0 ? hadithPreview : [{ text: `Hadith ${hadithFrom}-${hadithTo} from ${hadithCollection}`, collection: hadithCollection }]
        };
      } else {
        content_data = { questions: customQuestions };
      }

      const title = form.title || (form.content_type === 'quran'
        ? `Week: ${surahInfo?.englishName || 'Quran'} (${fromVerse}-${toVerse})`
        : form.content_type === 'hadith'
          ? `Week: ${hadithCollection} Hadith ${hadithFrom}-${hadithTo}`
          : 'Custom Weekly Topic');

      await api.post('/weekly-topics', { ...form, title, content_data });
      navigate('/admin/weekly');
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  return (
    <div className="page container">
      <h1 className="heading-xl" style={{ marginBottom: 8 }}>📚 Create Weekly Topic</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>Select content for this week's learning assignment</p>

      {/* Step Indicator */}
      <div className="wtb-steps">
        {['Content Type', 'Select Content', 'Settings & Save'].map((s, i) => (
          <button key={i} className={`wtb-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`} onClick={() => setStep(i + 1)}>
            <span className="wtb-step-num">{step > i + 1 ? '✓' : i + 1}</span>
            <span>{s}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Content Type */}
      {step === 1 && (
        <div className="animate-slide-up">
          <h2 className="heading-md" style={{ marginBottom: 20 }}>What content will you assign?</h2>
          <div className="wtb-type-grid">
            {[
              { type: 'quran', icon: '📖', title: 'Quran Verses', desc: 'Assign Surah/verses with translation for memorization & understanding' },
              { type: 'hadith', icon: '📚', title: 'Hadith', desc: 'Assign Hadith from trusted collections for study' },
              { type: 'custom', icon: '✏️', title: 'Custom Content', desc: 'Write your own questions and content' }
            ].map(t => (
              <div key={t.type} className={`wtb-type-card ${form.content_type === t.type ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, content_type: t.type })}>
                <span className="wtb-type-icon">{t.icon}</span>
                <h3 className="heading-sm">{t.title}</h3>
                <p className="text-sm text-muted">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="wtb-audience-bar">
            <span className="text-sm" style={{ fontWeight: 600 }}>Target Audience:</span>
            {['kids', 'adults', 'all'].map(a => (
              <button key={a} className={`badge ${form.target_audience === a ? 'badge-primary' : ''}`}
                onClick={() => setForm({ ...form, target_audience: a })} style={{ cursor: 'pointer', padding: '6px 16px', fontSize: '0.85rem' }}>
                {a === 'kids' ? '🧒 Kids' : a === 'adults' ? '👨 Adults' : '👨‍👩‍👧‍👦 All'}
              </button>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} style={{ marginTop: 24 }}>Next: Select Content →</button>
        </div>
      )}

      {/* Step 2: Content Selection */}
      {step === 2 && (
        <div className="animate-slide-up">
          {form.content_type === 'quran' && (
            <div>
              <h2 className="heading-md" style={{ marginBottom: 20 }}>📖 Select Quran Verses</h2>
              <div className="card" style={{ padding: 24 }}>
                <div className="form-group">
                  <label className="form-label">Surah</label>
                  <select className="form-select" value={selectedSurah} onChange={e => setSelectedSurah(e.target.value)}>
                    <option value="">— Choose a Surah —</option>
                    {surahs.map(s => (
                      <option key={s.number} value={s.number}>{s.number}. {s.englishName} ({s.name}) — {s.numberOfAyahs} verses</option>
                    ))}
                  </select>
                </div>

                {surahInfo && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">From Verse</label>
                      <input type="number" className="form-input" min={1} max={surahInfo.numberOfAyahs} value={fromVerse} onChange={e => setFromVerse(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">To Verse</label>
                      <input type="number" className="form-input" min={fromVerse} max={surahInfo.numberOfAyahs} value={toVerse} onChange={e => setToVerse(parseInt(e.target.value) || fromVerse)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Verses</label>
                      <div className="form-input" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--primary-light)' }}>
                        {toVerse - fromVerse + 1} verses
                      </div>
                    </div>
                  </div>
                )}

                {selectedSurah && (
                  <button className="btn btn-outline" onClick={previewContent} disabled={loadingPreview}>
                    {loadingPreview ? '⏳ Loading...' : '👁️ Preview Verses'}
                  </button>
                )}
              </div>

              {previewVerses.length > 0 && (
                <div className="card" style={{ marginTop: 16, maxHeight: 300, overflowY: 'auto' }}>
                  <h4 className="heading-sm" style={{ marginBottom: 12 }}>Preview ({previewVerses.length} verses)</h4>
                  {previewVerses.map((v, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="badge badge-primary" style={{ marginRight: 8 }}>{v.numberInSurah}</span>
                      <span className="text-sm">{v.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.content_type === 'hadith' && (
            <div>
              <h2 className="heading-md" style={{ marginBottom: 20 }}>📚 Select Hadith</h2>
              <div className="card" style={{ padding: 24 }}>
                <div className="form-group">
                  <label className="form-label">Collection</label>
                  <select className="form-select" value={hadithCollection} onChange={e => setHadithCollection(e.target.value)}>
                    <option value="bukhari">Sahih Bukhari</option>
                    <option value="muslim">Sahih Muslim</option>
                    <option value="abudawud">Sunan Abu Dawud</option>
                    <option value="tirmidhi">Jami at-Tirmidhi</option>
                    <option value="nasai">Sunan an-Nasa'i</option>
                    <option value="ibnmajah">Sunan Ibn Majah</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">From Hadith #</label>
                    <input type="number" className="form-input" min={1} value={hadithFrom} onChange={e => setHadithFrom(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Hadith #</label>
                    <input type="number" className="form-input" min={hadithFrom} value={hadithTo} onChange={e => setHadithTo(parseInt(e.target.value) || hadithFrom)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {form.content_type === 'custom' && (
            <div>
              <h2 className="heading-md" style={{ marginBottom: 20 }}>✏️ Custom Questions</h2>
              {customQuestions.map((q, qi) => (
                <div key={qi} className="card" style={{ marginBottom: 12, padding: 20 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                    <h4 className="heading-sm">Question {qi + 1}</h4>
                    {customQuestions.length > 1 && (
                      <button className="btn btn-sm btn-danger" onClick={() => setCustomQuestions(customQuestions.filter((_, i) => i !== qi))}>🗑️</button>
                    )}
                  </div>
                  <div className="form-group">
                    <input className="form-input" placeholder="Question text..." value={q.question_text}
                      onChange={e => { const u = [...customQuestions]; u[qi].question_text = e.target.value; setCustomQuestions(u); }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.options.map((opt, oi) => (
                      <input key={oi} className="form-input" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt}
                        onChange={e => { const u = [...customQuestions]; u[qi].options[oi] = e.target.value; setCustomQuestions(u); }}
                        style={{ fontSize: '0.9rem', padding: '10px 14px' }} />
                    ))}
                  </div>
                  <div className="form-group" style={{ marginTop: 8 }}>
                    <select className="form-select" value={q.correct_answer} onChange={e => { const u = [...customQuestions]; u[qi].correct_answer = e.target.value; setCustomQuestions(u); }}>
                      <option value="">Select correct answer</option>
                      {q.options.filter(Boolean).map((o, i) => <option key={i} value={o}>{String.fromCharCode(65 + i)}: {o}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button className="btn btn-outline" onClick={() => setCustomQuestions([...customQuestions, { question_text: '', options: ['', '', '', ''], correct_answer: '' }])}>
                ➕ Add Question
              </button>
            </div>
          )}

          <div className="flex gap-md" style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Next: Settings →</button>
          </div>
        </div>
      )}

      {/* Step 3: Settings & Save */}
      {step === 3 && (
        <div className="animate-slide-up">
          <h2 className="heading-md" style={{ marginBottom: 20 }}>⚙️ Topic Settings</h2>
          <div className="card" style={{ padding: 24, maxWidth: 600 }}>
            <div className="form-group">
              <label className="form-label">Topic Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={form.content_type === 'quran' ? `e.g., Week of ${surahInfo?.englishName || 'Al-Fatiha'}` : 'Weekly Learning Topic'} />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description for students..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="beginner">🟢 Beginner</option>
                  <option value="intermediate">🟡 Intermediate</option>
                  <option value="advanced">🔴 Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Audience</label>
                <select className="form-select" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })}>
                  <option value="kids">🧒 Kids</option>
                  <option value="adults">👨 Adults</option>
                  <option value="all">👨‍👩‍👧‍👦 All</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Week Start</label>
                <input type="date" className="form-input" value={form.week_start} onChange={e => setForm({ ...form, week_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Week End</label>
                <input type="date" className="form-input" value={form.week_end} onChange={e => setForm({ ...form, week_end: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{ marginTop: 16, padding: 20, borderLeft: '3px solid var(--primary)' }}>
            <h4 className="heading-sm" style={{ marginBottom: 12 }}>📋 Summary</h4>
            <div className="text-sm text-muted" style={{ lineHeight: 2 }}>
              <div><strong>Type:</strong> {form.content_type}</div>
              <div><strong>Audience:</strong> {form.target_audience}</div>
              <div><strong>Difficulty:</strong> {form.difficulty}</div>
              <div><strong>Period:</strong> {form.week_start} → {form.week_end}</div>
              {form.content_type === 'quran' && selectedSurah && (
                <div><strong>Content:</strong> {surahInfo?.englishName} verses {fromVerse}-{toVerse} ({toVerse - fromVerse + 1} verses)</div>
              )}
              {form.content_type === 'hadith' && (
                <div><strong>Content:</strong> {hadithCollection} #{hadithFrom}-{hadithTo}</div>
              )}
              {form.content_type === 'custom' && (
                <div><strong>Content:</strong> {customQuestions.length} custom question(s)</div>
              )}
            </div>
          </div>

          <div className="flex gap-md" style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-accent btn-lg" onClick={save} disabled={saving}>
              {saving ? '⏳ Creating...' : '🚀 Create Weekly Topic'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .wtb-steps { display: flex; gap: 8px; margin-bottom: 32px; }
        .wtb-step {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: var(--radius-md);
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text-muted); font-weight: 500; cursor: pointer;
          transition: var(--transition); flex: 1; justify-content: center;
        }
        .wtb-step.active { border-color: var(--primary); color: var(--primary-light); background: rgba(13,107,75,0.1); }
        .wtb-step.done { border-color: var(--success); color: var(--success); }
        .wtb-step-num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface-light); font-weight: 700; font-size: 0.85rem;
        }
        .wtb-step.active .wtb-step-num { background: var(--primary); color: white; }
        .wtb-step.done .wtb-step-num { background: var(--success); color: white; }
        .wtb-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .wtb-type-card {
          background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-lg);
          padding: 28px; text-align: center; cursor: pointer; transition: var(--transition);
        }
        .wtb-type-card:hover { border-color: var(--primary); transform: translateY(-4px); }
        .wtb-type-card.selected { border-color: var(--primary); background: rgba(13,107,75,0.08); box-shadow: var(--shadow-glow); }
        .wtb-type-icon { font-size: 2.5rem; display: block; margin-bottom: 12px; }
        .wtb-audience-bar { display: flex; align-items: center; gap: 12px; margin-top: 24px; padding: 16px; background: var(--surface); border-radius: var(--radius-md); }
        @media (max-width: 768px) {
          .wtb-type-grid { grid-template-columns: 1fr; }
          .wtb-steps { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
