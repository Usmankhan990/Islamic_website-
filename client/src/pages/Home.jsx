import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPrayerTimes, getUserLocation, getNextPrayer } from '../services/prayerApi';

export default function Home() {
  const [verse, setVerse] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    // Fetch random verse
    const surahNum = Math.floor(Math.random() * 114) + 1;
    fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/en.asad`)
      .then(r => r.json())
      .then(data => {
        const ayahs = data.data.ayahs;
        const randomAyah = ayahs[Math.floor(Math.random() * ayahs.length)];
        setVerse({ text: randomAyah.text, surah: data.data.englishName, number: randomAyah.numberInSurah });
      }).catch(() => {});

    // Fetch prayer times
    getUserLocation().then(({ lat, lng }) => {
      return getPrayerTimes(lat, lng);
    }).then(data => {
      const np = getNextPrayer(data.timings);
      setNextPrayer(np);
    }).catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!nextPrayer) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextPrayer.date - now;
      if (diff <= 0) { setCountdown('Now!'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const features = [
    { icon: '📖', title: 'Quran', desc: 'Read the Holy Quran in 10+ languages with beautiful Arabic typography', link: '/quran', color: '#0D6B4B' },
    { icon: '📚', title: 'Hadith', desc: 'Explore Sahih Bukhari, Muslim, and 4 more trusted collections', link: '/hadith', color: '#D4A843' },
    { icon: '⚖️', title: 'Fiqh Library', desc: 'Study Islamic jurisprudence from the four major schools of thought', link: '/fiqh', color: '#3B82F6' },
    { icon: '🕐', title: 'Prayer Times', desc: 'Accurate prayer times and Qibla direction based on your location', link: '/prayer', color: '#A855F7' },
    { icon: '🎮', title: 'Kids Zone', desc: 'Fun games, quizzes, and competitions to help children learn Islam', link: '/kids/games', color: '#FF6B6B' },
    { icon: '🎓', title: 'Live Classes', desc: 'Free Quran teaching sessions via Google Meet, Zoom, or Teams', link: '/classes', color: '#22C55E' },
    { icon: '🏆', title: 'Competitions', desc: 'Join Quran recitation and Islamic quiz competitions — win prizes!', link: '/kids/competitions', color: '#F59E0B' },
    { icon: '🤖', title: 'AI Prayer Guide', desc: 'Use your camera to get real-time feedback on your prayer posture positions', link: '/prayer/posture', color: '#EC4899' },
  ];

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-pattern"></div>
        <div className="container hero-content">
          <div className="hero-text animate-slide-up">
            <div className="hero-badge">🌙 Islamic Learning Platform</div>
            <h1 className="heading-xl">
              Learn Islam with<br/>
              <span className="hero-gradient">Joy & Wisdom</span>
            </h1>
            <p className="hero-desc">
              A comprehensive platform for Quran, Hadith, prayer times, live classes, 
              and engaging games for children — all in one beautiful place.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-accent btn-lg">🚀 Get Started Free</Link>
              <Link to="/quran" className="btn btn-outline btn-lg">📖 Read Quran</Link>
            </div>
          </div>

          <div className="hero-widgets animate-slide-up stagger-2">
            {/* Prayer Countdown */}
            {nextPrayer && (
              <div className="hero-prayer-card">
                <div className="prayer-card-label">Next Prayer</div>
                <div className="prayer-card-name">{nextPrayer.name}</div>
                <div className="prayer-card-time">{nextPrayer.time}</div>
                <div className="prayer-card-countdown animate-pulse">{countdown}</div>
              </div>
            )}
            
            {/* Daily Verse */}
            {verse && (
              <div className="hero-verse-card">
                <div className="verse-card-label">📖 Daily Verse</div>
                <p className="verse-text">"{verse.text}"</p>
                <p className="verse-ref">— {verse.surah}, Verse {verse.number}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        <h2 className="heading-lg text-center" style={{ marginBottom: 16 }}>Everything You Need</h2>
        <p className="text-center text-muted" style={{ marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
          Explore the complete Islamic learning experience — for individuals, families, and children.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <Link to={f.link} key={i} className="feature-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, '--feature-color': f.color }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Du'a of the Day */}
      <section className="duas-showcase container">
        <h2 className="heading-lg text-center" style={{ marginBottom: 8 }}>🤲 Daily Du'as for Kids</h2>
        <p className="text-center text-muted" style={{ marginBottom: 32 }}>Beautiful prayers for every moment of the day</p>
        <div className="duas-live-grid">
          {[
            { emoji: '🌅', title: 'Waking Up', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا', color: '#FFB347' },
            { emoji: '🌙', title: 'Before Sleep', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', color: '#7B68EE' },
            { emoji: '🍽️', title: 'Before Eating', arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ', color: '#FF6B6B' },
            { emoji: '📚', title: 'Before Studying', arabic: 'رَبِّ زِدْنِي عِلْماً', color: '#8B5CF6' },
            { emoji: '🕌', title: 'Entering Masjid', arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', color: '#0D6B4B' },
            { emoji: '👨‍👩‍👧‍👦', title: 'For Parents', arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', color: '#EC4899' },
          ].map((d, i) => (
            <div key={i} className="dua-live-card" style={{ '--dc': d.color, animationDelay: `${i * 0.1}s` }}>
              <span className="dua-live-emoji">{d.emoji}</span>
              <h4 className="dua-live-title">{d.title}</h4>
              <p className="dua-live-arabic">{d.arabic}</p>
            </div>
          ))}
        </div>
        <div className="text-center" style={{ marginTop: 24 }}>
          <Link to="/kids/duas" className="btn btn-accent btn-lg">🤲 See All Du'as & Learn</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="cta container">
        <div className="cta-card">
          <h2 className="heading-lg">Ready to Start Your Islamic Journey?</h2>
          <p className="text-muted" style={{ marginTop: 12, marginBottom: 24, maxWidth: 500 }}>
            Join thousands of learners worldwide. Sign up for free and access Quran, Hadith, games, and live classes.
          </p>
          <div className="flex gap-md" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">📝 Create Free Account</Link>
            <Link to="/reviews" className="btn btn-outline btn-lg">⭐ Read Reviews</Link>
          </div>
        </div>
      </section>

      <style>{`
        .home-page { padding-top: 0; }
        .hero {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          padding-top: var(--navbar-height);
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg) 0%, #0D2818 50%, var(--bg) 100%);
        }
        .hero-bg-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(13,107,75,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212,168,67,0.1) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, rgba(59,130,246,0.08) 0%, transparent 40%);
          pointer-events: none;
        }
        .hero-content {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 48px;
          align-items: center;
          padding: 64px 24px;
        }
        .hero-badge {
          display: inline-block;
          background: rgba(13,107,75,0.15);
          color: var(--primary-light);
          padding: 8px 20px;
          border-radius: var(--radius-full);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid rgba(13,107,75,0.3);
        }
        .hero-gradient {
          background: linear-gradient(135deg, var(--primary-light), var(--accent), var(--primary-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% auto;
          animation: gradient-shift 3s ease infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .hero-desc { color: var(--text-muted); font-size: 1.15rem; line-height: 1.7; margin: 24px 0 32px; max-width: 520px; }
        .hero-buttons { display: flex; gap: 16px; flex-wrap: wrap; }
        .hero-widgets { display: flex; flex-direction: column; gap: 20px; }
        .hero-prayer-card {
          background: rgba(13,107,75,0.1);
          border: 1px solid rgba(13,107,75,0.3);
          border-radius: var(--radius-xl);
          padding: 28px;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        .prayer-card-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .prayer-card-name { font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--primary-light); margin: 8px 0; }
        .prayer-card-time { font-size: 1.3rem; color: var(--accent); font-weight: 600; }
        .prayer-card-countdown { font-size: 1.5rem; font-weight: 700; color: var(--text); margin-top: 12px; font-family: var(--font-heading); }
        .hero-verse-card {
          background: rgba(212,168,67,0.08);
          border: 1px solid rgba(212,168,67,0.2);
          border-radius: var(--radius-xl);
          padding: 24px;
          backdrop-filter: blur(10px);
        }
        .verse-card-label { font-size: 0.8rem; color: var(--accent); margin-bottom: 12px; }
        .verse-text { font-size: 1rem; color: var(--text); line-height: 1.7; font-style: italic; }
        .verse-ref { color: var(--text-muted); font-size: 0.85rem; margin-top: 12px; }

        .features { padding: 80px 24px; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: slideUp 0.5s ease forwards;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--feature-color);
          opacity: 0;
          transition: var(--transition);
        }
        .feature-card:hover {
          border-color: var(--feature-color);
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { font-size: 2.5rem; margin-bottom: 16px; }
        .feature-title { font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; margin-bottom: 8px; }
        .feature-desc { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }
        .feature-arrow {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 1.2rem;
          color: var(--text-dim);
          transition: var(--transition);
        }
        .feature-card:hover .feature-arrow { color: var(--feature-color); transform: translateX(4px); }

        .duas-showcase { padding: 60px 24px; }
        .duas-live-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .dua-live-card {
          background: var(--surface); border: 2px solid var(--border); border-top: 3px solid var(--dc);
          border-radius: 16px; padding: 24px; text-align: center;
          transition: var(--transition); animation: slideUp 0.5s ease both;
        }
        .dua-live-card:hover { transform: translateY(-6px); border-color: var(--dc); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
        .dua-live-emoji { font-size: 2.5rem; display: block; margin-bottom: 8px; }
        .dua-live-title { font-family: var(--font-heading); font-weight: 700; color: var(--dc); margin-bottom: 8px; }
        .dua-live-arabic { font-family: var(--font-arabic); font-size: 1.2rem; color: var(--text); direction: rtl; line-height: 1.8; }

        .cta { padding: 40px 24px 80px; }
        .cta-card {
          background: linear-gradient(135deg, rgba(13,107,75,0.15), rgba(212,168,67,0.1));
          border: 1px solid rgba(13,107,75,0.2);
          border-radius: var(--radius-xl);
          padding: 64px;
          text-align: center;
        }

        @media (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .hero-content { grid-template-columns: 1fr; text-align: center; padding: 48px 16px; }
          .hero-desc { margin: 24px auto 32px; }
          .hero-buttons { justify-content: center; }
          .features-grid { grid-template-columns: 1fr; }
          .duas-live-grid { grid-template-columns: 1fr; }
          .cta-card { padding: 40px 24px; }
        }
      `}</style>
    </div>
  );
}
