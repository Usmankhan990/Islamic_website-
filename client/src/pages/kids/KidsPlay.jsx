import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MemoryGame from '../../components/games/MemoryGame';
import WordJumble from '../../components/games/WordJumble';
import { useLanguage } from '../../i18n/LanguageContext';

export default function KidsPlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { t } = useLanguage();
  const [game, setGame] = useState(null);
  const [levelInfo, setLevelInfo] = useState(null); // { level, levelNumber, totalLevels, completed }
  const [questions, setQuestions] = useState([]);
  const [round, setRound] = useState(0);            // bumps on every (re)start so child games remount
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [showConfetti, setShowConfetti] = useState(false);

  // Load the next level this kid hasn't won yet (won levels are never shown again)
  // Only the latest request may update state; otherwise a slow duplicate response
  // (e.g. StrictMode's double effect) would reshuffle the board mid-game
  const loadSeq = useRef(0);
  const loadNextLevel = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const r = await api.get(`/games/${id}/next-level`);
      if (seq !== loadSeq.current) return;
      setGame(r.data.game);
      setLevelInfo({ level: r.data.level, levelNumber: r.data.levelNumber, totalLevels: r.data.totalLevels, completed: r.data.completed });
      setQuestions(r.data.questions);
      setCurrent(0); setAnswers([]); setSelected(null); setFeedback(null);
      setResults(null); setShowConfetti(false); setStartTime(Date.now());
      setRound((n) => n + 1);
    } catch {
      if (seq === loadSeq.current) navigate('/kids/games');
      return;
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { loadNextLevel(); }, [loadNextLevel]);

  const handleAnswer = (answer) => {
    const q = questions[current];
    const isCorrect = answer === q.correct_answer;
    setSelected(answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    const all = [...answers, { question_id: q.id, answer }];
    setAnswers(all);

    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        submitResults(all);
      }
    }, 1200);
  };

  const submitResults = async (allAnswers) => {
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const res = await api.post(`/games/${id}/play`, { answers: allAnswers, time_taken: timeTaken, level: levelInfo.level });
      setResults(res.data);
      if (res.data.passed) setShowConfetti(true);
      if (res.data.totalCoins !== undefined) updateUser({ coins: res.data.totalCoins });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="page"><div className="loader"><div className="spinner"></div></div></div>;

  // Every level already won
  if (levelInfo?.completed) {
    return (
      <div className="page container">
        <div className="results-card animate-slide-up text-center">
          <span style={{ fontSize: '5rem' }}>🏆</span>
          <h1 style={{ fontFamily: 'var(--font-kids)', fontSize: '2.2rem', marginTop: 16 }}>{t('All {n} levels complete!', { n: levelInfo.totalLevels })}</h1>
          <p className="text-muted" style={{ margin: '12px 0 24px' }}>{t('MashaAllah! You finished every level of {game}.', { game: game.title })}</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/kids/games')}>🎮 {t('More Games')}</button>
        </div>
        <style>{gameStyles}</style>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="page container text-center">
        <p className="text-muted">{t('This game has no questions yet.')}</p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate('/kids/games')}>🎮 {t('More Games')}</button>
      </div>
    );
  }

  // Results screen
  if (results) {
    const pct = results.percentage;
    const emoji = results.gameCompleted ? '🏆' : pct === 100 ? '🌟' : results.passed ? '🎉' : pct >= 40 ? '💪' : '📚';
    const title = results.gameCompleted ? t('Game Complete!')
      : results.passed ? t('Level {n} Complete!', { n: results.levelNumber })
      : t('Keep Practicing!');
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
          <h1 style={{ fontFamily: 'var(--font-kids)', fontSize: '2.5rem', marginTop: 16 }}>{title}</h1>
          <p className="text-muted">{t('Level {n} of {total}', { n: results.levelNumber, total: results.totalLevels })}</p>
          <div className="results-score">
            <span className="results-score-value">{results.score}</span>
            <span className="results-score-total">/ {results.totalPoints}</span>
          </div>
          <div className="results-pct" style={{ color: results.passed ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--error)' }}>
            {pct}%
          </div>
          <p className="text-muted" style={{ margin: '16px 0' }}>
            {t('{n} of {total} correct', { n: results.correctAnswers, total: results.totalQuestions })}
          </p>
          {results.coinsEarned > 0 ? (
            <div className="coin-banner win">
              <span className="coin-big">🪙</span>
              <div>
                <div className="coin-earned">{t('+{n} coins!', { n: results.coinsEarned })}</div>
                <div className="text-sm">{t('Total')}: 🪙 {results.totalCoins}</div>
              </div>
            </div>
          ) : !results.passed && (
            <div className="coin-banner">
              {t('Score {pct}% or more to win {coins} coins. Try again!', { pct: results.passPercentage, coins: '🪙 ' + game.coin_reward })}
            </div>
          )}
          <div className="flex gap-md justify-center" style={{ marginTop: 24, flexWrap: 'wrap' }}>
            {results.passed && !results.gameCompleted && (
              <button className="btn btn-primary btn-lg" onClick={loadNextLevel}>▶ {t('Next Level')}</button>
            )}
            {!results.passed && (
              <button className="btn btn-primary btn-lg" onClick={loadNextLevel}>🔄 {t('Try Again')}</button>
            )}
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/kids/games')}>🎮 {t('More Games')}</button>
          </div>
        </div>
        <style>{gameStyles}</style>
      </div>
    );
  }

  const header = (
    <>
      <div className="play-header">
        <h2 style={{ fontFamily: 'var(--font-kids)', fontSize: '1.3rem' }}>{game.title}</h2>
        <span className="play-reward" title={t('Score {pct}% to win', { pct: game.pass_percentage })}>🪙 {game.coin_reward}</span>
      </div>
      <div className="play-levels">
        {Array.from({ length: levelInfo.totalLevels }).map((_, i) => (
          <span key={i} className={`play-level-dot ${i + 1 < levelInfo.levelNumber ? 'done' : i + 1 === levelInfo.levelNumber ? 'now' : ''}`}>
            {i + 1 < levelInfo.levelNumber ? '✓' : i + 1}
          </span>
        ))}
        <span className="text-sm text-muted">{t('Level {n} of {total}', { n: levelInfo.levelNumber, total: levelInfo.totalLevels })}</span>
      </div>
    </>
  );

  if (game.type === 'memory' || game.type === 'word_jumble') {
    return (
      <div className="page container">
        <div className="play-wrapper animate-fade-in" style={{ maxWidth: game.type === 'memory' ? 760 : 700 }}>
          {header}
          {game.type === 'memory'
            ? <MemoryGame key={round} questions={questions} timeLimit={game.config_json?.time_limit || 60} onFinish={submitResults} />
            : <WordJumble key={round} questions={questions} onFinish={submitResults} />}
        </div>
        <style>{gameStyles}</style>
      </div>
    );
  }

  // Game UI (quiz, true/false and older types)
  const q = questions[current];
  const options = q.options_json ? (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json) : [];
  const progress = ((current + 1) / questions.length) * 100;
  const isTrueFalse = game.type === 'true_false';

  return (
    <div className="page container">
      <div className="play-wrapper animate-fade-in">
        {header}
        <div className="text-muted text-sm" style={{ textAlign: 'right', marginBottom: 6 }}>{current + 1} / {questions.length}</div>
        <div className="play-progress-bar">
          <div className="play-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question */}
        <div className="play-question animate-slide-up" key={current}>
          <h3 className="play-question-text">{q.question_text}</h3>
        </div>

        {/* Options */}
        <div className={`play-options ${isTrueFalse ? 'tf' : ''}`}>
          {options.map((opt, i) => {
            let cls = 'play-option';
            if (feedback && opt === q.correct_answer) cls += ' correct';
            else if (feedback && opt === selected && opt !== q.correct_answer) cls += ' wrong';

            return (
              <button key={i} className={cls} onClick={() => !feedback && handleAnswer(opt)} disabled={!!feedback}>
                {isTrueFalse
                  ? <span>{opt === 'True' ? '✅ ' + t('True') : '❌ ' + t('False')}</span>
                  : <><span className="play-option-letter">{String.fromCharCode(65 + i)}</span><span>{opt}</span></>}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`play-feedback ${feedback}`} style={{ animation: 'scaleIn 0.3s ease' }}>
            {feedback === 'correct' ? '✅ ' + t('Correct! Mashallah!') : '❌ ' + t('The answer is: {answer}', { answer: q.correct_answer })}
          </div>
        )}
      </div>

      <style>{gameStyles}</style>
    </div>
  );
}

const gameStyles = `
  .play-wrapper { max-width: 700px; margin: 0 auto; }
  .play-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 12px; }
  .play-reward { font-family: var(--font-kids); font-weight: 700; color: #FBBF24; white-space: nowrap; }
  .play-levels { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
  .play-level-dot {
    width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
    background: var(--surface-light); color: var(--text-muted); font-size: 0.8rem; font-weight: 800;
  }
  .play-level-dot.done { background: var(--success); color: white; }
  .play-level-dot.now { background: linear-gradient(135deg, var(--kids-primary), var(--kids-accent)); color: white; transform: scale(1.15); }
  .play-progress-bar { height: 8px; background: var(--surface-light); border-radius: 4px; margin-bottom: 32px; overflow: hidden; }
  .play-progress-fill { height: 100%; background: linear-gradient(90deg, var(--kids-primary), var(--kids-accent)); border-radius: 4px; transition: width 0.5s ease; }
  .play-question { text-align: center; margin-bottom: 32px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); }
  .play-question-text { font-family: var(--font-kids); font-size: 1.4rem; font-weight: 700; line-height: 1.6; }
  .play-options { display: flex; flex-direction: column; gap: 12px; }
  .play-options.tf { flex-direction: row; }
  .play-options.tf .play-option { justify-content: center; font-size: 1.4rem; font-family: var(--font-kids); font-weight: 800; padding: 28px; }
  .play-option {
    display: flex; align-items: center; gap: 16px; padding: 18px 24px;
    background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-lg);
    color: var(--text); font-size: 1rem; font-weight: 500; transition: var(--transition);
    cursor: pointer; text-align: start; width: 100%;
  }
  .play-option:hover:not(:disabled) { border-color: var(--kids-accent); background: var(--surface-light); transform: translateX(4px); }
  .play-option.correct { border-color: var(--success); background: rgba(34,197,94,0.15); animation: bounce 0.5s; }
  .play-option.wrong { border-color: var(--error); background: rgba(239,68,68,0.15); animation: shake 0.5s; }
  .play-option-letter {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    background: var(--surface-light); border-radius: 50%; font-weight: 800; font-size: 0.9rem; flex-shrink: 0;
  }
  .play-feedback { text-align: center; margin-top: 20px; padding: 16px; border-radius: var(--radius-md); font-family: var(--font-kids); font-weight: 700; font-size: 1.1rem; }
  .play-feedback.correct { background: rgba(34,197,94,0.1); color: var(--success); }
  .play-feedback.wrong { background: rgba(239,68,68,0.1); color: var(--error); }
  .confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }
  .confetti-piece { position: absolute; top: -10px; width: 10px; height: 10px; border-radius: 2px; animation: confetti-fall 3s ease-out forwards; }
  .results-card { max-width: 500px; margin: 0 auto; background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-xl); padding: 48px; }
  .results-score { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-top: 24px; }
  .results-score-value { font-family: var(--font-kids); font-size: 4rem; font-weight: 800; color: var(--accent); }
  .results-score-total { font-size: 1.5rem; color: var(--text-muted); }
  .results-pct { font-family: var(--font-kids); font-size: 2rem; font-weight: 800; }
  .coin-banner { margin: 8px auto 0; padding: 14px 18px; border-radius: var(--radius-lg); background: var(--surface-light); color: var(--text-muted); font-family: var(--font-kids); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; }
  .coin-banner.win { background: rgba(251,191,36,0.15); color: #FBBF24; border: 2px solid rgba(251,191,36,0.5); animation: scaleIn 0.4s ease; }
  .coin-big { font-size: 2.6rem; }
  .coin-earned { font-size: 1.5rem; font-weight: 800; }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
  @media (max-width: 520px) { .results-card { padding: 28px 20px; } .play-options.tf { flex-direction: column; } }
`;
