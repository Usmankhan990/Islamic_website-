const express = require('express');
const router = express.Router();
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * TTS Service — Microsoft Edge Neural TTS
 * Provides high-quality, natural, clear audio for Arabic, Urdu, and English.
 * Free, no API key required. Uses Microsoft Edge's Read Aloud voices.
 *
 * Voices:
 *   Arabic:  ar-SA-HamedNeural (male, clear, natural)
 *   Urdu:    ur-PK-AsadNeural  (male, clear)
 *   English: en-US-GuyNeural   (male, clear, natural)
 *
 * GET /api/tts?text=TEXT&lang=ar|ur|en&speed=slow|medium|fast
 */

// Voice configuration per language
const VOICES = {
  ar: { voice: 'ar-SA-HamedNeural', name: 'Arabic (Saudi)' },
  ur: { voice: 'ur-PK-AsadNeural', name: 'Urdu (Pakistan)' },
  en: { voice: 'en-US-GuyNeural', name: 'English (US)' },
  hi: { voice: 'hi-IN-MadhurNeural', name: 'Hindi (India)' },
  fr: { voice: 'fr-FR-HenriNeural', name: 'French' },
  tr: { voice: 'tr-TR-AhmetNeural', name: 'Turkish' },
  de: { voice: 'de-DE-ConradNeural', name: 'German' },
  es: { voice: 'es-ES-AlvaroNeural', name: 'Spanish' },
  ru: { voice: 'ru-RU-DmitryNeural', name: 'Russian' },
};

// Speed presets — SSML prosody rate values
const SPEED_MAP = {
  'x-slow': '-40%',   // Extra slow for very young children
  'slow': '-25%',     // Slow and clear for kids
  'medium': '0%',     // Normal speed
  'fast': '+15%',     // Slightly faster
};

/**
 * GET /api/tts?text=...&lang=ar|ur|en&speed=slow
 */
router.get('/', async (req, res) => {
  try {
    const { text, lang = 'en', speed = 'slow' } = req.query;

    if (!text) {
      return res.status(400).json({ message: 'Text is required.' });
    }

    // Limit text length
    const cleanText = text.substring(0, 600);

    // Get voice config
    const voiceConfig = VOICES[lang] || VOICES['en'];
    const rate = SPEED_MAP[speed] || SPEED_MAP['slow'];

    // Create TTS instance
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceConfig.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    // Set response headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Generate speech with SSML prosody for speed control
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
      <voice name="${voiceConfig.voice}">
        <prosody rate="${rate}">
          ${escapeXml(cleanText)}
        </prosody>
      </voice>
    </speak>`;

    const readable = tts.toStream(cleanText);

    // Collect audio chunks and pipe to response
    readable.audioStream.pipe(res);

    readable.audioStream.on('error', (err) => {
      console.error('TTS audio stream error:', err.message);
      if (!res.headersSent) {
        res.status(503).json({ message: 'TTS service temporarily unavailable.' });
      }
    });

  } catch (error) {
    console.error('TTS route error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'TTS service error. Please try again.' });
    }
  }
});

/**
 * POST /api/tts — For longer texts
 */
router.post('/', async (req, res) => {
  try {
    const { text, lang = 'en', speed = 'slow' } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required.' });

    const cleanText = text.substring(0, 600);
    const voiceConfig = VOICES[lang] || VOICES['en'];

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceConfig.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const readable = tts.toStream(cleanText);
    readable.audioStream.pipe(res);

    readable.audioStream.on('error', (err) => {
      console.error('TTS POST error:', err.message);
      if (!res.headersSent) {
        res.status(503).json({ message: 'TTS unavailable.' });
      }
    });

  } catch (error) {
    console.error('TTS POST route error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

/**
 * GET /api/tts/voices — List available voices (for debugging)
 */
router.get('/voices', (req, res) => {
  res.json({
    message: 'Available TTS voices',
    voices: Object.entries(VOICES).map(([code, config]) => ({
      lang: code,
      voice: config.voice,
      name: config.name,
    })),
    speeds: Object.keys(SPEED_MAP),
  });
});

// Escape XML special characters for SSML
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = router;
