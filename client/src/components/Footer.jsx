import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🕌 Noor<span style={{ color: 'var(--accent)' }}>Academy</span></h3>
            <p>{t('A comprehensive Islamic learning platform for all ages. Learn Quran, Hadith, and Islamic knowledge in a beautiful and engaging way.')}</p>
          </div>
          <div className="footer-links">
            <h4>{t('Learn')}</h4>
            <Link to="/quran">📖 {t('Quran')}</Link>
            <Link to="/hadith">📚 {t('Hadith')}</Link>
            <Link to="/fiqh">⚖️ {t('Fiqh')}</Link>
            <Link to="/prayer">🕐 {t('Prayer Times')}</Link>
          </div>
          <div className="footer-links">
            <h4>{t('Engage')}</h4>
            <Link to="/kids/games">🎮 {t('Kids Games')}</Link>
            <Link to="/kids/leaderboard">🏆 {t('Leaderboard')}</Link>
            <Link to="/classes">🎓 {t('Live Classes')}</Link>
            <Link to="/kids/competitions">🏅 {t('Competitions')}</Link>
          </div>
          <div className="footer-links">
            <h4>{t('Platform')}</h4>
            <Link to="/register">📝 {t('Sign Up')}</Link>
            <Link to="/reviews">⭐ {t('Reviews')}</Link>
            <Link to="/login">🔑 {t('Login')}</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p>© {new Date().getFullYear()} NoorAcademy. {t('Built with ❤️ for the Ummah.')}</p>
        </div>
      </div>
      <style>{`
        .site-footer {
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 48px 0 24px;
          margin-top: 64px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .footer-brand p { color: var(--text-muted); margin-top: 12px; font-size: 0.9rem; line-height: 1.6; }
        .footer-links { display: flex; flex-direction: column; gap: 8px; }
        .footer-links h4 { color: var(--accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .footer-links a { color: var(--text-muted); font-size: 0.9rem; transition: var(--transition); }
        .footer-links a:hover { color: var(--primary-light); }
        .footer-bottom {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .footer-bottom p:first-child { font-family: var(--font-arabic); font-size: 1.2rem; color: var(--accent); margin-bottom: 8px; }
        .footer-bottom p:last-child { color: var(--text-dim); font-size: 0.85rem; }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
        }
      `}</style>
    </footer>
  );
}
