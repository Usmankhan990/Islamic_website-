const db = require('../config/db');

const weeklyController = {
  // GET /api/weekly-topics
  async getTopics(req, res) {
    try {
      const [topics] = await db.query(
        `SELECT wt.*, u.name as creator_name,
         (SELECT COUNT(*) FROM weekly_quizzes WHERE topic_id = wt.id) as quiz_count
         FROM weekly_topics wt LEFT JOIN users u ON wt.created_by = u.id
         ORDER BY wt.week_start DESC`
      );
      res.json({ topics });
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/weekly-topics/:id
  async getTopic(req, res) {
    try {
      const [topics] = await db.query('SELECT * FROM weekly_topics WHERE id = ?', [req.params.id]);
      if (topics.length === 0) return res.status(404).json({ message: 'Topic not found.' });
      const [quizzes] = await db.query('SELECT * FROM weekly_quizzes WHERE topic_id = ? ORDER BY created_at DESC', [req.params.id]);
      res.json({ topic: topics[0], quizzes });
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/weekly-topics
  async createTopic(req, res) {
    try {
      const { title, description, content_type, content_data, target_audience, difficulty, week_start, week_end } = req.body;
      if (!title || !content_data || !week_start || !week_end) {
        return res.status(400).json({ message: 'Title, content_data, week_start, week_end are required.' });
      }
      const [result] = await db.query(
        'INSERT INTO weekly_topics (title, description, content_type, content_data, target_audience, difficulty, week_start, week_end, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, content_type || 'quran', JSON.stringify(content_data), target_audience || 'all', difficulty || 'beginner', week_start, week_end, req.user.id]
      );
      res.status(201).json({ message: 'Topic created!', topicId: result.insertId });
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/weekly-topics/:id
  async updateTopic(req, res) {
    try {
      const fields = req.body;
      if (fields.content_data) fields.content_data = JSON.stringify(fields.content_data);
      const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
      await db.query(`UPDATE weekly_topics SET ${sets} WHERE id = ?`, [...Object.values(fields), req.params.id]);
      res.json({ message: 'Topic updated!' });
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/weekly-topics/:id
  async deleteTopic(req, res) {
    try {
      await db.query('DELETE FROM weekly_topics WHERE id = ?', [req.params.id]);
      res.json({ message: 'Topic deleted!' });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/weekly-topics/:id/generate-quiz  (AUTO QUIZ GENERATION)
  async generateQuiz(req, res) {
    try {
      const { quiz_type, time_limit_minutes, starts_at } = req.body;
      const [topics] = await db.query('SELECT * FROM weekly_topics WHERE id = ?', [req.params.id]);
      if (topics.length === 0) return res.status(404).json({ message: 'Topic not found.' });

      const topic = topics[0];
      const contentData = typeof topic.content_data === 'string' ? JSON.parse(topic.content_data) : topic.content_data;

      // Generate questions based on content type
      let questions = [];
      if (topic.content_type === 'quran') {
        questions = generateQuranQuestions(contentData, topic.difficulty);
      } else if (topic.content_type === 'hadith') {
        questions = generateHadithQuestions(contentData, topic.difficulty);
      } else {
        questions = contentData.questions || [];
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: 'Could not generate questions from this content.' });
      }

      // Create quiz
      const quizTitle = `${topic.title} - ${quiz_type === 'live_final' ? 'Live Final Quiz' : 'Practice Quiz'}`;
      const [quizResult] = await db.query(
        'INSERT INTO weekly_quizzes (topic_id, title, quiz_type, time_limit_minutes, starts_at) VALUES (?, ?, ?, ?, ?)',
        [topic.id, quizTitle, quiz_type || 'practice', time_limit_minutes || 15, starts_at || null]
      );

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await db.query(
          'INSERT INTO weekly_quiz_questions (quiz_id, question_text, options_json, correct_answer, explanation, points, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [quizResult.insertId, q.question_text, JSON.stringify(q.options), q.correct_answer, q.explanation || null, q.points || 10, i + 1]
        );
      }

      res.status(201).json({ message: `Quiz generated with ${questions.length} questions!`, quizId: quizResult.insertId, questionCount: questions.length });
    } catch (error) {
      console.error('Generate quiz error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/weekly-quizzes
  async getQuizzes(req, res) {
    try {
      const { topic_id, active_only } = req.query;
      let sql = `SELECT wq.*, wt.title as topic_title, wt.target_audience, wt.difficulty,
                 (SELECT COUNT(*) FROM weekly_quiz_questions WHERE quiz_id = wq.id) as question_count,
                 (SELECT COUNT(*) FROM weekly_quiz_results WHERE quiz_id = wq.id) as attempt_count
                 FROM weekly_quizzes wq JOIN weekly_topics wt ON wq.topic_id = wt.id`;
      const params = [];
      const where = [];
      if (topic_id) { where.push('wq.topic_id = ?'); params.push(topic_id); }
      if (active_only === 'true') { where.push('wq.is_active = TRUE'); }
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY wq.created_at DESC';
      const [quizzes] = await db.query(sql, params);
      res.json({ quizzes });
    } catch (error) {
      console.error('Get quizzes error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/weekly-quizzes/:id
  async getQuiz(req, res) {
    try {
      const [quizzes] = await db.query(
        `SELECT wq.*, wt.title as topic_title, wt.content_type, wt.content_data, wt.target_audience
         FROM weekly_quizzes wq JOIN weekly_topics wt ON wq.topic_id = wt.id WHERE wq.id = ?`,
        [req.params.id]
      );
      if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz not found.' });
      const [questions] = await db.query('SELECT * FROM weekly_quiz_questions WHERE quiz_id = ? ORDER BY order_num', [req.params.id]);
      res.json({ quiz: quizzes[0], questions });
    } catch (error) {
      console.error('Get quiz error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/weekly-quizzes/:id/submit
  async submitQuiz(req, res) {
    try {
      const { answers, time_taken } = req.body;
      const quizId = req.params.id;
      const userId = req.user.id;

      // Check if already submitted
      const [existing] = await db.query('SELECT id FROM weekly_quiz_results WHERE quiz_id = ? AND user_id = ?', [quizId, userId]);
      if (existing.length > 0) return res.status(400).json({ message: 'You already submitted this quiz.' });

      const [questions] = await db.query('SELECT * FROM weekly_quiz_questions WHERE quiz_id = ? ORDER BY order_num', [quizId]);
      let score = 0;
      let correctCount = 0;
      let totalPoints = 0;

      questions.forEach(q => {
        totalPoints += q.points;
        const userAnswer = answers.find(a => a.question_id === q.id);
        if (userAnswer && userAnswer.answer === q.correct_answer) {
          score += q.points;
          correctCount++;
        }
      });

      await db.query(
        'INSERT INTO weekly_quiz_results (quiz_id, user_id, score, total_points, correct_count, total_questions, time_taken) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [quizId, userId, score, totalPoints, correctCount, questions.length, time_taken || 0]
      );

      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      res.json({ score, totalPoints, correctCount, totalQuestions: questions.length, percentage });
    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/weekly-quizzes/:id/results (PUBLIC - live leaderboard)
  async getResults(req, res) {
    try {
      const [results] = await db.query(
        `SELECT wqr.*, u.name as user_name, u.avatar FROM weekly_quiz_results wqr
         JOIN users u ON wqr.user_id = u.id WHERE wqr.quiz_id = ?
         ORDER BY wqr.score DESC, wqr.time_taken ASC`,
        [req.params.id]
      );
      const [quiz] = await db.query(
        'SELECT wq.*, wt.title as topic_title FROM weekly_quizzes wq JOIN weekly_topics wt ON wq.topic_id = wt.id WHERE wq.id = ?',
        [req.params.id]
      );
      res.json({ results, quiz: quiz[0] || null });
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

// ============================================
// QUIZ AUTO-GENERATION HELPERS
// ============================================

function generateQuranQuestions(data, difficulty) {
  // data = { surah: number, fromVerse: number, toVerse: number, verses: [...] }
  const questions = [];
  const verses = data.verses || [];

  if (verses.length === 0) return generateFallbackQuranQuestions(data);

  // Q1: Verse identification
  verses.slice(0, 3).forEach((v, i) => {
    const text = v.translation || v.text;
    if (!text) return;
    const snippet = text.length > 80 ? text.substring(0, 80) + '...' : text;
    questions.push({
      question_text: `Which verse of Surah ${data.surahName || data.surah} contains this meaning: "${snippet}"?`,
      options: shuffleArray([`Verse ${v.verse || i + 1}`, `Verse ${(v.verse || i + 1) + 2}`, `Verse ${(v.verse || i + 1) + 5}`, `Verse ${(v.verse || i + 1) + 3}`]),
      correct_answer: `Verse ${v.verse || i + 1}`,
      explanation: `This is from verse ${v.verse || i + 1} of Surah ${data.surahName || data.surah}`,
      points: difficulty === 'advanced' ? 20 : 10
    });
  });

  // Q2: Fill in meaning
  verses.slice(0, 2).forEach(v => {
    const text = v.translation || v.text;
    if (!text || text.length < 20) return;
    const words = text.split(' ');
    if (words.length < 5) return;
    const midPoint = Math.floor(words.length / 2);
    const keyword = words[midPoint];
    const blanked = words.map((w, i) => i === midPoint ? '______' : w).join(' ');
    questions.push({
      question_text: `Fill in the blank: "${blanked}"`,
      options: shuffleArray([keyword, words[0], words[words.length - 1], 'None of these']),
      correct_answer: keyword,
      explanation: `The complete verse reads: "${text}"`,
      points: difficulty === 'advanced' ? 15 : 10
    });
  });

  // Q3: Surah information
  questions.push({
    question_text: `How many verses were assigned this week from Surah ${data.surahName || data.surah}?`,
    options: shuffleArray([`${verses.length}`, `${verses.length + 3}`, `${verses.length + 7}`, `${Math.max(1, verses.length - 2)}`]),
    correct_answer: `${verses.length}`,
    explanation: `${verses.length} verses were assigned for this week's study.`,
    points: 10
  });

  // Q4: True/False style
  if (verses[0]) {
    questions.push({
      question_text: `True or False: The first assigned verse this week starts with "${(verses[0].translation || verses[0].text || '').substring(0, 40)}..."`,
      options: ['True', 'False', 'Partly correct', 'Cannot determine'],
      correct_answer: 'True',
      explanation: 'This is the correct beginning of the first assigned verse.',
      points: 10
    });
  }

  return questions.slice(0, 10);
}

function generateFallbackQuranQuestions(data) {
  const surahNum = data.surah || 1;
  const surahName = data.surahName || `Surah #${surahNum}`;
  return [
    {
      question_text: `What is the name of the Surah assigned this week?`,
      options: shuffleArray([surahName, 'Al-Baqarah', 'Al-Imran', 'An-Nisa']),
      correct_answer: surahName, points: 10
    },
    {
      question_text: `Which verse range was assigned from ${surahName}?`,
      options: shuffleArray([`${data.fromVerse}-${data.toVerse}`, '1-5', '10-20', '50-60']),
      correct_answer: `${data.fromVerse}-${data.toVerse}`, points: 10
    },
    {
      question_text: `How many verses are in this week's assignment?`,
      options: shuffleArray([`${(data.toVerse || 1) - (data.fromVerse || 1) + 1}`, '3', '15', '20']),
      correct_answer: `${(data.toVerse || 1) - (data.fromVerse || 1) + 1}`, points: 10
    }
  ];
}

function generateHadithQuestions(data, difficulty) {
  const questions = [];
  const hadiths = data.hadiths || [];

  hadiths.slice(0, 5).forEach((h, i) => {
    const text = h.text || h.hadith_english || '';
    if (!text) return;
    const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text;

    // Narrator question
    if (h.narrator) {
      questions.push({
        question_text: `Who narrated this Hadith: "${snippet}"?`,
        options: shuffleArray([h.narrator, 'Abu Bakr (RA)', 'Umar (RA)', 'Ali (RA)']),
        correct_answer: h.narrator,
        explanation: `This hadith was narrated by ${h.narrator}`,
        points: difficulty === 'advanced' ? 15 : 10
      });
    }

    // Collection question
    if (h.collection) {
      questions.push({
        question_text: `Which Hadith collection contains: "${snippet}"?`,
        options: shuffleArray([h.collection, 'Sahih Bukhari', 'Sahih Muslim', 'Sunan Abu Dawud']),
        correct_answer: h.collection,
        points: 10
      });
    }

    // Meaning question
    if (text.length > 30) {
      const words = text.split(' ');
      const keyword = words.find(w => w.length > 4) || words[2] || words[0];
      questions.push({
        question_text: `This Hadith mentions the concept of "${keyword}". What is the full teaching?`,
        options: shuffleArray([snippet, 'Fasting on Mondays', 'Charity to neighbors', 'Night prayer benefits']),
        correct_answer: snippet,
        explanation: `The full hadith teaches: "${text.substring(0, 150)}"`,
        points: 10
      });
    }
  });

  return questions.slice(0, 10);
}

function shuffleArray(arr) {
  const shuffled = [...new Set(arr)]; // remove duplicates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.length >= 4 ? shuffled.slice(0, 4) : [...shuffled, ...Array(4 - shuffled.length).fill('None of the above')].slice(0, 4);
}

module.exports = weeklyController;
