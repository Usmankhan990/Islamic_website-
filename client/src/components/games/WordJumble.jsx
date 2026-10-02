import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

// Shuffle letters, making sure the shuffled order isn't the answer itself
const scramble = (letters) => {
  if (letters.length < 2 || new Set(letters).size < 2) return letters.map((ch, i) => ({ ch, i }));
  let out;
  do {
    out = letters.map((ch, i) => ({ ch, i }));
    for (let k = out.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [out[k], out[j]] = [out[j], out[k]];
    }
  } while (out.map((t) => t.ch).join('') === letters.join(''));
  return out;
};

// One word at a time: question_text is the hint, correct_answer is the word to rebuild.
// Spaces in the answer stay fixed; kids place the letters into the remaining slots.
export default function WordJumble({ questions, onFinish }) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const q = questions[current];
  const word = q.correct_answer.trim();
  const letters = Array.from(word.replace(/\s/g, ''));

  const [tiles, setTiles] = useState(() => scramble(letters));
  const [placed, setPlaced] = useState([]); // tile indices in order of placement

  const loadQuestion = (index) => {
    const w = questions[index].correct_answer.trim();
    setTiles(scramble(Array.from(w.replace(/\s/g, ''))));
    setPlaced([]);
    setFeedback(null);
  };

  // Rebuild the typed answer with the word's original spaces
  const buildAnswer = (placedIdx) => {
    const typed = placedIdx.map((t) => tiles[t].ch);
    let k = 0;
    return Array.from(word).map((ch) => (/\s/.test(ch) ? ch : (typed[k++] ?? ''))).join('');
  };

  const placeTile = (t) => {
    if (feedback || placed.includes(t)) return;
    const next = [...placed, t];
    setPlaced(next);
    if (next.length === letters.length) check(next);
  };

  const removeLast = () => { if (!feedback) setPlaced(placed.slice(0, -1)); };

  const check = (placedIdx) => {
    const answer = buildAnswer(placedIdx);
    const isCorrect = answer.toLowerCase() === word.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'wrong');
    const all = [...answers, { question_id: q.id, answer }];
    setAnswers(all);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(current + 1);
        loadQuestion(current + 1);
      } else {
        onFinish(all);
      }
    }, 1500);
  };

  const skip = () => { if (!feedback) check([]); };

  // Slots show placed letters; spaces are fixed gaps
  let k = 0;
  const slots = Array.from(word).map((ch) => (/\s/.test(ch) ? null : placed[k++]));

  return (
    <div className="jumble-wrap">
      <div className="jumble-head">
        <span className="text-muted">{current + 1} / {questions.length}</span>
      </div>
      <div className="play-progress-bar"><div className="play-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>

      <div className="jumble-hint" key={current}>
        <span className="jumble-hint-label">💡 {t('Hint')}</span>
        <h3>{q.question_text}</h3>
      </div>

      <div className="jumble-slots">
        {slots.map((t, i) => t === null
          ? <span key={i} className="jumble-gap" />
          : <span key={i} className={`jumble-slot ${t !== undefined ? 'filled' : ''} ${feedback || ''}`}>{t !== undefined ? tiles[t].ch : ''}</span>)}
      </div>

      <div className="jumble-tiles">
        {tiles.map((tile, t) => (
          <button key={t} className="jumble-tile" disabled={placed.includes(t) || !!feedback} onClick={() => placeTile(t)}>
            {tile.ch}
          </button>
        ))}
      </div>

      <div className="flex gap-md justify-center" style={{ marginTop: 20 }}>
        <button className="btn btn-outline" onClick={removeLast} disabled={!placed.length || !!feedback}>⌫ {t('Undo')}</button>
        <button className="btn btn-outline" onClick={() => !feedback && setPlaced([])} disabled={!placed.length || !!feedback}>↺ {t('Clear')}</button>
        <button className="btn btn-outline" onClick={skip} disabled={!!feedback}>⏭ {t('Skip')}</button>
      </div>

      {feedback && (
        <div className={`play-feedback ${feedback}`} style={{ animation: 'scaleIn 0.3s ease' }}>
          {feedback === 'correct' ? '✅ ' + t('Correct! Mashallah!') : '❌ ' + t('The word is: {word}', { word })}
        </div>
      )}

      <style>{`
        .jumble-wrap { max-width: 700px; margin: 0 auto; }
        .jumble-head { display: flex; justify-content: flex-end; margin-bottom: 12px; }
        .jumble-hint { text-align: center; margin-bottom: 28px; padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); }
        .jumble-hint-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; }
        .jumble-hint h3 { font-family: var(--font-kids); font-size: 1.4rem; margin-top: 8px; }
        .jumble-slots { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 28px; direction: ltr; }
        .jumble-slot {
          width: 48px; height: 56px; display: flex; align-items: center; justify-content: center;
          border-bottom: 4px solid var(--border); font-family: var(--font-kids); font-size: 1.6rem; font-weight: 800;
        }
        .jumble-slot.filled { border-color: var(--kids-accent); }
        .jumble-slot.correct { color: var(--success); border-color: var(--success); }
        .jumble-slot.wrong { color: var(--error); border-color: var(--error); animation: shake 0.5s; }
        .jumble-gap { width: 24px; }
        .jumble-tiles { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
        .jumble-tile {
          width: 56px; height: 56px; border-radius: var(--radius-md); border: none;
          background: linear-gradient(135deg, var(--kids-primary), var(--kids-accent)); color: white;
          font-family: var(--font-kids); font-size: 1.5rem; font-weight: 800; cursor: pointer; transition: transform 0.15s, opacity 0.15s;
        }
        .jumble-tile:hover:not(:disabled) { transform: translateY(-3px) scale(1.05); }
        .jumble-tile:disabled { opacity: 0.25; cursor: default; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
      `}</style>
    </div>
  );
}
