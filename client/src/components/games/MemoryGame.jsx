import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Flip two cards at a time; a pair is the question_text card + its correct_answer card.
// Finishes when every pair is found or the timer runs out, then reports matched pairs as answers.
export default function MemoryGame({ questions, timeLimit = 60, onFinish }) {
  const { t } = useLanguage();
  const [cards] = useState(() => shuffle(questions.flatMap((q) => [
    { key: `${q.id}-a`, pairId: q.id, text: q.question_text },
    { key: `${q.id}-b`, pairId: q.id, text: q.correct_answer },
  ])));
  const [open, setOpen] = useState([]);       // keys of the (max 2) face-up unmatched cards
  const [matched, setMatched] = useState([]); // pair ids found
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const finishedRef = useRef(false);

  const finish = (matchedIds) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const answers = questions
      .filter((q) => matchedIds.includes(q.id))
      .map((q) => ({ question_id: q.id, answer: q.correct_answer }));
    onFinish(answers);
  };

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) { finish(matched); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (card) => {
    if (finishedRef.current || open.length === 2 || open.includes(card.key) || matched.includes(card.pairId)) return;
    const nowOpen = [...open, card.key];
    setOpen(nowOpen);
    if (nowOpen.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = nowOpen.map((k) => cards.find((c) => c.key === k));
    if (a.pairId === b.pairId) {
      const nowMatched = [...matched, a.pairId];
      setMatched(nowMatched);
      setOpen([]);
      if (nowMatched.length === questions.length) setTimeout(() => finish(nowMatched), 600);
    } else {
      setTimeout(() => setOpen([]), 900);
    }
  };

  return (
    <div className="memory-wrap">
      <div className="memory-stats">
        <span>⏱️ {timeLeft}s</span>
        <span>🃏 {t('{n} / {total} pairs', { n: matched.length, total: questions.length })}</span>
        <span>👣 {t('{n} moves', { n: moves })}</span>
      </div>
      <div className="memory-timer"><div style={{ width: `${(timeLeft / timeLimit) * 100}%` }} /></div>

      <div className="memory-grid">
        {cards.map((card) => {
          const isMatched = matched.includes(card.pairId);
          const isOpen = isMatched || open.includes(card.key);
          return (
            <button key={card.key} className={`memory-card ${isOpen ? 'open' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => flip(card)} disabled={isMatched}>
              <span className="memory-card-inner">{isOpen ? card.text : '🕌'}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .memory-wrap { max-width: 720px; margin: 0 auto; }
        .memory-stats { display: flex; justify-content: space-between; font-family: var(--font-kids); font-weight: 700; margin-bottom: 8px; }
        .memory-timer { height: 8px; background: var(--surface-light); border-radius: 4px; overflow: hidden; margin-bottom: 24px; }
        .memory-timer div { height: 100%; background: linear-gradient(90deg, var(--kids-primary), var(--kids-accent)); transition: width 1s linear; }
        .memory-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .memory-card {
          min-height: 96px; padding: 10px; border-radius: var(--radius-lg);
          border: 2px solid var(--border); background: linear-gradient(135deg, var(--kids-primary), var(--kids-accent));
          color: white; font-family: var(--font-kids); font-weight: 700; font-size: 1rem; cursor: pointer;
          transition: transform 0.25s, background 0.25s, border-color 0.25s;
        }
        .memory-card:hover:not(:disabled) { transform: translateY(-3px); }
        .memory-card.open { background: var(--surface); color: var(--text); border-color: var(--kids-accent); transform: rotateY(0); }
        .memory-card.matched { background: rgba(34,197,94,0.15); border-color: var(--success); color: var(--success); cursor: default; }
        .memory-card-inner { display: block; word-break: break-word; }
        @media (max-width: 520px) {
          .memory-grid { grid-template-columns: repeat(3, 1fr); }
          .memory-card { min-height: 80px; font-size: 0.85rem; }
        }
      `}</style>
    </div>
  );
}
