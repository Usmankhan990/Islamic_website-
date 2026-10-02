const db = require('../config/db');

// Clamp admin-entered numbers to sane ranges
const toCoinReward = (v) => (v === undefined || v === null || v === '' ? null : Math.max(0, Math.min(1000, parseInt(v, 10) || 0)));
const toPassPercentage = (v) => (v === undefined || v === null || v === '' ? null : Math.max(1, Math.min(100, parseInt(v, 10) || 80)));

// Compare answers ignoring case and extra spaces (word jumble answers are typed letters)
const normalize = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const toLevel = (v) => Math.max(1, parseInt(v, 10) || 1);

async function insertQuestions(gameId, questions) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await db.query(
      'INSERT INTO game_questions (game_id, question_text, question_type, options_json, correct_answer, points, order_num, media_url, level) VALUES (?,?,?,?,?,?,?,?,?)',
      [gameId, q.question_text, q.question_type || 'multiple_choice', JSON.stringify(q.options || []), q.correct_answer, q.points || 10, i + 1, q.media_url || null, toLevel(q.level)]
    );
  }
}

// A user's level status for one game: every level, and which ones they've won
async function levelStatus(gameId, userId) {
  const [levels] = await db.query('SELECT DISTINCT level FROM game_questions WHERE game_id = ? ORDER BY level', [gameId]);
  const [won] = await db.query('SELECT DISTINCT level FROM game_results WHERE game_id = ? AND user_id = ? AND passed = TRUE', [gameId, userId]);
  const allLevels = levels.map((l) => l.level);
  const wonLevels = won.map((l) => l.level);
  const nextLevel = allLevels.find((l) => !wonLevels.includes(l)) ?? null;
  return { allLevels, wonLevels, nextLevel, completed: allLevels.length > 0 && nextLevel === null };
}

const gameController = {
  // GET /api/games
  async getAll(req, res) {
    try {
      const { type, difficulty, active_only } = req.query;
      let query = `SELECT g.*, u.name as creator_name,
        (SELECT COUNT(DISTINCT level) FROM game_questions WHERE game_id = g.id) as total_levels
        FROM games g LEFT JOIN users u ON g.created_by = u.id WHERE 1=1`;
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
        'SELECT * FROM game_questions WHERE game_id = ? ORDER BY level, order_num',
        [req.params.id]
      );

      res.json({ game: games[0], questions });
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/games/:id/next-level — the next level this user hasn't won yet, with its questions
  async nextLevel(req, res) {
    try {
      const [games] = await db.query('SELECT * FROM games WHERE id = ?', [req.params.id]);
      if (games.length === 0) return res.status(404).json({ message: 'Game not found.' });

      const status = await levelStatus(req.params.id, req.user.id);
      let questions = [];
      if (status.nextLevel !== null) {
        [questions] = await db.query(
          'SELECT * FROM game_questions WHERE game_id = ? AND level = ? ORDER BY order_num',
          [req.params.id, status.nextLevel]
        );
      }

      res.json({
        game: games[0],
        level: status.nextLevel,
        levelNumber: status.nextLevel === null ? null : status.allLevels.indexOf(status.nextLevel) + 1,
        totalLevels: status.allLevels.length,
        levelsWon: status.wonLevels.length,
        completed: status.completed,
        questions
      });
    } catch (error) {
      console.error('Next level error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/games/progress/me — per-game level progress for the logged-in user
  async myProgress(req, res) {
    try {
      const [rows] = await db.query(
        `SELECT g.id as game_id,
          (SELECT COUNT(DISTINCT q.level) FROM game_questions q WHERE q.game_id = g.id) as total_levels,
          (SELECT COUNT(DISTINCT r.level) FROM game_results r
             WHERE r.game_id = g.id AND r.user_id = ? AND r.passed = TRUE
               AND r.level IN (SELECT level FROM game_questions WHERE game_id = g.id)) as levels_won
         FROM games g`,
        [req.user.id]
      );
      res.json({ progress: rows.map((r) => ({ ...r, completed: r.total_levels > 0 && r.levels_won >= r.total_levels })) });
    } catch (error) {
      console.error('Game progress error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/games
  async create(req, res) {
    try {
      const { title, description, type, difficulty, thumbnail, config_json, coin_reward, pass_percentage, questions } = req.body;

      const [result] = await db.query(
        'INSERT INTO games (title, description, type, difficulty, thumbnail, config_json, coin_reward, pass_percentage, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
        [title, description, type || 'quiz', difficulty || 'easy', thumbnail, JSON.stringify(config_json ?? null),
          toCoinReward(coin_reward) ?? 10, toPassPercentage(pass_percentage) ?? 80, req.user.id]
      );

      const gameId = result.insertId;

      // Insert questions if provided
      if (questions && questions.length > 0) await insertQuestions(gameId, questions);

      res.status(201).json({ message: 'Game created successfully!', gameId });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/games/:id
  async update(req, res) {
    try {
      const { title, description, type, difficulty, thumbnail, config_json, is_active, coin_reward, pass_percentage, questions } = req.body;

      await db.query(
        'UPDATE games SET title=COALESCE(?,title), description=COALESCE(?,description), type=COALESCE(?,type), difficulty=COALESCE(?,difficulty), thumbnail=COALESCE(?,thumbnail), config_json=COALESCE(?,config_json), is_active=COALESCE(?,is_active), coin_reward=COALESCE(?,coin_reward), pass_percentage=COALESCE(?,pass_percentage) WHERE id=?',
        [title, description, type, difficulty, thumbnail, config_json ? JSON.stringify(config_json) : null, is_active,
          toCoinReward(coin_reward), toPassPercentage(pass_percentage), req.params.id]
      );

      // Replace questions if provided
      if (questions && questions.length > 0) {
        await db.query('DELETE FROM game_questions WHERE game_id = ?', [req.params.id]);
        await insertQuestions(req.params.id, questions);
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
      const { answers = [], time_taken } = req.body; // answers: [{question_id, answer}]
      const level = toLevel(req.body.level);

      const [games] = await db.query('SELECT id, title, coin_reward, pass_percentage FROM games WHERE id = ?', [gameId]);
      if (games.length === 0) return res.status(404).json({ message: 'Game not found.' });
      const game = games[0];

      // Get correct answers for this level only
      const [questions] = await db.query(
        'SELECT id, correct_answer, points FROM game_questions WHERE game_id = ? AND level = ? ORDER BY order_num',
        [gameId, level]
      );
      if (questions.length === 0) return res.status(400).json({ message: 'This level has no questions.' });

      // A level that's already won gives no more coins (it shouldn't be offered again anyway)
      const [prevWins] = await db.query(
        'SELECT 1 FROM game_results WHERE game_id = ? AND user_id = ? AND level = ? AND passed = TRUE LIMIT 1',
        [gameId, req.user.id, level]
      );
      const alreadyWon = prevWins.length > 0;

      let score = 0;
      let totalPoints = 0;
      let correctAnswers = 0;
      const results = [];

      for (const q of questions) {
        totalPoints += q.points;
        const userAnswer = answers.find(a => Number(a.question_id) === q.id);
        const isCorrect = !!userAnswer && normalize(userAnswer.answer) === normalize(q.correct_answer);
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

      // Win = reached the game's pass percentage; every level win earns the game's coin reward
      const percentScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      const passed = totalPoints > 0 && percentScore >= game.pass_percentage;
      const coinsEarned = passed && !alreadyWon ? game.coin_reward : 0;

      // Save result
      const [saved] = await db.query(
        'INSERT INTO game_results (game_id, user_id, score, total_points, correct_answers, total_questions, time_taken, coins_earned, level, passed) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [gameId, req.user.id, score, totalPoints, correctAnswers, questions.length, time_taken || 0, coinsEarned, level, passed]
      );
      const status = await levelStatus(gameId, req.user.id);

      // Credit coins
      let totalCoins;
      if (coinsEarned > 0) {
        const [updated] = await db.query('UPDATE users SET coins = coins + ? WHERE id = ? RETURNING coins', [coinsEarned, req.user.id]);
        totalCoins = updated.rows[0]?.coins;
        await db.query(
          'INSERT INTO coin_transactions (user_id, amount, reason, game_id, game_result_id) VALUES (?,?,?,?,?)',
          [req.user.id, coinsEarned, `Won ${game.title} — Level ${status.allLevels.indexOf(level) + 1}`, gameId, saved.insertId]
        );
      } else {
        const [rows] = await db.query('SELECT coins FROM users WHERE id = ?', [req.user.id]);
        totalCoins = rows[0]?.coins;
      }

      // Increment play count
      await db.query('UPDATE games SET play_count = play_count + 1 WHERE id = ?', [gameId]);

      // Check for achievements
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
        passed,
        passPercentage: game.pass_percentage,
        coinsEarned,
        totalCoins,
        level,
        levelNumber: status.allLevels.indexOf(level) + 1,
        totalLevels: status.allLevels.length,
        nextLevel: status.nextLevel,
        gameCompleted: status.completed,
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
