export default function Fiqh() {
  const madhabs = [
    { name: 'Hanafi', imam: 'Imam Abu Hanifa', color: '#0D6B4B', icon: '🕌', desc: 'Founded by Imam Abu Hanifa (699–767 CE). The largest school, followed in Turkey, Central/South Asia, and parts of the Middle East.', books: ['Al-Mabsut by Imam Sarakhsi', 'Hidaya by Burhanuddin al-Marghinani', 'Mukhtasar al-Quduri'] },
    { name: 'Maliki', imam: 'Imam Malik ibn Anas', color: '#D4A843', icon: '📜', desc: 'Founded by Imam Malik (711–795 CE). Predominant in North Africa, West Africa, and parts of the Gulf.', books: ['Al-Muwatta by Imam Malik', 'Al-Mudawwana al-Kubra', 'Risala by Ibn Abi Zayd al-Qayrawani'] },
    { name: "Shafi'i", imam: 'Imam Muhammad ibn Idris al-Shafi\'i', color: '#3B82F6', icon: '📖', desc: 'Founded by Imam al-Shafi\'i (767–820 CE). Followed in East Africa, Southeast Asia, Yemen, and parts of Egypt.', books: ['Al-Umm by Imam al-Shafi\'i', 'Al-Risala by Imam al-Shafi\'i', 'Minhaj al-Talibin by Imam Nawawi'] },
    { name: 'Hanbali', imam: 'Imam Ahmad ibn Hanbal', color: '#A855F7', icon: '📚', desc: 'Founded by Imam Ahmad ibn Hanbal (780–855 CE). Predominant in Saudi Arabia and Qatar.', books: ['Al-Musnad by Imam Ahmad', 'Zad al-Ma\'ad by Ibn al-Qayyim', 'Al-Mughni by Ibn Qudamah'] },
  ];

  const topics = [
    { name: 'Salah (Prayer)', icon: '🕌', desc: 'Rules of prayer, conditions, pillars, and recommended acts' },
    { name: 'Taharah (Purification)', icon: '💧', desc: 'Wudu, ghusl, tayammum, and ritual cleanliness' },
    { name: 'Sawm (Fasting)', icon: '🌙', desc: 'Rules of Ramadan, voluntary fasts, and exemptions' },
    { name: 'Zakat (Charity)', icon: '💰', desc: 'Obligatory charity, calculations, and distribution' },
    { name: 'Hajj (Pilgrimage)', icon: '🕋', desc: 'Rites of Hajj and Umrah' },
    { name: 'Nikah (Marriage)', icon: '💍', desc: 'Islamic marriage laws, mahr, and family rights' },
    { name: 'Mu\'amalat (Transactions)', icon: '🤝', desc: 'Business ethics, contracts, and Islamic finance' },
    { name: 'Jana\'iz (Funerals)', icon: '🕊️', desc: 'Islamic burial rites and prayers for the deceased' },
  ];

  const resources = [
    { name: 'Islamic Archive', url: 'https://archive.org/details/islamicbooks', desc: 'Thousands of free Islamic texts' },
    { name: 'Sunnah.com', url: 'https://sunnah.com', desc: 'Complete Hadith collections' },
    { name: 'Quran.com', url: 'https://quran.com', desc: 'Quran with translations and tafsir' },
    { name: 'Islamqa.info', url: 'https://islamqa.info', desc: 'Detailed fiqh rulings and fatwas' },
    { name: 'Kalamullah.com', url: 'https://kalamullah.com', desc: 'Islamic books and resources' },
    { name: 'Al-Islam.org', url: 'https://www.al-islam.org', desc: 'Islamic texts and scholars\' works' },
  ];

  return (
    <div className="page container">
      <div className="text-center" style={{ marginBottom: 48 }}>
        <h1 className="heading-xl">⚖️ Fiqh Library</h1>
        <p className="text-muted" style={{ maxWidth: 600, margin: '12px auto' }}>
          Explore Islamic jurisprudence from the four major schools of thought and access authoritative resources.
        </p>
      </div>

      {/* Madhabs */}
      <h2 className="heading-md" style={{ marginBottom: 20 }}>The Four Schools of Thought</h2>
      <div className="fiqh-madhabs-grid" style={{ marginBottom: 48 }}>
        {madhabs.map((m, i) => (
          <div key={i} className="fiqh-madhab-card" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="flex items-center gap-md" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '2.5rem' }}>{m.icon}</span>
              <div>
                <h3 className="heading-sm" style={{ color: m.color }}>{m.name} School</h3>
                <p className="text-sm text-muted">{m.imam}</p>
              </div>
            </div>
            <p className="text-muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>{m.desc}</p>
            <h4 className="text-sm" style={{ marginBottom: 8, color: 'var(--accent)' }}>📚 Key Books:</h4>
            <ul style={{ paddingLeft: 20 }}>
              {m.books.map((b, j) => <li key={j} className="text-sm text-muted" style={{ marginBottom: 4, listStyle: 'disc' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Topics */}
      <h2 className="heading-md" style={{ marginBottom: 20 }}>Fiqh Topics</h2>
      <div className="fiqh-topics-grid" style={{ marginBottom: 48 }}>
        {topics.map((t, i) => (
          <div key={i} className="fiqh-topic-card">
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>{t.icon}</span>
            <h4 className="heading-sm" style={{ marginBottom: 4 }}>{t.name}</h4>
            <p className="text-xs text-muted">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Resources */}
      <h2 className="heading-md" style={{ marginBottom: 20 }}>📌 Trusted Online Resources</h2>
      <div className="fiqh-resources-grid">
        {resources.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="fiqh-resource-card">
            <div className="fiqh-resource-icon">🔗</div>
            <div>
              <h4 className="heading-sm" style={{ color: 'var(--primary-light)' }}>{r.name} ↗</h4>
              <p className="text-sm text-muted" style={{ marginTop: 4 }}>{r.desc}</p>
            </div>
          </a>
        ))}
      </div>

      <style>{`
        .fiqh-madhabs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .fiqh-madhab-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          transition: var(--transition);
        }
        .fiqh-madhab-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
        }
        .fiqh-topics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .fiqh-topic-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          text-align: center;
          transition: var(--transition);
        }
        .fiqh-topic-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-glow);
        }
        .fiqh-resources-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .fiqh-resource-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
        }
        .fiqh-resource-card:hover {
          border-color: var(--primary);
          background: var(--surface-light);
          transform: translateY(-3px);
          box-shadow: var(--shadow-glow);
        }
        .fiqh-resource-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(13,107,75,0.1);
          border-radius: var(--radius-md);
        }
        @media (max-width: 1024px) {
          .fiqh-topics-grid { grid-template-columns: repeat(2, 1fr); }
          .fiqh-resources-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .fiqh-madhabs-grid, .fiqh-topics-grid, .fiqh-resources-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
