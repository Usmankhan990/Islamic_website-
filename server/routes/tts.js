const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

/**
 * TTS Proxy — serves high-quality audio from Google Translate TTS.
 * This provides natural, clear voices for Arabic, Urdu, and English
 * without requiring any API keys.
 * 
 * GET /api/tts?text=TEXT&lang=ar|ur|en
 */
router.get('/', async (req, res) => {
  try {
    const { text, lang = 'en' } = req.query;

    if (!text || text.length > 500) {
      return res.status(400).json({ message: 'Text is required and must be under 500 characters.' });
    }

    // Map language codes
    const langMap = {
      'ar': 'ar',
      'ur': 'ur',
      'en': 'en',
      'hi': 'hi',
      'fr': 'fr',
      'tr': 'tr',
      'de': 'de',
      'es': 'es',
      'ru': 'ru'
    };

    const ttsLang = langMap[lang] || 'en';
    const encodedText = encodeURIComponent(text);
    
    // Google Translate TTS URL
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${ttsLang}&client=tw-ob&ttsspeed=0.8`;

    // Set response headers for audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Proxy the request
    const proxyReq = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode === 200) {
        proxyRes.pipe(res);
      } else {
        // Fallback: try alternative URL format
        const altUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${ttsLang}&client=gtx&ttsspeed=0.8`;
        
        https.get(altUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        }, (altRes) => {
          if (altRes.statusCode === 200) {
            altRes.pipe(res);
          } else {
            res.status(503).json({ message: 'TTS service temporarily unavailable.' });
          }
        }).on('error', () => {
          res.status(503).json({ message: 'TTS service error.' });
        });
      }
    });

    proxyReq.on('error', (err) => {
      console.error('TTS proxy error:', err.message);
      res.status(503).json({ message: 'TTS service error.' });
    });

  } catch (error) {
    console.error('TTS route error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * POST /api/tts — For longer texts (split into chunks)
 */
router.post('/', async (req, res) => {
  try {
    const { text, lang = 'en' } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required.' });

    // Split long text and only use first 200 chars
    const chunk = text.substring(0, 200);
    const ttsLang = lang === 'ar' ? 'ar' : lang === 'ur' ? 'ur' : lang === 'hi' ? 'hi' : 'en';
    const encodedText = encodeURIComponent(chunk);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${ttsLang}&client=tw-ob&ttsspeed=0.8`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode === 200) {
        proxyRes.pipe(res);
      } else {
        res.status(503).json({ message: 'TTS unavailable.' });
      }
    }).on('error', () => {
      res.status(503).json({ message: 'TTS error.' });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
