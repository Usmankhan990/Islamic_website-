import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { GAME_TYPES, typeConfig, gameLabel } from '../../components/games/gameTypes';

const NEW_GAME = { title: '', description: '', type: 'quiz', difficulty: 'easy', coin_reward: 10, pass_percentage: 80, config_json: { time_limit: 60 } };

export default function GameBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [game, setGame] = useState(NEW_GAME);
  const [questions, setQuestions] = useState([]); // each has a `level`
  const [levelCount, setLevelCount] = useState(1);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const cfg = typeConfig(game.type);
  const isLegacy = GAME_TYPES[game.type]?.legacy;

  useEffect(() => {
    if (isEdit) {
      api.get(`/games/${id}`).then(r => {
        const g = r.data.game;
        setGame({ ...NEW_GAME, ...g, config_json: { time_limit: 60, ...(g.config_json || {}) } });
        const qs = r.data.questions.map(q => ({
          ...q,
          level: q.level || 1,
          options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json || ['', '', '', '']
        }));
        // Renumber levels 1..n in case some were removed
        const levels = [...new Set(qs.map(q => q.level))].sort((a, b) => a - b);
        setQuestions(qs.map(q => ({ ...q, level: levels.indexOf(q.level) + 1 })));
        setLevelCount(Math.max(1, levels.length));
      }).catch(() => navigate('/admin/games'));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeType = (type) => {
    if (type === game.type) return;
    if (questions.length && !confirm('Changing the game type removes the questions you added. Continue?')) return;
    setQuestions([]);
    setLevelCount(1);
    setGame({ ...game, type });
  };

  const addQuestion = (level) => setQuestions([...questions, { ...cfg.newQuestion(), level }]);

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    const options = [...updated[qIdx].options];
    // Keep the chosen correct answer in sync when its text is edited
    if (updated[qIdx].correct_answer === options[optIdx]) updated[qIdx].correct_answer = value;
    options[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options };
    setQuestions(updated);
  };

  const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));

  const addLevel = () => {
    const level = levelCount + 1;
    setLevelCount(level);
    setQuestions([...questions, { ...cfg.newQuestion(), level }]);
  };

  const removeLevel = (level) => {
    if (levelCount === 1) return;
    if (!confirm(`Delete Level ${level} and its questions?`)) return;
    setQuestions(questions.filter(q => q.level !== level).map(q => (q.level > level ? { ...q, level: q.level - 1 } : q)));
    setLevelCount(levelCount - 1);
  };

  // Per-level validation
  const levelProblems = Array.from({ length: levelCount }, (_, i) => {
    const level = i + 1;
    const qs = questions.filter(q => q.level === level);
    if (qs.length === 0) return `Level ${level} has no questions`;
    if (cfg.minQuestions && qs.length < cfg.minQuestions) return `Level ${level} needs at least ${cfg.minQuestions} pairs`;
    if (cfg.maxQuestions && qs.length > cfg.maxQuestions) return `Level ${level} can have at most ${cfg.maxQuestions} pairs`;
    if (qs.some(q => !cfg.isValid(q))) return `Level ${level} has incomplete questions`;
    return null;
  }).filter(Boolean);

  const save = async () => {
    setSaving(true);
    try {
      // Order questions by level so the server keeps them grouped
      const ordered = [...questions].sort((a, b) => a.level - b.level);
      const payload = { ...game, questions: ordered };
      if (isEdit) {
        await api.put(`/games/${id}`, payload);
      } else {
        await api.post('/games', payload);
      }
      navigate('/admin/games');
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  const renderQuestionFields = (q, i) => {
    if (game.type === 'true_false') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Statement</label>
            <input className="form-input" value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} placeholder="e.g., There are 5 daily prayers." />
          </div>
          <div className="form-group">
            <label className="form-label">Answer</label>
            <select className="form-select" value={q.correct_answer} onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}>
              <option value="True">✅ True</option>
              <option value="False">❌ False</option>
            </select>
          </div>
        </div>
      );
    }
    if (game.type === 'memory') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Card A</label>
            <input className="form-input" value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} placeholder="e.g., Fajr" />
          </div>
          <span style={{ paddingBottom: 26, fontSize: '1.3rem' }}>↔</span>
          <div className="form-group">
            <label className="form-label">Matching Card B</label>
            <input className="form-input" value={q.correct_answer} onChange={e => updateQuestion(i, 'correct_answer', e.target.value)} placeholder="e.g., 2 Rakat" />
          </div>
        </div>
      );
    }
    if (game.type === 'word_jumble') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Hint</label>
            <input className="form-input" value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} placeholder="e.g., The month of fasting" />
          </div>
          <div className="form-group">
            <label className="form-label">Answer word</label>
            <input className="form-input" value={q.correct_answer} onChange={e => updateQuestion(i, 'correct_answer', e.target.value)} placeholder="e.g., Ramadan" />
          </div>
        </div>
      );
    }
    // Quiz (and older types)
    return (
      <>
        <div className="form-group">
          <label className="form-label">Question Text</label>
          <input className="form-input" value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)} placeholder="Enter your question..." />
        </div>
        <div className="form-group">
          <label className="form-label">Answer Options</label>
          <div className="flex flex-col gap-sm">
            {q.options.map((opt, j) => (
              <div key={j} className="flex gap-sm items-center">
                <span style={{ width: 28, textAlign: 'center', fontWeight: 700 }}>{String.fromCharCode(65 + j)}</span>
                <input className="form-input" value={opt} onChange={e => updateOption(i, j, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + j)}`} style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Correct Answer</label>
            <select className="form-select" value={q.correct_answer} onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}>
              <option value="">Select correct answer</option>
              {q.options.filter(Boolean).map((opt, j) => (
                <option key={j} value={opt}>{String.fromCharCode(65 + j)}: {opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Points</label>
            <input type="number" className="form-input" value={q.points} onChange={e => updateQuestion(i, 'points', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </>
    );
  };

  const itemName = game.type === 'memory' ? 'Pair' : game.type === 'word_jumble' ? 'Word' : 'Question';

  return (
    <div className="page container">
      <h1 className="heading-xl" style={{ marginBottom: 8 }}>{isEdit ? '✏️ Edit Game' : '🎮 Create New Game'}</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>Design fun mini games for kids — winners earn coins 🪙</p>

      {/* Steps Indicator */}
      <div className="builder-steps">
        {['Game Details', 'Levels & Questions', 'Review & Save'].map((s, i) => (
          <button key={i} className={`builder-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`} onClick={() => setStep(i + 1)}>
            <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="step-label">{s}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Game Details */}
      {step === 1 && (
        <div className="card animate-slide-up" style={{ maxWidth: 680 }}>
          <div className="form-group">
            <label className="form-label">Game Type</label>
            <div className="type-grid">
              {Object.entries(GAME_TYPES).filter(([k, t]) => !t.legacy || k === game.type).map(([key, t]) => (
                <button key={key} type="button" className={`type-card ${game.type === key ? 'active' : ''}`} onClick={() => changeType(key)}>
                  <span style={{ fontSize: '1.8rem' }}>{t.icon}</span>
                  <strong>{t.label}</strong>
                  {t.help && <span className="text-xs text-muted">{t.help}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Game Title</label>
            <input className="form-input" value={game.title} onChange={e => setGame({ ...game, title: e.target.value })} placeholder="e.g., Islamic Months Word Jumble" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={game.description || ''} onChange={e => setGame({ ...game, description: e.target.value })} placeholder="What will children learn?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={game.difficulty} onChange={e => setGame({ ...game, difficulty: e.target.value })}>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">🪙 Coins per level win</label>
              <input type="number" min="0" max="1000" className="form-input" value={game.coin_reward}
                onChange={e => setGame({ ...game, coin_reward: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Score needed to win (%)</label>
              <input type="number" min="1" max="100" className="form-input" value={game.pass_percentage}
                onChange={e => setGame({ ...game, pass_percentage: e.target.value })} />
            </div>
            {game.type === 'memory' && (
              <div className="form-group">
                <label className="form-label">⏱️ Time limit (seconds)</label>
                <input type="number" min="15" max="600" className="form-input" value={game.config_json?.time_limit ?? 60}
                  onChange={e => setGame({ ...game, config_json: { ...game.config_json, time_limit: Math.max(15, parseInt(e.target.value) || 60) } })} />
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => { if (!questions.length) addQuestion(1); setStep(2); }} disabled={!game.title}>
            Next: Add Levels →
          </button>
        </div>
      )}

      {/* Step 2: Levels & Questions */}
      {step === 2 && (
        <div className="animate-slide-up">
          <div className="flex justify-between items-center" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
            <h3 className="heading-md">{GAME_TYPES[game.type]?.icon} {gameLabel(game.type)} — {levelCount} level{levelCount > 1 ? 's' : ''}</h3>
            <button className="btn btn-accent" onClick={addLevel}>➕ Add Level</button>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: 20 }}>
            Kids play one level at a time. A level they win never repeats — next time they start at the next level.
            {cfg.minQuestions && ` Each level needs ${cfg.minQuestions}–${cfg.maxQuestions} pairs.`}
            {isLegacy && ' This older game type plays as a quiz.'}
          </p>

          {Array.from({ length: levelCount }, (_, li) => li + 1).map(level => {
            const levelQs = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.level === level);
            return (
              <div key={level} className="level-block">
                <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                  <h3 className="heading-sm">🏁 Level {level} <span className="text-sm text-muted">({levelQs.length} {itemName.toLowerCase()}{levelQs.length === 1 ? '' : 's'})</span></h3>
                  {levelCount > 1 && <button className="btn btn-sm btn-danger" onClick={() => removeLevel(level)}>Delete level</button>}
                </div>

                {levelQs.map(({ q, i }, n) => (
                  <div key={i} className="card" style={{ marginBottom: 12 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                      <h4 className="heading-sm">{itemName} {n + 1}</h4>
                      <button className="btn btn-sm btn-danger" onClick={() => removeQuestion(i)}>🗑️</button>
                    </div>
                    {renderQuestionFields(q, i)}
                  </div>
                ))}

                <button className="btn btn-outline btn-sm" onClick={() => addQuestion(level)}
                  disabled={cfg.maxQuestions && levelQs.length >= cfg.maxQuestions}>
                  ➕ Add {itemName} to Level {level}
                </button>
              </div>
            );
          })}

          {levelProblems.length > 0 && (
            <div className="builder-error">⚠️ {levelProblems[0]}</div>
          )}

          <div className="flex gap-md" style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={levelProblems.length > 0}>Next: Review →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="animate-slide-up">
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="heading-md" style={{ marginBottom: 16 }}>📋 Game Summary</h3>
            <div className="grid-2 gap-lg">
              <div>
                <p className="text-sm text-muted">Title:</p>
                <p className="heading-sm">{game.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Type / Difficulty:</p>
                <p>{gameLabel(game.type)} / {game.difficulty}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Reward:</p>
                <p>🪙 {game.coin_reward} coins per level (score {game.pass_percentage}%+)</p>
              </div>
              <div>
                <p className="text-sm text-muted">Levels:</p>
                <p>{levelCount} levels • {questions.length} {itemName.toLowerCase()}s{game.type === 'memory' ? ` • ⏱️ ${game.config_json?.time_limit || 60}s per level` : ''}</p>
              </div>
            </div>
            <p className="text-sm text-muted" style={{ marginTop: 12 }}>Description:</p>
            <p>{game.description || '(none)'}</p>
          </div>

          {Array.from({ length: levelCount }, (_, li) => li + 1).map(level => (
            <div key={level} style={{ marginBottom: 16 }}>
              <h4 className="heading-sm" style={{ marginBottom: 8 }}>🏁 Level {level}</h4>
              {questions.filter(q => q.level === level).map((q, i) => (
                <div key={i} className="card" style={{ marginBottom: 8, padding: 16 }}>
                  <div className="flex justify-between" style={{ gap: 12 }}>
                    <span><strong>{i + 1}.</strong> {q.question_text}</span>
                    <span className="badge badge-success">{game.type === 'memory' ? '↔' : '✓'} {q.correct_answer}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="flex gap-md" style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-accent btn-lg" onClick={save} disabled={saving || levelProblems.length > 0}>
              {saving ? 'Saving...' : isEdit ? '💾 Update Game' : '🚀 Publish Game'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .builder-steps { display: flex; gap: 8px; margin-bottom: 32px; }
        .builder-step {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: var(--radius-md);
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text-muted); font-weight: 500; cursor: pointer;
          transition: var(--transition); flex: 1; justify-content: center;
        }
        .builder-step.active { border-color: var(--primary); color: var(--primary-light); background: rgba(13,107,75,0.1); }
        .builder-step.done { border-color: var(--success); color: var(--success); }
        .step-num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface-light); font-weight: 700; font-size: 0.85rem;
        }
        .builder-step.active .step-num { background: var(--primary); color: white; }
        .builder-step.done .step-num { background: var(--success); color: white; }
        .type-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .type-card {
          display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
          padding: 14px 10px; border-radius: var(--radius-md); border: 2px solid var(--border);
          background: var(--surface); color: var(--text); cursor: pointer; transition: var(--transition);
        }
        .type-card:hover { border-color: var(--primary-light); }
        .type-card.active { border-color: var(--primary); background: rgba(13,107,75,0.12); }
        .builder-error { margin-top: 16px; padding: 12px 16px; border-radius: var(--radius-md); background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--error); }
        .level-block { border: 1px dashed var(--border); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px; }
        @media (max-width: 768px) {
          .builder-steps { flex-direction: column; }
          .step-label { display: inline; }
        }
      `}</style>
    </div>
  );
}
