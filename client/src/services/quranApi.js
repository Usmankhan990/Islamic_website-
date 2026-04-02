const QURAN_API = 'https://api.alquran.cloud/v1';

const TRANSLATIONS = {
  en: { name: 'English', edition: 'en.asad' },
  ur: { name: 'اردو (Urdu)', edition: 'ur.jalandhry' },
  fr: { name: 'Français', edition: 'fr.hamidullah' },
  tr: { name: 'Türkçe', edition: 'tr.diyanet' },
  id: { name: 'Indonesian', edition: 'id.indonesian' },
  bn: { name: 'বাংলা (Bengali)', edition: 'bn.bengali' },
  es: { name: 'Español', edition: 'es.cortes' },
  de: { name: 'Deutsch', edition: 'de.aburida' },
  ru: { name: 'Русский', edition: 'ru.kuliev' },
  ml: { name: 'മലയാളം (Malayalam)', edition: 'ml.abdulhameed' }
};

const RECITERS = {
  'ar.alafasy': 'Mishary Rashid Alafasy',
  'ar.abdurrahmaansudais': 'Abdur Rahman As-Sudais',
  'ar.abdulsamad': 'Abdul Samad',
  'ar.husary': 'Mahmoud Khalil Al-Husary',
  'ar.minshawi': 'Mohamed Siddiq El-Minshawi'
};

// Audio editions for verse-by-verse playback
const AUDIO_EDITIONS = {
  ar: { name: 'Arabic (Alafasy)', edition: 'ar.alafasy' },
  en: { name: 'English', edition: 'en.walk' },
  ur: { name: 'Urdu', edition: 'ur.khan' },
};

export async function getSurahs() {
  const res = await fetch(`${QURAN_API}/surah`);
  const data = await res.json();
  return data.data;
}

export async function getSurah(number, edition = 'quran-uthmani') {
  const res = await fetch(`${QURAN_API}/surah/${number}/${edition}`);
  const data = await res.json();
  return data.data;
}

export async function getSurahWithTranslation(number, lang = 'en') {
  const edition = TRANSLATIONS[lang]?.edition || 'en.asad';
  const [arabic, translation] = await Promise.all([
    fetch(`${QURAN_API}/surah/${number}/quran-uthmani`).then(r => r.json()),
    fetch(`${QURAN_API}/surah/${number}/${edition}`).then(r => r.json())
  ]);
  return { arabic: arabic.data, translation: translation.data };
}

export async function getAudioForSurah(number, reciter = 'ar.alafasy') {
  const res = await fetch(`${QURAN_API}/surah/${number}/${reciter}`);
  const data = await res.json();
  return data.data;
}

// Get verse-by-verse audio for a surah
export async function getSurahWithAudio(number, reciter = 'ar.alafasy') {
  const res = await fetch(`${QURAN_API}/surah/${number}/${reciter}`);
  const data = await res.json();
  return data.data; // Each ayah has .audio property
}

export { TRANSLATIONS, RECITERS, AUDIO_EDITIONS };
