import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import ur from './translations/ur';
import ar from './translations/ar';
import fr from './translations/fr';
import tr from './translations/tr';
import id from './translations/id';
import bn from './translations/bn';
import es from './translations/es';
import de from './translations/de';
import ru from './translations/ru';
import ml from './translations/ml';

// UI languages. English text in the code is the key; each dictionary maps it to a translation,
// and anything missing falls back to English.
export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'ml', name: 'മലയാളം', dir: 'ltr' },
];

const DICTIONARIES = { en: {}, ur, ar, fr, tr, id, bn, es, de, ru, ml };
const STORAGE_KEY = 'uiLanguage';

const LanguageContext = createContext(null);

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTIONARIES[saved]) return saved;
  } catch { /* storage unavailable */ }
  // First visit: follow the browser language when we support it
  const browser = (navigator.language || 'en').slice(0, 2);
  return DICTIONARIES[browser] ? browser : 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLanguage);
  const info = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = info.dir;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable */ }
  }, [lang, info.dir]);

  const setLang = useCallback((code) => { if (DICTIONARIES[code]) setLangState(code); }, []);

  // t('Level {n} of {total}', { n: 1, total: 3 })
  const t = useCallback((text, vars) => {
    let out = DICTIONARIES[lang]?.[text] ?? text;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return out;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: info.dir, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
