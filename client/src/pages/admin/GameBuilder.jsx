import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function GameBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [game, setGame] = useState({ title: '', description: '', type: 'quiz', difficulty: 'easy' });
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/games/${id}`).then(r => {
        setGame(r.data.game);
        setQuestions(r.data.questions.map(q => ({
          ...q,
          options: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json || ['', '', '', '']
        })));
      }).catch(() => navigate('/admin/games'));
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', points: 10 }]);
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...game, questions };
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

  return (
    <div className="page container">
      <h1 className="heading-xl" style={{ marginBottom: 8 }}>{isEdit ? '✏️ Edit Game' : '🎮 Create New Game'}</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>Design interactive games for children to play</p>

      {/* Steps Indicator */}
      <div className="builder-steps">
        {['Game Details', 'Add Questions', 'Review & Save'].map((s, i) => (
          <button key={i} className={`builder-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`} onClick={() => setStep(i + 1)}>
            <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="step-label">{s}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Game Details */}
      {step === 1 && (
        <div className="card animate-slide-up" style={{ maxWidth: 600 }}>
          <div className="form-group">
            <label className="form-label">Game Title</label>
            <input className="form-input" value={game.title} onChange={e => setGame({ ...game, title: e.target.value })} placeholder="e.g., Surah Al-Fatiha Quiz" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={game.description} onChange={e => setGame({ ...game, description: e.target.value })} placeholder="What will children learn?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Game Type</label>
              <select className="form-select" value={game.type} onChange={e => setGame({ ...game, type: e.target.value })}>
                <option value="quiz">❓ Quiz</option>
                <option value="matching">🧩 Matching</option>
                <option value="fill_blank">✏️ Fill in Blank</option>
                <option value="drag_drop">🎯 Drag & Drop</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={game.difficulty} onChange={e => setGame({ ...game, difficulty: e.target.value })}>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} disabled={!game.title}>Next: Add Questions →</button>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="animate-slide-up">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3 className="heading-md">Questions ({questions.length})</h3>
            <button className="btn btn-primary" onClick={addQuestion}>➕ Add Question</button>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="card" style={{ marginBottom: 16 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <h4 className="heading-sm">Question {i + 1}</h4>
                <button className="btn btn-sm btn-danger" onClick={() => removeQuestion(i)}>🗑️</button>
              </div>
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
                  <input type="number" className="form-input" value={q.points} onChange={e => updateQuestion(i, 'points', parseInt(e.target.value))} />
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="card text-center" style={{ padding: 40 }}>
              <p className="text-muted">No questions yet. Click "Add Question" to start!</p>
            </div>
          )}

          <div className="flex gap-md" style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={questions.length === 0}>Next: Review →</button>
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
                <p>{game.type} / {game.difficulty}</p>
              </div>
            </div>
            <p className="text-sm text-muted" style={{ marginTop: 12 }}>Description:</p>
            <p>{game.description || '(none)'}</p>
            <p className="text-sm text-muted" style={{ marginTop: 12 }}>Questions: <strong>{questions.length}</strong></p>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="card" style={{ marginBottom: 8, padding: 16 }}>
              <div className="flex justify-between">
                <span><strong>Q{i + 1}.</strong> {q.question_text}</span>
                <span className="badge badge-success">✓ {q.correct_answer}</span>
              </div>
            </div>
          ))}

          <div className="flex gap-md" style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-accent btn-lg" onClick={save} disabled={saving}>
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
        @media (max-width: 768px) {
          .builder-steps { flex-direction: column; }
          .step-label { display: inline; }
        }
      `}</style>
    </div>
  );
}
