const db = require('../config/db');

const gameController = {
  // GET /api/games
  async getAll(req, res) {
    try {
      const { type, difficulty, active_only } = req.query;
      let query = 'SELECT g.*, u.name as creator_name FROM games g LEFT JOIN users u ON g.created_by = u.id WHERE 1=1';
      const params = [];

      if (type) { query += ' AND g.type = ?'; params.push(type); }
      if (difficulty) { query += ' AND g.difficulty = ?'; params.push(difficulty); }
      if (active_only === 'true') { query += ' AND g.is_active = TRUE'; }
      query += ' ORDER BY g.created_at DESC';

      const [games] = await db.query(query, params);
      res.json({ games });
    } catch (error) {
      console.error('Get games error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/games/:id
  async getById(req, res) {
    try {
      const [games] = await db.query('SELECT * FROM games WHERE id = ?', [req.params.id]);
      if (games.length === 0) return res.status(404).json({ message: 'Game not found.' });

      const [questions] = await db.query(
        'SELECT * FROM game_questions WHERE game_id = ? ORDER BY order_num',
        [req.params.id]
      );

      res.json({ game: games[0], questions });
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/games
  async create(req, res) {
    try {
      const { title, description, type, difficulty, thumbnail, config_json, questions } = req.body;

      const [result] = await db.query(
        'INSERT INTO games (title, description, type, difficulty, thumbnail, config_json, created_by) VALUES (?,?,?,?,?,?,?)',
        [title, description, type || 'quiz', difficulty || 'easy', thumbnail, JSON.stringify(config_json), req.user.id]
      );

      const gameId = result.insertId;

      // Insert questions if provided
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await db.query(
            'INSERT INTO game_questions (game_id, question_text, question_type, options_json, correct_answer, points, order_num, media_url) VALUES (?,?,?,?,?,?,?,?)',
            [gameId, q.question_text, q.question_type || 'multiple_choice', JSON.stringify(q.options), q.correct_answer, q.points || 10, i + 1, q.media_url || null]
          );
        }
      }

      res.status(201).json({ message: 'Game created successfully!', gameId });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/games/:id
  async update(req, res) {
    try {
      const { title, description, type, difficulty, thumbnail, config_json, is_active, questions } = req.body;

      await db.query(
        'UPDATE games SET title=COALESCE(?,title), description=COALESCE(?,description), type=COALESCE(?,type), difficulty=COALESCE(?,difficulty), thumbnail=COALESCE(?,thumbnail), config_json=COALESCE(?,config_json), is_active=COALESCE(?,is_active) WHERE id=?',
        [title, description, type, difficulty, thumbnail, config_json ? JSON.stringify(config_json) : null, is_active, req.params.id]
      );

      // Replace questions if provided
      if (questions && questions.length > 0) {
        await db.query('DELETE FROM game_questions WHERE game_id = ?', [req.params.id]);
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await db.query(
            'INSERT INTO game_questions (game_id, question_text, question_type, options_json, correct_answer, points, order_num, media_url) VALUES (?,?,?,?,?,?,?,?)',
            [req.params.id, q.question_text, q.question_type || 'multiple_choice', JSON.stringify(q.options), q.correct_answer, q.points || 10, i + 1, q.media_url || null]
          );
        }
      }

      res.json({ message: 'Game updated successfully.' });
    } catch (error) {
      console.error('Update game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/games/:id
  async delete(req, res) {
    try {
      await db.query('DELETE FROM games WHERE id = ?', [req.params.id]);
      res.json({ message: 'Game deleted successfully.' });
    } catch (error) {
      console.error('Delete game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/games/:id/play - Submit answers and get score
  async play(req, res) {
    try {
      const gameId = req.params.id;
      const { answers, time_taken } = req.body; // answers: [{question_id, answer}]

      // Get correct answers
      const [questions] = await db.query(
        'SELECT id, correct_answer, points FROM game_questions WHERE game_id = ? ORDER BY order_num',
        [gameId]
      );

      let score = 0;
      let totalPoints = 0;
      let correctAnswers = 0;
      const results = [];

      for (const q of questions) {
        totalPoints += q.points;
        const userAnswer = answers.find(a => a.question_id === q.id);
        const isCorrect = userAnswer && userAnswer.answer === q.correct_answer;
        if (isCorrect) {
          score += q.points;
          correctAnswers++;
        }
        results.push({
          question_id: q.id,
          correct_answer: q.correct_answer,
          user_answer: userAnswer ? userAnswer.answer : null,
          is_correct: isCorrect,
          points_earned: isCorrect ? q.points : 0
        });
      }

      // Save result
      await db.query(
        'INSERT INTO game_results (game_id, user_id, score, total_points, correct_answers, total_questions, time_taken) VALUES (?,?,?,?,?,?,?)',
        [gameId, req.user.id, score, totalPoints, correctAnswers, questions.length, time_taken || 0]
      );

      // Increment play count
      await db.query('UPDATE games SET play_count = play_count + 1 WHERE id = ?', [gameId]);

      // Check for achievements
      const percentScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      if (percentScore === 100) {
        await db.query(
          'INSERT INTO achievements (user_id, badge_name, badge_icon, description) VALUES (?,?,?,?)',
          [req.user.id, 'Perfect Score!', '⭐', `Got 100% on game: ${gameId}`]
        );
      }

      res.json({
        score,
        totalPoints,
        correctAnswers,
        totalQuestions: questions.length,
        percentage: Math.round(percentScore),
        results
      });
    } catch (error) {
      console.error('Play game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/games/:id/leaderboard
  async leaderboard(req, res) {
    try {
      const [results] = await db.query(
        `SELECT gr.user_id, u.name, u.avatar, MAX(gr.score) as best_score, 
         COUNT(*) as attempts, MIN(gr.time_taken) as best_time
         FROM game_results gr JOIN users u ON gr.user_id = u.id
         WHERE gr.game_id = ?
         GROUP BY gr.user_id, u.name, u.avatar
         ORDER BY best_score DESC, best_time ASC
         LIMIT 50`,
        [req.params.id]
      );

      res.json({ leaderboard: results });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = gameController;
