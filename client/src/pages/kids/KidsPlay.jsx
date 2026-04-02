import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function KidsPlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    api.get(`/games/${id}`).then(r => {
      setGame(r.data.game);
      setQuestions(r.data.questions);
      setLoading(false);
    }).catch(() => { navigate('/kids/games'); });
  }, [id]);

  const handleAnswer = (answer) => {
    const q = questions[current];
    const isCorrect = answer === q.correct_answer;
    setSelected(answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setAnswers([...answers, { question_id: q.id, answer }]);

    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        submitResults([...answers, { question_id: q.id, answer }]);
      }
    }, 1200);
  };

  const submitResults = async (allAnswers) => {
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const res = await api.post(`/games/${id}/play`, { answers: allAnswers, time_taken: timeTaken });
      setResults(res.data);
      if (res.data.percentage >= 80) setShowConfetti(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="page"><div className="loader"><div className="spinner"></div></div></div>;

  // Results screen
  if (results) {
    const pct = results.percentage;
    const emoji = pct === 100 ? '🌟' : pct >= 80 ? '🎉' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📚';
    return (
      <div className="page container">
        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                background: ['#FF6B6B','#4ECDC4','#FBBF24','#A855F7','#22C55E','#3B82F6'][Math.floor(Math.random()*6)]
              }} />
            ))}
          </div>
        )}
        <div className="results-card animate-slide-up text-center">
          <span style={{ fontSize: '5rem' }}>{emoji}</span>
          <h1 style={{ fontFamily: 'var(--font-kids)', fontSize: '2.5rem', marginTop: 16 }}>
            {pct === 100 ? 'PERFECT SCORE!' : pct >= 80 ? 'Amazing Job!' : pct >= 60 ? 'Good Work!' : 'Keep Practicing!'}
          </h1>
          <div className="results-score">
            <span className="results-score-value">{results.score}</span>
            <span className="results-score-total">/ {results.totalPoints}</span>
          </div>
          <div className="results-pct" style={{ color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)' }}>
            {pct}%
          </div>
          <p className="text-muted" style={{ margin: '16px 0' }}>
            {results.correctAnswers} of {results.totalQuestions} correct
          </p>
          <div className="flex gap-md justify-center" style={{ marginTop: 24 }}>
            <button className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>🔄 Play Again</button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/kids/games')}>🎮 More Games</button>
          </div>
        </div>

        <style>{`
          .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }
          .confetti-piece { position: absolute; top: -10px; width: 10px; height: 10px; border-radius: 2px; animation: confetti-fall 3s ease-out forwards; }
          .results-card { max-width: 500px; margin: 0 auto; background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-xl); padding: 48px; }
          .results-score { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-top: 24px; }
          .results-score-value { font-family: var(--font-kids); font-size: 4rem; font-weight: 800; color: var(--accent); }
          .results-score-total { font-size: 1.5rem; color: var(--text-muted); }
          .results-pct { font-family: var(--font-kids); font-size: 2rem; font-weight: 800; }
        `}</style>
      </div>
    );
  }

  // Game UI
  const q = questions[current];
  const options = q.options_json ? (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json) : [];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="page container">
      <div className="play-wrapper animate-fade-in">
        {/* Header */}
        <div className="play-header">
          <h2 style={{ fontFamily: 'var(--font-kids)', fontSize: '1.3rem' }}>{game.title}</h2>
          <span className="text-muted">{current + 1} / {questions.length}</span>
        </div>
        <div className="play-progress-bar">
          <div className="play-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question */}
        <div className="play-question animate-slide-up" key={current}>
          <h3 className="play-question-text">{q.question_text}</h3>
        </div>

        {/* Options */}
        <div className="play-options">
          {options.map((opt, i) => {
            let cls = 'play-option';
            if (feedback && opt === q.correct_answer) cls += ' correct';
            else if (feedback && opt === selected && opt !== q.correct_answer) cls += ' wrong';
            
            return (
              <button key={i} className={cls} onClick={() => !feedback && handleAnswer(opt)} disabled={!!feedback}>
                <span className="play-option-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`play-feedback ${feedback}`} style={{ animation: 'scaleIn 0.3s ease' }}>
            {feedback === 'correct' ? '✅ Correct! Mashallah!' : `❌ The answer is: ${q.correct_answer}`}
          </div>
        )}
      </div>

      <style>{`
        .play-wrapper { max-width: 700px; margin: 0 auto; }
        .play-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .play-progress-bar { height: 8px; background: var(--surface-light); border-radius: 4px; margin-bottom: 32px; overflow: hidden; }
        .play-progress-fill { height: 100%; background: linear-gradient(90deg, var(--kids-primary), var(--kids-accent)); border-radius: 4px; transition: width 0.5s ease; }
        .play-question { text-align: center; margin-bottom: 32px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); }
        .play-question-text { font-family: var(--font-kids); font-size: 1.4rem; font-weight: 700; line-height: 1.6; }
        .play-options { display: flex; flex-direction: column; gap: 12px; }
        .play-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          color: var(--text);
          font-size: 1rem;
          font-weight: 500;
          transition: var(--transition);
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .play-option:hover:not(:disabled) { border-color: var(--kids-accent); background: var(--surface-light); transform: translateX(4px); }
        .play-option.correct { border-color: var(--success); background: rgba(34,197,94,0.15); animation: bounce 0.5s; }
        .play-option.wrong { border-color: var(--error); background: rgba(239,68,68,0.15); animation: shake 0.5s; }
        .play-option-letter {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-light);
          border-radius: 50%;
          font-weight: 800;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .play-feedback { text-align: center; margin-top: 20px; padding: 16px; border-radius: var(--radius-md); font-family: var(--font-kids); font-weight: 700; font-size: 1.1rem; }
        .play-feedback.correct { background: rgba(34,197,94,0.1); color: var(--success); }
        .play-feedback.wrong { background: rgba(239,68,68,0.1); color: var(--error); }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
      `}</style>
    </div>
  );
}
