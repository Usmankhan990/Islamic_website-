import { useState, useRef, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const DUAS = [
  {
    id: 1, emoji: '🌅', title: 'Waking Up', category: 'morning', color: '#FFB347',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Alhamdu lillahil-lathee ahyana ba'da ma amatana wa ilayhin-nushoor",
    english: 'All praise is for Allah who gave us life after causing us to die, and unto Him is the resurrection.',
    urdu: 'تمام تعریفیں اللہ کے لیے ہیں جس نے ہمیں موت دینے کے بعد زندگی دی اور اسی کی طرف اٹھنا ہے۔'
  },
  {
    id: 2, emoji: '🌙', title: 'Before Sleeping', category: 'night', color: '#7B68EE',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amootu wa ahya',
    english: 'In Your name, O Allah, I die and I live.',
    urdu: 'اے اللہ! تیرے نام سے مرتا ہوں اور جیتا ہوں۔'
  },
  {
    id: 3, emoji: '🍽️', title: 'Before Eating', category: 'food', color: '#FF6B6B',
    arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ',
    transliteration: 'Bismillahi wa ala barakatillah',
    english: 'In the name of Allah and with the blessings of Allah.',
    urdu: 'اللہ کے نام سے اور اللہ کی برکت پر۔'
  },
  {
    id: 4, emoji: '😋', title: 'After Eating', category: 'food', color: '#22C55E',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    transliteration: "Alhamdulillahil-lathee at'amana wa saqana wa ja'alana muslimeen",
    english: 'Praise be to Allah who gave us food and drink and made us Muslims.',
    urdu: 'تمام تعریفیں اللہ کے لیے ہیں جس نے ہمیں کھلایا اور پلایا اور ہمیں مسلمان بنایا۔'
  },
  {
    id: 5, emoji: '🏠', title: 'Entering Home', category: 'daily', color: '#3B82F6',
    arabic: 'بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: "Bismillahi walajna wa bismillahi kharajna wa 'ala Rabbina tawakkalna",
    english: 'In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we rely.',
    urdu: 'اللہ کے نام سے ہم داخل ہوئے اور اللہ کے نام سے ہم نکلے اور اپنے رب پر ہم نے بھروسہ کیا۔'
  },
  {
    id: 6, emoji: '✈️', title: 'Before Traveling', category: 'daily', color: '#F59E0B',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
    transliteration: "Subhanal-lathee sakhkhara lana hatha wa ma kunna lahu muqrineen",
    english: 'Glory be to the One who has subjected this for us, for we could never have done it ourselves.',
    urdu: 'پاک ہے وہ ذات جس نے اسے ہمارے لیے مسخر کر دیا اور ہم اس کی طاقت نہیں رکھتے تھے۔'
  },
  {
    id: 7, emoji: '📚', title: 'Before Studying', category: 'study', color: '#8B5CF6',
    arabic: 'رَبِّ زِدْنِي عِلْماً',
    transliteration: 'Rabbi zidnee ilma',
    english: 'O my Lord, increase me in knowledge.',
    urdu: 'اے میرے رب! مجھے علم میں اضافہ فرما۔'
  },
  {
    id: 8, emoji: '🕌', title: 'Entering Masjid', category: 'daily', color: '#0D6B4B',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahumma-ftah lee abwaba rahmatik',
    english: 'O Allah, open the doors of Your mercy for me.',
    urdu: 'اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔'
  },
  {
    id: 9, emoji: '🚿', title: 'Entering Bathroom', category: 'daily', color: '#6366F1',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    transliteration: "Allahumma innee a'oothu bika minal-khubthi wal-khaba'ith",
    english: 'O Allah, I seek refuge in You from evil and evil ones.',
    urdu: 'اے اللہ! میں خبیث جنوں اور جنیوں سے تیری پناہ چاہتا ہوں۔'
  },
  {
    id: 10, emoji: '😴', title: 'Waking from Bad Dream', category: 'night', color: '#EC4899',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'oothu bikalimatillahit-tammaati min sharri ma khalaq",
    english: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    urdu: 'میں اللہ کے مکمل کلمات کی پناہ لیتا ہوں اس کی مخلوق کے شر سے۔'
  },
  {
    id: 11, emoji: '🚶', title: 'Leaving Home', category: 'daily', color: '#14B8A6',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: "Bismillahi tawakkaltu 'ala Allahi wa la hawla wa la quwwata illa billah",
    english: 'In the name of Allah, I place my trust in Allah. There is no power or strength except with Allah.',
    urdu: 'اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا۔ اللہ کے بغیر کوئی طاقت اور قوت نہیں۔'
  },
  {
    id: 12, emoji: '🥛', title: 'After Drinking Milk', category: 'food', color: '#94A3B8',
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَزِدْنَا مِنْهُ',
    transliteration: 'Allahumma barik lana feehi wa zidna minhu',
    english: 'O Allah, bless us in it and give us more of it.',
    urdu: 'اے اللہ! ہمارے لیے اس میں برکت دے اور ہمیں اس سے زیادہ عطا فرما۔'
  },
  {
    id: 13, emoji: '🪞', title: 'Looking in Mirror', category: 'daily', color: '#A78BFA',
    arabic: 'اللَّهُمَّ أَنْتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي',
    transliteration: 'Allahumma anta hassanta khalqee fa-hassin khuluqee',
    english: 'O Allah, You have made my appearance beautiful, so make my character beautiful too.',
    urdu: 'اے اللہ! تو نے میری صورت خوبصورت بنائی ہے تو میرے اخلاق بھی خوبصورت بنا دے۔'
  },
  {
    id: 14, emoji: '🌧️', title: 'When It Rains', category: 'daily', color: '#60A5FA',
    arabic: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
    transliteration: "Allahumma sayyiban nafi'a",
    english: 'O Allah, let it be beneficial rain.',
    urdu: 'اے اللہ! فائدہ مند بارش فرما۔'
  },
  {
    id: 15, emoji: '🤧', title: 'After Sneezing', category: 'daily', color: '#FCD34D',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    english: 'All praise is for Allah.',
    urdu: 'تمام تعریفیں اللہ کے لیے ہیں۔'
  },
  {
    id: 16, emoji: '👕', title: 'Wearing New Clothes', category: 'daily', color: '#34D399',
    arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ',
    transliteration: 'Allahumma lakal-hamdu anta kasawtaneehi',
    english: 'O Allah, all praise is to You, You have clothed me with this.',
    urdu: 'اے اللہ! تمام تعریف تیرے لیے ہے، تو نے مجھے یہ پہنایا۔'
  },
  {
    id: 17, emoji: '⚡', title: 'Upon Hearing Thunder', category: 'daily', color: '#FBBF24',
    arabic: 'سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ',
    transliteration: "Subhanal-lathee yusabbihur-ra'du bihamdihi",
    english: 'Glory be to Him Whose praise the thunder glorifies.',
    urdu: 'پاک ہے وہ ذات جس کی حمد کے ساتھ بادل گرجتا ہے۔'
  },
  {
    id: 18, emoji: '😰', title: 'When In Difficulty', category: 'daily', color: '#F87171',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka innee kuntu minaz-zalimeen',
    english: 'There is no god but You. Glory be to You! I was among the wrongdoers.',
    urdu: 'تیرے سوا کوئی معبود نہیں، تو پاک ہے، بیشک میں ظالموں میں سے تھا۔'
  },
  {
    id: 19, emoji: '💤', title: 'Ayatul Kursi (Before Sleep)', category: 'night', color: '#818CF8',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    transliteration: 'Allahu la ilaha illa huwal-hayyul-qayyoom',
    english: 'Allah, there is no god but He, the Living, the Self-subsisting.',
    urdu: 'اللہ جس کے سوا کوئی معبود نہیں، وہ زندہ ہے، سب کا نگہبان ہے۔'
  },
  {
    id: 20, emoji: '🏫', title: 'For Parents', category: 'study', color: '#10B981',
    arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: 'Rabbir-hamhuma kama rabbayanee sagheera',
    english: 'My Lord, have mercy upon them (my parents) as they brought me up when I was small.',
    urdu: 'اے رب! ان دونوں پر رحم فرما جیسا کہ انہوں نے بچپن میں مجھے پالا۔'
  }
];

const CATEGORIES = [
  { key: 'all', label: '🌟 All' },
  { key: 'morning', label: '🌅 Morning' },
  { key: 'night', label: '🌙 Night' },
  { key: 'food', label: '🍽️ Food' },
  { key: 'daily', label: '🏠 Daily' },
  { key: 'study', label: '📚 Study' }
];

// Build TTS audio URL via backend proxy
function ttsUrl(text, lang) {
  return `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=${lang}`;
}

export default function KidsDuas() {
  const [category, setCategory] = useState('all');
  const [learned, setLearned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('duasLearned') || '[]'); } catch { return []; }
  });
  const [expanded, setExpanded] = useState({});
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  const sequenceRef = useRef(false);

  const filtered = category === 'all' ? DUAS : DUAS.filter(d => d.category === category);
  const learnedCount = learned.length;

  const toggleLearned = (id) => {
    const updated = learned.includes(id) ? learned.filter(x => x !== id) : [...learned, id];
    setLearned(updated);
    localStorage.setItem('duasLearned', JSON.stringify(updated));
  };

  // Play audio using backend TTS proxy (high-quality Google TTS)
  const playAudio = (text, lang, key, onDone) => {
    stopAudio();
    const url = ttsUrl(text, lang);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudio(key);

    audio.onended = () => {
      setPlayingAudio(null);
      audioRef.current = null;
      if (onDone) onDone();
    };
    audio.onerror = () => {
      setPlayingAudio(null);
      audioRef.current = null;
      if (onDone) onDone();
    };
    audio.play().catch(() => {
      setPlayingAudio(null);
      if (onDone) onDone();
    });
  };

  const stopAudio = () => {
    sequenceRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingAudio(null);
  };

  // Play Arabic du'a audio
  const playArabic = (dua) => {
    playAudio(dua.arabic, 'ar', `ar_${dua.id}`);
  };

  // Play English translation audio  
  const playEnglish = (dua) => {
    playAudio(dua.english, 'en', `en_${dua.id}`);
  };

  // Play Urdu translation audio
  const playUrdu = (dua) => {
    playAudio(dua.urdu, 'ur', `ur_${dua.id}`);
  };

  // Play full sequence: Arabic → English → Urdu
  const playSequence = (dua) => {
    sequenceRef.current = true;
    playAudio(dua.arabic, 'ar', `seq_ar_${dua.id}`, () => {
      if (!sequenceRef.current) return;
      setTimeout(() => {
        if (!sequenceRef.current) return;
        playAudio(dua.english, 'en', `seq_en_${dua.id}`, () => {
          if (!sequenceRef.current) return;
          setTimeout(() => {
            if (!sequenceRef.current) return;
            playAudio(dua.urdu, 'ur', `seq_ur_${dua.id}`);
          }, 400);
        });
      }, 400);
    });
  };

  return (
    <div className="page container">
      {/* Header */}
      <div className="duas-header animate-slide-up">
        <span className="duas-header-emoji">🤲</span>
        <h1 className="duas-title">Daily Du'as for Kids</h1>
        <p className="duas-subtitle">Learn beautiful prayers for every moment! ({DUAS.length} Du'as)</p>
        <div className="duas-progress-bar">
          <div className="duas-progress-fill" style={{ width: `${(learnedCount / DUAS.length) * 100}%` }}></div>
          <span className="duas-progress-text">⭐ {learnedCount}/{DUAS.length} Learned ({Math.round((learnedCount / DUAS.length) * 100)}%)</span>
        </div>
        <div className="duas-audio-badge">🔊 High-Quality Audio — Arabic • English • Urdu</div>
      </div>

      {/* Categories */}
      <div className="duas-categories">
        {CATEGORIES.map(c => (
          <button key={c.key} className={`duas-cat-btn ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}>{c.label}</button>
        ))}
      </div>

      {/* Du'a Cards */}
      <div className="duas-grid">
        {filtered.map((dua, i) => (
          <div key={dua.id} className={`dua-card ${learned.includes(dua.id) ? 'dua-learned' : ''}`}
            style={{ '--dua-color': dua.color, animationDelay: `${i * 0.06}s` }}>
            
            {/* Card Header */}
            <div className="dua-card-head" onClick={() => setExpanded(p => ({ ...p, [dua.id]: !p[dua.id] }))}>
              <div className="dua-card-icon-wrap" style={{ background: `${dua.color}22` }}>
                <span className="dua-card-emoji">{dua.emoji}</span>
              </div>
              <h3 className="dua-card-title">{dua.title}</h3>
              {learned.includes(dua.id) && <span className="dua-learned-badge">✅</span>}
              <span className={`dua-expand-arrow ${expanded[dua.id] ? 'open' : ''}`}>▼</span>
            </div>

            {/* Arabic Text + Audio */}
            <div className="dua-arabic-section">
              <p className="dua-arabic">{dua.arabic}</p>
              <button className={`dua-audio-btn dua-audio-ar ${playingAudio === `ar_${dua.id}` || playingAudio === `seq_ar_${dua.id}` ? 'playing' : ''}`}
                onClick={() => playArabic(dua)}>
                🔊 عربی
              </button>
            </div>

            {/* Transliteration */}
            <p className="dua-transliteration">{dua.transliteration}</p>

            {/* English Translation */}
            <div className="dua-translation-section">
              <div className="dua-translation-label">🇬🇧 ENGLISH</div>
              <p className="dua-translation-text">{dua.english}</p>
              <button className={`dua-audio-btn dua-audio-en ${playingAudio === `en_${dua.id}` || playingAudio === `seq_en_${dua.id}` ? 'playing' : ''}`}
                onClick={() => playEnglish(dua)}>
                🔊 Listen
              </button>
            </div>

            {/* Urdu Translation */}
            <div className="dua-translation-section dua-urdu-section">
              <div className="dua-translation-label">🇵🇰 اردو</div>
              <p className="dua-translation-text dua-urdu-text">{dua.urdu}</p>
              <button className={`dua-audio-btn dua-audio-ur ${playingAudio === `ur_${dua.id}` || playingAudio === `seq_ur_${dua.id}` ? 'playing' : ''}`}
                onClick={() => playUrdu(dua)}>
                🔊 سنیں
              </button>
            </div>

            {/* Play Full Sequence Button */}
            <button className={`dua-sequence-btn ${playingAudio ? 'disabled' : ''}`}
              onClick={() => playSequence(dua)} disabled={!!playingAudio}>
              🔁 Play All (عربی → English → اردو)
            </button>

            {/* Expanded Details */}
            {expanded[dua.id] && (
              <div className="dua-expanded animate-fade-in">
                <div className="dua-tips">
                  <p><strong>📖 When to say:</strong> {dua.title}</p>
                  <p><strong>💡 Tip:</strong> Try saying this du'a every day until you memorize it!</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="dua-card-actions">
              <button className={`dua-learn-btn ${learned.includes(dua.id) ? 'learned' : ''}`}
                onClick={() => toggleLearned(dua.id)}>
                {learned.includes(dua.id) ? '✅ Learned!' : '⭐ I Learned It!'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {playingAudio && (
        <div className="dua-stop-floating" onClick={stopAudio}>⏹ Stop Audio</div>
      )}

      <style>{`
        .duas-header { text-align: center; padding: 40px 20px; margin-bottom: 24px; background: linear-gradient(135deg, rgba(255,179,71,0.15), rgba(139,92,246,0.15), rgba(13,107,75,0.15)); border-radius: var(--radius-xl); border: 1px solid var(--border); }
        .duas-header-emoji { font-size: 3.5rem; display: block; margin-bottom: 8px; }
        .duas-title { font-family: var(--font-kids, var(--font-heading)); font-size: clamp(2rem,5vw,3rem); font-weight: 800; background: linear-gradient(135deg, #FFB347, #FF6B6B, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .duas-subtitle { color: var(--text-muted); margin-top: 8px; font-size: 1.1rem; }
        .duas-progress-bar { position: relative; height: 32px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-full); overflow: hidden; margin-top: 20px; max-width: 400px; margin-left: auto; margin-right: auto; }
        .duas-progress-fill { height: 100%; background: linear-gradient(90deg, #FFB347, #22C55E); border-radius: var(--radius-full); transition: width 0.5s ease; }
        .duas-progress-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; }
        .duas-audio-badge { display: inline-block; margin-top: 16px; padding: 6px 18px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: var(--radius-full); font-size: 0.8rem; color: #22C55E; font-weight: 600; }

        .duas-categories { display: flex; gap: 8px; justify-content: center; margin-bottom: 24px; flex-wrap: wrap; }
        .duas-cat-btn { padding: 8px 18px; border-radius: var(--radius-full); font-weight: 600; font-size: 0.9rem; background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); cursor: pointer; transition: var(--transition); }
        .duas-cat-btn:hover { border-color: var(--primary); }
        .duas-cat-btn.active { background: var(--accent); border-color: var(--accent); color: #1a1a2e; }
        .duas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }

        .dua-card { background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-xl); padding: 24px; position: relative; border-top: 4px solid var(--dua-color); animation: slideUp 0.5s ease both; transition: var(--transition); }
        .dua-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
        .dua-card.dua-learned { border-color: #22C55E33; background: linear-gradient(135deg, var(--surface), rgba(34,197,94,0.03)); }

        .dua-card-head { display: flex; align-items: center; gap: 12px; cursor: pointer; margin-bottom: 16px; }
        .dua-card-icon-wrap { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dua-card-emoji { font-size: 1.5rem; }
        .dua-card-title { font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; flex: 1; }
        .dua-learned-badge { font-size: 1.2rem; }  
        .dua-expand-arrow { font-size: 0.7rem; color: var(--text-dim); transition: transform 0.3s ease; }
        .dua-expand-arrow.open { transform: rotate(180deg); }

        .dua-arabic-section { text-align: center; margin-bottom: 12px; }
        .dua-arabic { font-family: var(--font-arabic); font-size: 1.5rem; color: var(--accent); direction: rtl; line-height: 2; margin-bottom: 8px; }
        .dua-transliteration { font-style: italic; color: var(--text-muted); font-size: 0.9rem; text-align: center; margin-bottom: 16px; }

        .dua-translation-section { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 10px; }
        .dua-translation-label { font-weight: 700; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .dua-translation-text { color: var(--text); font-size: 0.95rem; line-height: 1.6; margin-bottom: 8px; }
        .dua-urdu-text { font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif; direction: rtl; text-align: right; font-size: 1.1rem; line-height: 2; }
        .dua-urdu-section { border-color: rgba(34,197,94,0.2); }

        .dua-audio-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-full); color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .dua-audio-btn:hover { border-color: var(--primary); color: var(--primary); transform: scale(1.03); }
        .dua-audio-btn.playing { background: var(--primary); border-color: var(--primary); color: white; animation: pulse 1s infinite; }
        .dua-audio-ar:hover { border-color: #D4A843; color: #D4A843; }
        .dua-audio-en:hover { border-color: #3B82F6; color: #3B82F6; }
        .dua-audio-ur:hover { border-color: #22C55E; color: #22C55E; }

        .dua-sequence-btn { width: 100%; padding: 12px; margin-top: 10px; margin-bottom: 4px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.9rem; cursor: pointer; border: 2px dashed var(--border); background: linear-gradient(135deg, rgba(212,168,67,0.05), rgba(59,130,246,0.05), rgba(34,197,94,0.05)); color: var(--text-muted); transition: var(--transition); }
        .dua-sequence-btn:hover:not(.disabled) { border-color: var(--accent); color: var(--accent); background: linear-gradient(135deg, rgba(212,168,67,0.1), rgba(59,130,246,0.1), rgba(34,197,94,0.1)); transform: scale(1.01); }
        .dua-sequence-btn.disabled { opacity: 0.4; cursor: default; }

        .dua-expanded { padding-top: 12px; border-top: 1px dashed var(--border); margin-top: 8px; }
        .dua-tips { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
        .dua-tips p { margin-bottom: 4px; }

        .dua-card-actions { margin-top: 16px; display: flex; gap: 8px; }
        .dua-learn-btn { flex: 1; padding: 10px; border-radius: var(--radius-full); font-weight: 700; font-size: 0.9rem; cursor: pointer; border: 1px solid var(--border); transition: var(--transition); background: var(--surface); color: var(--text); }
        .dua-learn-btn:hover { background: #22C55E; border-color: #22C55E; color: white; }
        .dua-learn-btn.learned { background: #22C55E22; border-color: #22C55E55; color: #22C55E; }

        .dua-stop-floating { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #EF4444; color: white; padding: 12px 28px; border-radius: var(--radius-full); font-weight: 700; cursor: pointer; z-index: 1000; box-shadow: 0 4px 20px rgba(239,68,68,0.3); animation: slideUp 0.3s ease; }
        @media (max-width: 768px) { .duas-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
