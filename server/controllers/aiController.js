const db = require('../config/db');

const aiController = {
  // POST /api/ai/ask — Main AI question-answering endpoint
  async ask(req, res) {
    try {
      const { question } = req.body;
      if (!question || question.trim().length < 2) {
        return res.status(400).json({ message: 'Please ask a question.' });
      }

      const query = question.toLowerCase().trim();
      const words = query.split(/\s+/).filter(w => w.length > 2);

      // Remove common stop words
      const stopWords = ['what','how','the','is','are','was','were','can','you','tell','me','about','please','does','do','who','when','where','why','this','that','there','should','would','could'];
      const searchTerms = words.filter(w => !stopWords.includes(w));

      if (searchTerms.length === 0) {
        return res.json({
          answer: "I'd be happy to help! Could you please ask a specific Islamic question? For example, try asking about prayer, fasting, hadith, Quran, wudu, or any topic you'd like to learn about.",
          sources: [],
          confidence: 'low'
        });
      }

      // Build FULLTEXT-like search using keyword matching
      let whereClause = searchTerms.map(() => 'keywords ILIKE ?').join(' OR ');
      whereClause += ' OR ' + searchTerms.map(() => 'answer ILIKE ?').join(' OR ');
      const params = [
        ...searchTerms.map(t => `%${t}%`),
        ...searchTerms.map(t => `%${t}%`)
      ];

      const [results] = await db.query(
        `SELECT *, (
          ${searchTerms.map((_, i) => `(CASE WHEN keywords ILIKE ? THEN 3 ELSE 0 END)`).join(' + ')} +
          ${searchTerms.map((_, i) => `(CASE WHEN answer ILIKE ? THEN 1 ELSE 0 END)`).join(' + ')}
        ) as relevance
        FROM ai_knowledge_base
        WHERE ${whereClause}
        ORDER BY relevance DESC
        LIMIT 5`,
        [
          ...searchTerms.map(t => `%${t}%`), // for relevance score keywords
          ...searchTerms.map(t => `%${t}%`), // for relevance score answer
          ...params // for WHERE clause
        ]
      );

      if (results.length === 0) {
        // Try broader search with individual words
        const [broader] = await db.query(
          'SELECT * FROM ai_knowledge_base WHERE ' + 
          searchTerms.slice(0, 3).map(() => '(keywords ILIKE ? OR answer ILIKE ?)').join(' OR ') +
          ' ORDER BY id LIMIT 3',
          searchTerms.slice(0, 3).flatMap(t => [`%${t}%`, `%${t}%`])
        );

        if (broader.length > 0) {
          return res.json({
            answer: broader[0].answer,
            sources: broader.map(r => ({ category: r.category, source: r.source })),
            related: broader.slice(1).map(r => r.answer),
            confidence: 'medium'
          });
        }

        return res.json({
          answer: "I don't have a specific answer for that question in my knowledge base yet. Try asking about:\n\n• **Hadith** - Sayings of the Prophet (ﷺ)\n• **Prayer** - How to pray, wudu, salah\n• **Quran** - Surahs, verses, tafsir\n• **Fiqh** - Islamic jurisprudence\n• **Daily Du'as** - Prayers for daily life\n• **Ramadan** - Fasting, Laylatul Qadr\n• **Zakat** - Charity rules",
          sources: [],
          confidence: 'none'
        });
      }

      // Compile answer from top results
      const primaryAnswer = results[0].answer;
      const relatedAnswers = results.slice(1, 3).map(r => r.answer);
      const sources = [...new Set(results.map(r => r.source))].filter(Boolean);

      res.json({
        answer: primaryAnswer,
        sources: results.slice(0, 3).map(r => ({ category: r.category, source: r.source })),
        related: relatedAnswers,
        confidence: results[0].relevance > 4 ? 'high' : results[0].relevance > 2 ? 'medium' : 'low'
      });
    } catch (error) {
      console.error('AI ask error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/ai/topics — Get available topics
  async topics(req, res) {
    try {
      const [results] = await db.query(
        'SELECT category, COUNT(*) as count FROM ai_knowledge_base GROUP BY category'
      );
      res.json({ topics: results });
    } catch (error) {
      console.error('AI topics error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/ai/knowledge — Admin adds to knowledge base
  async addKnowledge(req, res) {
    try {
      const { category, answer, source, keywords, question } = req.body;
      await db.query(
        'INSERT INTO ai_knowledge_base (category, answer, source, keywords, question) VALUES (?,?,?,?,?)',
        [category, answer, source, keywords, question]
      );
      res.status(201).json({ message: 'Knowledge added!' });
    } catch (error) {
      console.error('Add knowledge error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/ai/knowledge — Admin views knowledge base
  async getKnowledge(req, res) {
    try {
      const [entries] = await db.query('SELECT * FROM ai_knowledge_base ORDER BY created_at DESC');
      res.json({ entries });
    } catch (error) {
      console.error('Get knowledge error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = aiController;
