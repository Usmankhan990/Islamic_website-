import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function WeeklyQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    api.get(`/weekly-quizzes/${id}`).then(r => {
      setQuiz(r.data.quiz);
      setQuestions(r.data.questions);
      if (r.data.quiz.time_limit_minutes > 0) {
        setTimeLeft(r.data.quiz.time_limit_minutes * 60);
      }
      setLoading(false);
    }).catch(() => navigate('/weekly'));
  }, [id]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); autoSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer) => {
    const q = questions[current];
    const isCorrect = answer === q.correct_answer;
    setSelected(answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    const newAnswers = [...answers, { question_id: q.id, answer }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        submitResults(newAnswers);
      }
    }, 1200);
  };

  const autoSubmit = () => {
    const allAnswers = [...answers];
    for (let i = answers.length; i < questions.length; i++) {
      allAnswers.push({ question_id: questions[i].id, answer: '' });
    }
    submitResults(allAnswers);
  };

  const submitResults = async (allAnswers) => {
    try {
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await api.post(`/weekly-quizzes/${id}/submit`, { answers: allAnswers, time_taken: timeTaken });
      setResults(res.data);
    } catch (err) {
      // Already submitted
      if (err.response?.data?.message) alert(err.response.data.message);
      navigate('/weekly');
    }
  };

  if (loading) return <div className="page"><div className="loader"><div className="spinner"></div></div></div>;

  // Start screen
  if (!started && !results) {
    return (
      <div className="page container">
        <div className="wq-start animate-slide-up">
          <span style={{ fontSize: '4rem' }}>{quiz.quiz_type === 'live_final' ? '🔴' : '🎮'}</span>
          <h1 className="heading-lg" style={{ marginTop: 16 }}>{quiz.title}</h1>
          <p className="text-muted" style={{ margin: '12px 0 24px' }}>{quiz.topic_title}</p>
          <div className="wq-start-info">
            <div className="wq-info-item"><span className="text-muted">Questions</span><strong>{questions.length}</strong></div>
            {quiz.time_limit_minutes > 0 && (
              <div className="wq-info-item"><span className="text-muted">Time Limit</span><strong>{quiz.time_limit_minutes} min</strong></div>
            )}
            <div className="wq-info-item"><span className="text-muted">Difficulty</span><strong>{quiz.difficulty}</strong></div>
          </div>
          {quiz.quiz_type === 'live_final' && (
            <p className="text-sm" style={{ color: 'var(--warning)', marginBottom: 16 }}>⚠️ This is a LIVE quiz. You can only attempt it once!</p>
          )}
          <button className="btn btn-primary btn-lg" onClick={() => { setStarted(true); startTimeRef.current = Date.now(); }}>
            ▶️ Start Quiz
          </button>
        </div>
        <style>{`
          .wq-start { max-width: 500px; margin: 0 auto; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 48px; }
          .wq-start-info { display: flex; justify-content: center; gap: 32px; margin-bottom: 24px; }
          .wq-info-item { display: flex; flex-direction: column; gap: 4px; }
        `}</style>
      </div>
    );
  }

  // Results screen
  if (results) {
    const pct = results.percentage;
    const emoji = pct === 100 ? '🌟' : pct >= 80 ? '🎉' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📚';
    return (
      <div className="page container">
        <div className="wq-results animate-slide-up text-center">
          <span style={{ fontSize: '5rem' }}>{emoji}</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginTop: 16 }}>
            {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Job!' : 'Keep Learning!'}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6, margin: '24px 0 12px' }}>
            <span style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}>{results.score}</span>
            <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/ {results.totalPoints}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)' }}>
            {pct}%
          </div>
          <p className="text-muted" style={{ margin: '16px 0 24px' }}>
            {results.correctCount} of {results.totalQuestions} correct
          </p>
          <div className="flex gap-md justify-center">
            <Link to={`/weekly/results/${id}`} className="btn btn-primary btn-lg">📊 View Leaderboard</Link>
            <Link to="/weekly" className="btn btn-outline btn-lg">📚 Back to Topics</Link>
          </div>
        </div>
        <style>{`
          .wq-results { max-width: 500px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 48px; }
        `}</style>
      </div>
    );
  }

  // Quiz gameplay
  const q = questions[current];
  const options = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json || [];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="page container">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Timer bar */}
        {timeLeft !== null && (
          <div className="wq-timer-bar" style={{ color: timeLeft < 60 ? 'var(--error)' : 'var(--text)' }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        )}

        {/* Progress */}
        <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>{quiz.title}</h3>
          <span className="text-muted">{current + 1}/{questions.length}</span>
        </div>
        <div style={{ height: 6, background: 'var(--surface-light)', borderRadius: 3, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 3, transition: 'width 0.5s ease' }}></div>
        </div>

        {/* Question */}
        <div className="card text-center animate-fade-in" key={current} style={{ padding: 32, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.5 }}>{q.question_text}</h3>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => {
            let cls = 'wq-option';
            if (feedback && opt === q.correct_answer) cls += ' correct';
            else if (feedback && opt === selected && opt !== q.correct_answer) cls += ' wrong';
            return (
              <button key={i} className={cls} onClick={() => !feedback && handleAnswer(opt)} disabled={!!feedback}>
                <span className="wq-option-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {feedback && q.explanation && (
          <div className="card" style={{ marginTop: 16, padding: 16, borderLeft: '3px solid var(--info)', fontSize: '0.9rem' }}>
            💡 {q.explanation}
          </div>
        )}
      </div>

      <style>{`
        .wq-timer-bar {
          text-align: center; font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800;
          padding: 12px; background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-md); margin-bottom: 24px;
        }
        .wq-option {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 22px; background: var(--surface); border: 2px solid var(--border);
          border-radius: var(--radius-lg); color: var(--text); font-size: 1rem; font-weight: 500;
          transition: var(--transition); cursor: pointer; text-align: left; width: 100%;
        }
        .wq-option:hover:not(:disabled) { border-color: var(--primary); background: var(--surface-light); transform: translateX(4px); }
        .wq-option.correct { border-color: var(--success); background: rgba(34,197,94,0.12); }
        .wq-option.wrong { border-color: var(--error); background: rgba(239,68,68,0.12); }
        .wq-option-letter {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          background: var(--surface-light); border-radius: 50%; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
