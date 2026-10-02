import { useState, useEffect, useRef, useCallback } from 'react';
import { getSurahs, getSurahWithTranslation, getSurahWithAudio, getHumanTranslationAudio, TRANSLATIONS, RECITERS, HUMAN_TRANSLATION_AUDIO } from '../services/quranApi';
import { API_BASE } from '../services/api';

// Bump when server-side pronunciation changes so browsers don't replay cached old audio
const TTS_VERSION = 3;

export default function Quran() {
  const [surahs, setSurahs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lang, setLang] = useState('en');
  const [reciter, setReciter] = useState('ar.alafasy');
  const [data, setData] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surahLoading, setSurahLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [playingVerse, setPlayingVerse] = useState(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [withTranslation, setWithTranslation] = useState(false);
  const [speakingTranslation, setSpeakingTranslation] = useState(null);
  const [voiceGender, setVoiceGender] = useState(() => {
    // 'human' = real recorded translation (where available), 'male'/'female' = AI voice
    try { return localStorage.getItem('quranTranslationVoice') || 'human'; } catch { return 'human'; }
  });
  const voiceGenderRef = useRef(voiceGender);
  const audioRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const isPlayingAllRef = useRef(false);
  const withTranslationRef = useRef(false);
  const verseRefs = useRef({});

  useEffect(() => {
    getSurahs().then(s => { setSurahs(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const loadSurah = async (num) => {
    setSelected(num);
    setSurahLoading(true);
    stopPlaying();
    try {
      const [d, audio] = await Promise.all([
        getSurahWithTranslation(num, lang),
        getSurahWithAudio(num, reciter)
      ]);
      setData(d);
      setAudioData(audio);
    } catch { }
    setSurahLoading(false);
  };

  useEffect(() => {
    if (selected) {
      stopPlaying();
      getSurahWithTranslation(selected, lang).then(d => setData(d)).catch(() => {});
    }
  }, [lang]);

  useEffect(() => {
    if (selected) {
      stopPlaying();
      getSurahWithAudio(selected, reciter).then(a => setAudioData(a)).catch(() => {});
    }
  }, [reciter]);

  // Keep the ref in sync so toggling "With Translation Audio" applies immediately, even mid-playback
  useEffect(() => {
    withTranslationRef.current = withTranslation;
  }, [withTranslation]);

  // Same for the translation voice; also remember the choice
  useEffect(() => {
    voiceGenderRef.current = voiceGender;
    try { localStorage.setItem('quranTranslationVoice', voiceGender); } catch { /* storage unavailable */ }
  }, [voiceGender]);

  // Stop all audio when leaving the page so nothing keeps playing in the background
  useEffect(() => () => {
    isPlayingAllRef.current = false;
    [audioRef, ttsAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.onended = null;
        ref.current.onerror = null;
        ref.current.pause();
        ref.current = null;
      }
    });
  }, []);

  const scrollToVerse = (index) => {
    const el = verseRefs.current[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const playVerse = useCallback((index) => {
    if (!audioData?.ayahs?.[index]?.audio) return;

    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioData.ayahs[index].audio);
    audioRef.current = audio;
    setPlayingVerse(index);
    scrollToVerse(index);

    audio.play().catch(() => {});

    // Continue to the next verse in Play All mode, otherwise finish
    const next = () => {
      if (isPlayingAllRef.current && index + 1 < audioData.ayahs.length) {
        // Re-check at fire time so Stop during the gap really stops
        setTimeout(() => { if (isPlayingAllRef.current) playVerse(index + 1); }, 300);
      } else {
        setPlayingVerse(null);
        setIsPlayingAll(false);
        isPlayingAllRef.current = false;
      }
    };

    audio.onended = () => {
      // If withTranslation mode, speak translation before moving to next
      if (withTranslationRef.current && data?.translation?.ayahs?.[index]?.text) {
        playTranslation(index, next);
      } else {
        next();
      }
    };

    audio.onerror = next;
  }, [audioData, data, lang]);

  // Play the translation of one verse: real human recording when available
  // (falls back to AI voice if it fails), otherwise AI neural voice via backend TTS
  const playTranslation = (index, onDone) => {
    const text = data?.translation?.ayahs?.[index]?.text;
    if (!text) { if (onDone) onDone(); return; }

    // Stop any existing translation audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.onended = null;
      ttsAudioRef.current.onerror = null;
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    const choice = voiceGenderRef.current;
    const ttsLang = ['ur', 'fr', 'tr', 'de', 'es', 'ru'].includes(lang) ? lang : 'en';
    const ttsGender = choice === 'female' ? 'female' : 'male';
    // v= busts browser cache of audio generated before pronunciation fixes
    const ttsUrl = `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=${ttsLang}&speed=slow&gender=${ttsGender}&v=${TTS_VERSION}`;
    const humanUrl = choice === 'human'
      ? getHumanTranslationAudio(lang, data.arabic.number, data.arabic.ayahs[index].numberInSurah)
      : null;

    setSpeakingTranslation(index);

    const finish = () => {
      setSpeakingTranslation(null);
      ttsAudioRef.current = null;
      if (onDone) onDone();
    };

    const start = (url, fallbackUrl) => {
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      const fail = () => {
        if (ttsAudioRef.current !== audio) return; // already stopped/replaced
        if (fallbackUrl) start(fallbackUrl, null); else finish();
      };
      audio.onended = finish;
      audio.onerror = fail;
      audio.play().catch(fail);
    };

    start(humanUrl || ttsUrl, humanUrl ? ttsUrl : null);
  };

  const speakVerseTranslation = (verseIndex) => {
    // Clicking the active translation button again stops it
    if (speakingTranslation === verseIndex) { stopPlaying(); return; }
    stopPlaying();
    playTranslation(verseIndex);
  };

  const playAll = () => {
    if (!audioData?.ayahs?.length) return;
    isPlayingAllRef.current = true;
    setIsPlayingAll(true);
    playVerse(0);
  };

  const stopPlaying = () => {
    isPlayingAllRef.current = false;
    [audioRef, ttsAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.onended = null;
        ref.current.onerror = null;
        ref.current.pause();
        ref.current = null;
      }
    });
    setPlayingVerse(null);
    setIsPlayingAll(false);
    setSpeakingTranslation(null);
  };

  const isAnythingPlaying = isPlayingAll || playingVerse !== null || speakingTranslation !== null;

  const filtered = surahs.filter(s =>
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    s.name.includes(search) ||
    s.number.toString() === search
  );

  return (
    <div className="page">
      <div className="quran-layout container">
        {/* Sidebar */}
        <div className="quran-sidebar">
          <h2 className="heading-md" style={{ marginBottom: 16 }}>📖 Quran</h2>
          <input type="text" className="form-input" placeholder="🔍 Search surah..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
          <div className="quran-lang-select">
            <select className="form-select" value={lang} onChange={e => setLang(e.target.value)} style={{ fontSize: '0.85rem', padding: '10px 14px' }}>
              {Object.entries(TRANSLATIONS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </div>
          <div className="surah-list">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }}></div>)
            ) : (
              filtered.map(s => (
                <button key={s.number} className={`surah-item ${selected === s.number ? 'active' : ''}`} onClick={() => loadSurah(s.number)}>
                  <span className="surah-num">{s.number}</span>
                  <div className="surah-info">
                    <span className="surah-en">{s.englishName}</span>
                    <span className="surah-ar">{s.name}</span>
                  </div>
                  <span className="surah-verses">{s.numberOfAyahs} ayahs</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content */}
        <div className="quran-content">
          {!selected && (
            <div className="quran-welcome">
              <span style={{ fontSize: '4rem' }}>📖</span>
              <h2 className="heading-lg">The Holy Quran</h2>
              <p className="text-muted" style={{ maxWidth: 500, margin: '12px auto' }}>
                Select a Surah from the left to start reading with verse-by-verse audio.
              </p>
              <p className="arabic-text" style={{ fontSize: '2rem', marginTop: 24 }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            </div>
          )}

          {surahLoading && <div className="loader"><div className="spinner"></div></div>}

          {data && !surahLoading && (
            <div className="surah-content animate-fade-in">
              <div className="surah-header">
                <h2 className="heading-lg">{data.arabic.englishName}</h2>
                <p className="arabic-text" style={{ fontSize: '2.5rem' }}>{data.arabic.name}</p>
                <p className="text-muted">{data.arabic.englishNameTranslation} • {data.arabic.numberOfAyahs} verses • {data.arabic.revelationType}</p>
                
                {/* Audio Controls Bar */}
                <div className="quran-audio-bar">
                  <select className="form-select quran-reciter-select" value={reciter} onChange={e => setReciter(e.target.value)}>
                    {Object.entries(RECITERS).map(([k, v]) => <option key={k} value={k}>🎙️ {v}</option>)}
                  </select>
                  {!isAnythingPlaying ? (
                    <button className="quran-play-all-btn" onClick={playAll}>
                      <span className="play-icon">▶</span> Play All
                    </button>
                  ) : (
                    <button className="quran-stop-btn" onClick={stopPlaying}>
                      <span>⏹</span> Stop
                    </button>
                  )}
                  {playingVerse !== null && (
                    <span className="quran-now-playing">
                      🔊 Verse {playingVerse + 1}/{data.arabic.numberOfAyahs}
                      {speakingTranslation !== null && ' 🗣️ Translation'}
                    </span>
                  )}
                  <label className="quran-trans-toggle">
                    <input type="checkbox" checked={withTranslation} onChange={e => setWithTranslation(e.target.checked)} />
                    <span>🗣️ With Translation Audio</span>
                  </label>
                  <select className="form-select quran-voice-select"
                    value={voiceGender === 'human' && !HUMAN_TRANSLATION_AUDIO[lang] ? 'male' : voiceGender}
                    onChange={e => setVoiceGender(e.target.value)} title="Translation voice">
                    {HUMAN_TRANSLATION_AUDIO[lang] && (
                      <option value="human">🎙️ Real voice ({HUMAN_TRANSLATION_AUDIO[lang].name})</option>
                    )}
                    <option value="male">👨 AI Male voice</option>
                    <option value="female">👩 AI Female voice</option>
                  </select>
                </div>
              </div>

              {selected !== 9 && (
                <div className="bismillah arabic-text" style={{ textAlign: 'center', fontSize: '2rem', padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              <div className="verses-list">
                {data.arabic.ayahs.map((ayah, i) => (
                  <div key={i} ref={el => verseRefs.current[i] = el}
                    className={`verse-item ${playingVerse === i ? 'verse-playing' : ''}`}>
                    <div className="verse-number">{ayah.numberInSurah}</div>
                    <div className="verse-content">
                      <p className="arabic-text">{ayah.text}</p>
                      <p className="verse-translation">{data.translation.ayahs[i]?.text}</p>
                    </div>
                    <button className={`verse-play-btn ${playingVerse === i ? 'active' : ''}`}
                      onClick={() => {
                        if (playingVerse === i) { stopPlaying(); } 
                        else { isPlayingAllRef.current = false; setIsPlayingAll(false); playVerse(i); }
                      }}
                      title={playingVerse === i ? 'Stop' : 'Play verse'}>
                      {playingVerse === i ? (
                        <span className="verse-playing-anim">
                          <span></span><span></span><span></span>
                        </span>
                      ) : '▶'}
                    </button>
                    <button className={`verse-trans-btn ${speakingTranslation === i ? 'active' : ''}`}
                      onClick={() => speakVerseTranslation(i)}
                      title="Play translation audio">
                      🗣️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .quran-layout { display: grid; grid-template-columns: 340px 1fr; gap: 24px; min-height: 80vh; }
        .quran-sidebar {
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
          padding: 20px; height: fit-content; max-height: calc(100vh - 100px);
          position: sticky; top: calc(var(--navbar-height) + 16px); display: flex; flex-direction: column;
        }
        .quran-lang-select { margin-bottom: 12px; }
        .surah-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 4px; max-height: 60vh; }
        .surah-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); background: none; border: none; color: var(--text); cursor: pointer; transition: var(--transition); text-align: left; width: 100%; }
        .surah-item:hover { background: var(--surface-light); }
        .surah-item.active { background: var(--primary); color: white; }
        .surah-num { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--surface-light); border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
        .surah-item.active .surah-num { background: rgba(255,255,255,0.2); }
        .surah-info { flex: 1; min-width: 0; }
        .surah-en { display: block; font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .surah-ar { display: block; font-family: var(--font-arabic); font-size: 0.85rem; color: var(--text-muted); }
        .surah-item.active .surah-ar { color: rgba(255,255,255,0.7); }
        .surah-verses { font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; }
        .quran-content { min-height: 60vh; }
        .quran-welcome { text-align: center; padding: 80px 20px; }
        .surah-header { text-align: center; padding: 32px 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; }

        .quran-audio-bar {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          margin-top: 20px; padding: 12px 16px; background: var(--bg);
          border: 1px solid var(--border); border-radius: var(--radius-full); flex-wrap: wrap;
        }
        .quran-reciter-select { max-width: 240px; font-size: 0.85rem; border-radius: var(--radius-full); }
        .quran-voice-select { max-width: 260px; font-size: 0.85rem; border-radius: var(--radius-full); padding: 6px 14px; }
        .quran-play-all-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 24px;
          background: linear-gradient(135deg, var(--primary), #15a168); color: white;
          border: none; border-radius: var(--radius-full); font-weight: 700; font-size: 0.9rem;
          cursor: pointer; transition: var(--transition);
        }
        .quran-play-all-btn:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(13,107,75,0.4); }
        .play-icon { font-size: 0.8rem; }
        .quran-stop-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 24px;
          background: #EF4444; color: white; border: none; border-radius: var(--radius-full);
          font-weight: 700; font-size: 0.9rem; cursor: pointer;
        }
        .quran-now-playing {
          padding: 6px 14px; background: rgba(212,168,67,0.15); color: var(--accent);
          border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600;
          animation: pulse 2s infinite;
        }

        .verses-list { display: flex; flex-direction: column; gap: 16px; }
        .verse-item {
          display: flex; gap: 16px; padding: 20px; border-radius: var(--radius-md);
          border: 1px solid var(--border); transition: all 0.4s ease;
        }
        .verse-item:hover { border-color: var(--primary); background: rgba(13,107,75,0.03); }
        .verse-item.verse-playing {
          border-color: var(--accent); background: rgba(212,168,67,0.06);
          box-shadow: 0 0 30px rgba(212,168,67,0.1), inset 0 0 60px rgba(212,168,67,0.02);
          transform: scale(1.01);
        }
        .verse-number { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
        .verse-content { flex: 1; }
        .verse-translation { margin-top: 12px; color: var(--text-muted); font-size: 0.95rem; line-height: 1.7; }
        .verse-play-btn {
          width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
          background: var(--surface-light); border: 1px solid var(--border); border-radius: 50%;
          cursor: pointer; font-size: 0.9rem; transition: var(--transition); flex-shrink: 0; align-self: center; color: var(--text);
        }
        .verse-play-btn:hover { background: var(--primary); border-color: var(--primary); color: white; }
        .verse-play-btn.active { background: var(--accent); border-color: var(--accent); color: #1a1a2e; }

        .verse-playing-anim {
          display: flex; align-items: flex-end; gap: 2px; height: 16px;
        }
        .verse-playing-anim span {
          width: 3px; background: #1a1a2e; border-radius: 2px;
          animation: audioWave 0.8s ease-in-out infinite;
        }
        .verse-playing-anim span:nth-child(1) { height: 6px; animation-delay: 0s; }
        .verse-playing-anim span:nth-child(2) { height: 12px; animation-delay: 0.2s; }
        .verse-playing-anim span:nth-child(3) { height: 8px; animation-delay: 0.4s; }

        @keyframes audioWave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }

        .quran-trans-toggle {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          font-size: 0.85rem; color: var(--text-muted); font-weight: 600;
          padding: 6px 14px; background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-full);
        }
        .quran-trans-toggle input { accent-color: var(--primary); width: 16px; height: 16px; cursor: pointer; }
        .verse-trans-btn {
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          background: var(--surface-light); border: 1px solid var(--border); border-radius: 50%;
          cursor: pointer; font-size: 0.85rem; transition: var(--transition); flex-shrink: 0; align-self: center;
        }
        .verse-trans-btn:hover { background: #3B82F6; border-color: #3B82F6; }
        .verse-trans-btn.active { background: #3B82F6; border-color: #3B82F6; animation: pulse 1s infinite; }

        @media (max-width: 768px) {
          .quran-layout { grid-template-columns: 1fr; }
          .quran-sidebar { position: static; max-height: none; }
          .surah-list { max-height: 300px; }
          .quran-audio-bar { flex-direction: column; border-radius: var(--radius-lg); }
        }
      `}</style>
    </div>
  );
}
