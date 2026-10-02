const express = require('express');
const router = express.Router();
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * TTS Service — Microsoft Edge Neural TTS
 * Provides high-quality, natural, clear audio for Arabic, Urdu, and English.
 * Free, no API key required. Uses Microsoft Edge's Read Aloud voices.
 *
 * Each language has a male and a female neural voice (pick with ?gender=male|female).
 *
 * GET /api/tts?text=TEXT&lang=ar|ur|en&speed=slow|medium|fast&gender=male|female
 */

// Voice configuration per language: male + female
const VOICES = {
  ar: { male: 'ar-SA-HamedNeural', female: 'ar-SA-ZariyahNeural', name: 'Arabic (Saudi)' },
  ur: { male: 'ur-PK-AsadNeural', female: 'ur-PK-UzmaNeural', name: 'Urdu (Pakistan)' },
  en: { male: 'en-US-AndrewNeural', female: 'en-US-AvaNeural', name: 'English (US)' },
  hi: { male: 'hi-IN-MadhurNeural', female: 'hi-IN-SwaraNeural', name: 'Hindi (India)' },
  fr: { male: 'fr-FR-HenriNeural', female: 'fr-FR-DeniseNeural', name: 'French' },
  tr: { male: 'tr-TR-AhmetNeural', female: 'tr-TR-EmelNeural', name: 'Turkish' },
  de: { male: 'de-DE-ConradNeural', female: 'de-DE-KatjaNeural', name: 'German' },
  es: { male: 'es-ES-AlvaroNeural', female: 'es-ES-ElviraNeural', name: 'Spanish' },
  ru: { male: 'ru-RU-DmitryNeural', female: 'ru-RU-SvetlanaNeural', name: 'Russian' },
};

function pickVoice(lang, gender) {
  const config = VOICES[lang] || VOICES.en;
  return gender === 'female' ? config.female : config.male;
}

// Make translation text easier to speak naturally: parentheses/brackets become short pauses
function prepareText(text, lang) {
  const pause = lang === 'ur' ? '، ' : ', ';
  if (lang === 'ur') {
    text = text
      .replace(/ﷺ/g, ' صلی اللّٰہ علیہ وسلم ')
      .replace(/ي/g, 'ی')   // Arabic yeh -> Urdu yeh
      .replace(/ك/g, 'ک')   // Arabic kaf -> Urdu keheh
      .replace(/ه/g, 'ہ')   // Arabic heh -> Urdu heh (Jalandhry writes الله with Arabic heh)
      // One canonical spelling for Allah; splitForUrdu() sends it to the Arabic voice
      .replace(/الل[ہه]/g, 'اللّٰہ')
      .replace(/ـ/g, '');   // tatweel
  } else {
    text = text.replace(/ﷺ/g, ' peace be upon him ');
  }
  return text
    .replace(/\s*[([{﴿)\]}﴾]\s*/g, pause)
    .replace(/\s*([،,]\s*){2,}/g, pause)
    .replace(/\s+/g, ' ')
    .replace(/^[،,]\s*/, '')
    .trim();
}

// Speed presets — SSML prosody rate values
const SPEED_MAP = {
  'x-slow': '-25%',   // Extra slow for very young children
  'slow': '-10%',     // Slightly slower and clear (more slowing distorts neural voices)
  'medium': '0%',     // Normal speed
  'fast': '+15%',     // Slightly faster
};

// Urdu neural voice runs words together at normal pace; slow it a bit more
const URDU_SPEED_MAP = { 'x-slow': '-30%', 'slow': '-18%', 'medium': '-8%', 'fast': '+5%' };

function pickRate(lang, speed) {
  const map = lang === 'ur' ? URDU_SPEED_MAP : SPEED_MAP;
  return map[speed] || map.slow;
}

// Build SSML body. Note: Edge's free endpoint rejects <break> tags (returns empty audio),
// so pauses come from the punctuation itself.
function toSsml(text) {
  return escapeXml(text);
}

// Synthesize one piece of text with one voice and return the MP3 bytes
function synthesize(voice, text, rate) {
  return new Promise(async (resolve, reject) => {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(toSsml(text), { rate });
      const chunks = [];
      audioStream.on('data', (d) => chunks.push(d));
      audioStream.on('error', reject);
      audioStream.on('close', () => resolve(Buffer.concat(chunks)));
    } catch (err) {
      reject(err);
    }
  });
}

// Words that contain Allah (incl. و/ب prefixes, ماشاءاللہ) and the ﷺ phrase
const ALLAH_RE = /(صلی اللّٰہ علیہ وسلم|[^\s،۔]*اللّٰہ[^\s،۔]*)/g;

// Convert an Urdu-spelled Allah word back to Arabic spelling for the Arabic voice
function toArabicSpelling(word) {
  return word.replace(/اللّٰہ/g, 'الله').replace(/ہ/g, 'ه').replace(/ی/g, 'ي').replace(/ک/g, 'ك');
}

// Urdu voices mispronounce "Allah". Split the text so every Allah word is spoken by the
// Arabic voice of the same gender, the rest by the Urdu voice, then join the MP3 parts.
function splitForUrdu(text, gender) {
  const urVoice = pickVoice('ur', gender);
  const arVoice = pickVoice('ar', gender);
  return text.split(ALLAH_RE)
    .map((part) => part.trim())
    .filter((part) => part && !/^[،۔,.\s]+$/.test(part))
    .map((part) => /اللّٰہ/.test(part)
      ? { voice: arVoice, text: toArabicSpelling(part), rate: '-10%' }
      : { voice: urVoice, text: part });
}

async function sendSpeech(res, { text, lang = 'en', speed = 'slow', gender = 'male' }) {
  if (!text) return res.status(400).json({ message: 'Text is required.' });

  const cleanText = prepareText(String(text).substring(0, 600), lang);
  const rate = pickRate(lang, speed);

  const parts = lang === 'ur'
    ? splitForUrdu(cleanText, gender)
    : [{ voice: pickVoice(lang, gender), text: cleanText }];

  // Synthesize all parts in parallel, keep order
  const buffers = await Promise.all(parts.map((p) => synthesize(p.voice, p.text, p.rate || rate)));
  const audio = Buffer.concat(buffers);
  if (!audio.length) return res.status(503).json({ message: 'TTS service temporarily unavailable.' });

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(audio);
}

/**
 * GET /api/tts?text=...&lang=ar|ur|en&speed=slow&gender=male|female
 */
router.get('/', async (req, res) => {
  try {
    await sendSpeech(res, req.query);
  } catch (error) {
    console.error('TTS route error:', error.message);
    if (!res.headersSent) res.status(500).json({ message: 'TTS service error. Please try again.' });
  }
});

/**
 * POST /api/tts — For longer texts
 */
router.post('/', async (req, res) => {
  try {
    await sendSpeech(res, req.body);
  } catch (error) {
    console.error('TTS POST route error:', error.message);
    if (!res.headersSent) res.status(500).json({ message: 'Server error.' });
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
      male: config.male,
      female: config.female,
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
