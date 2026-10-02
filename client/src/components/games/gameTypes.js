// Game types the admin can create, and how each one's questions are shaped.
// question_text / correct_answer / options map onto the game_questions table.
export const GAME_TYPES = {
  quiz: {
    icon: '❓', label: 'Quiz',
    help: 'Question with 4 options, one correct answer.',
    newQuestion: () => ({ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', points: 10 }),
    isValid: (q) => q.question_text.trim() && q.options.filter((o) => o.trim()).length >= 2 && q.correct_answer,
  },
  true_false: {
    icon: '✅', label: 'True / False',
    help: 'A statement — kids choose True or False.',
    newQuestion: () => ({ question_text: '', question_type: 'true_false', options: ['True', 'False'], correct_answer: 'True', points: 10 }),
    isValid: (q) => q.question_text.trim() && ['True', 'False'].includes(q.correct_answer),
  },
  memory: {
    icon: '🃏', label: 'Memory Match',
    help: 'Each pair is two cards (e.g. "Fajr" ↔ "2 Rakat"). Kids flip cards to find pairs before time runs out.',
    newQuestion: () => ({ question_text: '', question_type: 'matching', options: [], correct_answer: '', points: 10 }),
    isValid: (q) => q.question_text.trim() && q.correct_answer.trim(),
    minQuestions: 2, maxQuestions: 8,
  },
  word_jumble: {
    icon: '🔤', label: 'Word Jumble',
    help: 'Give a hint and the answer word. Kids rebuild the word from shuffled letters.',
    newQuestion: () => ({ question_text: '', question_type: 'fill_blank', options: [], correct_answer: '', points: 10 }),
    isValid: (q) => q.question_text.trim() && q.correct_answer.replace(/\s/g, '').length >= 2,
  },
  // Older types: still playable (shown as a quiz), not offered for new games
  matching: { icon: '🧩', label: 'Matching (quiz)', legacy: true },
  fill_blank: { icon: '✏️', label: 'Fill in Blank (quiz)', legacy: true },
  drag_drop: { icon: '🎯', label: 'Drag & Drop (quiz)', legacy: true },
};

export const gameIcon = (type) => GAME_TYPES[type]?.icon || '🎮';
export const gameLabel = (type) => GAME_TYPES[type]?.label || type;

// Legacy types use the quiz editor/validation
export const typeConfig = (type) => (GAME_TYPES[type]?.legacy || !GAME_TYPES[type] ? GAME_TYPES.quiz : GAME_TYPES[type]);
