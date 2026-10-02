const db = require('../config/db');
const path = require('path');

const competitionController = {
  // GET /api/competitions
  async getAll(req, res) {
    try {
      const { status, type } = req.query;
      let query = `SELECT c.*, u.name as creator_name, 
        (SELECT COUNT(*) FROM competition_entries WHERE competition_id = c.id) as participant_count
        FROM competitions c LEFT JOIN users u ON c.created_by = u.id WHERE 1=1`;
      const params = [];
      if (status) { query += ' AND c.status = ?'; params.push(status); }
      if (type) { query += ' AND c.type = ?'; params.push(type); }
      query += ' ORDER BY c.start_time DESC';
      const [competitions] = await db.query(query, params);
      res.json({ competitions });
    } catch (error) {
      console.error('Get competitions error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/competitions/:id
  async getById(req, res) {
    try {
      const [comps] = await db.query('SELECT * FROM competitions WHERE id = ?', [req.params.id]);
      if (comps.length === 0) return res.status(404).json({ message: 'Competition not found.' });

      const [entries] = await db.query(
        `SELECT ce.*, u.name, u.avatar,
         (SELECT COUNT(*) FROM competition_votes WHERE entry_id = ce.id) as vote_count
         FROM competition_entries ce 
         JOIN users u ON ce.user_id = u.id WHERE ce.competition_id = ? 
         ORDER BY vote_count DESC, ce.score DESC`,
        [req.params.id]
      );

      res.json({ competition: comps[0], entries });
    } catch (error) {
      console.error('Get competition error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/competitions
  async create(req, res) {
    try {
      const { title, description, type, start_time, end_time, prize_description, max_participants, game_id } = req.body;
      const [result] = await db.query(
        'INSERT INTO competitions (title, description, type, start_time, end_time, prize_description, max_participants, game_id, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
        [title, description, type || 'quiz', start_time, end_time, prize_description, max_participants || 100, game_id, req.user.id]
      );
      res.status(201).json({ message: 'Competition created!', competitionId: result.insertId });
    } catch (error) {
      console.error('Create competition error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/competitions/:id
  async update(req, res) {
    try {
      const { title, description, type, start_time, end_time, status, prize_description, max_participants, game_id } = req.body;
      await db.query(
        'UPDATE competitions SET title=COALESCE(?,title), description=COALESCE(?,description), type=COALESCE(?,type), start_time=COALESCE(?,start_time), end_time=COALESCE(?,end_time), status=COALESCE(?,status), prize_description=COALESCE(?,prize_description), max_participants=COALESCE(?,max_participants), game_id=COALESCE(?,game_id) WHERE id=?',
        [title, description, type, start_time, end_time, status, prize_description, max_participants, game_id, req.params.id]
      );
      res.json({ message: 'Competition updated.' });
    } catch (error) {
      console.error('Update competition error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/competitions/:id/join
  async join(req, res) {
    try {
      const competitionId = req.params.id;
      const [comps] = await db.query('SELECT * FROM competitions WHERE id = ?', [competitionId]);
      if (comps.length === 0) return res.status(404).json({ message: 'Competition not found.' });
      if (comps[0].status === 'completed') return res.status(400).json({ message: 'Competition has ended.' });
      const [existing] = await db.query('SELECT id FROM competition_entries WHERE competition_id = ? AND user_id = ?', [competitionId, req.user.id]);
      if (existing.length > 0) return res.status(400).json({ message: 'Already registered.' });
      await db.query('INSERT INTO competition_entries (competition_id, user_id) VALUES (?, ?)', [competitionId, req.user.id]);
      res.status(201).json({ message: 'Successfully joined the competition!' });
    } catch (error) {
      console.error('Join competition error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/competitions/:id/submit-recording — Audio upload
  async submitRecording(req, res) {
    try {
      const competitionId = req.params.id;
      if (!req.file) return res.status(400).json({ message: 'No audio file uploaded.' });

      const audioUrl = `/uploads/${req.file.filename}`;

      // Check if user has an entry
      const [entries] = await db.query(
        'SELECT id FROM competition_entries WHERE competition_id = ? AND user_id = ?',
        [competitionId, req.user.id]
      );

      if (entries.length === 0) {
        // Auto-join and submit
        await db.query(
          'INSERT INTO competition_entries (competition_id, user_id, audio_url, submission_url) VALUES (?, ?, ?, ?)',
          [competitionId, req.user.id, audioUrl, audioUrl]
        );
      } else {
        await db.query(
          'UPDATE competition_entries SET audio_url = ?, submission_url = ? WHERE competition_id = ? AND user_id = ?',
          [audioUrl, audioUrl, competitionId, req.user.id]
        );
      }

      res.json({ message: 'Recording submitted successfully!', audioUrl });
    } catch (error) {
      console.error('Submit recording error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/competitions/entries/:entryId/vote
  async vote(req, res) {
    try {
      const entryId = req.params.entryId;
      const userId = req.user.id;

      // Check entry exists
      const [entries] = await db.query('SELECT * FROM competition_entries WHERE id = ?', [entryId]);
      if (entries.length === 0) return res.status(404).json({ message: 'Entry not found.' });

      // Can't vote for yourself
      if (entries[0].user_id === userId) return res.status(400).json({ message: 'Cannot vote for yourself.' });

      // Check if already voted
      const [existing] = await db.query('SELECT id FROM competition_votes WHERE entry_id = ? AND user_id = ?', [entryId, userId]);
      if (existing.length > 0) {
        // Remove vote (toggle)
        await db.query('DELETE FROM competition_votes WHERE entry_id = ? AND user_id = ?', [entryId, userId]);
        return res.json({ message: 'Vote removed.', voted: false });
      }

      await db.query('INSERT INTO competition_votes (entry_id, user_id) VALUES (?, ?)', [entryId, userId]);
      res.json({ message: 'Vote recorded!', voted: true });
    } catch (error) {
      console.error('Vote error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/competitions/:id/judge
  async judge(req, res) {
    try {
      const { entries } = req.body;
      for (const entry of entries) {
        await db.query(
          'UPDATE competition_entries SET score=?, rank_position=?, notes=?, judged_at=NOW() WHERE competition_id=? AND user_id=?',
          [entry.score, entry.rank_position, entry.notes, req.params.id, entry.user_id]
        );
      }
      await db.query("UPDATE competitions SET status = 'completed' WHERE id = ?", [req.params.id]);
      res.json({ message: 'Competition judged successfully.' });
    } catch (error) {
      console.error('Judge competition error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/competitions/:id/results
  async results(req, res) {
    try {
      const [results] = await db.query(
        `SELECT ce.*, u.name, u.avatar,
         (SELECT COUNT(*) FROM competition_votes WHERE entry_id = ce.id) as vote_count
         FROM competition_entries ce 
         JOIN users u ON ce.user_id = u.id WHERE ce.competition_id = ? 
         ORDER BY vote_count DESC, ce.score DESC`,
        [req.params.id]
      );
      res.json({ results });
    } catch (error) {
      console.error('Results error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/competitions/:id
  async delete(req, res) {
    try {
      await db.query('DELETE FROM competitions WHERE id = ?', [req.params.id]);
      res.json({ message: 'Competition deleted.' });
    } catch (error) {
      console.error('Delete competition error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = competitionController;
