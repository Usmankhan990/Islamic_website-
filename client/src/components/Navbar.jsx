import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, lang, setLang, languages } = useLanguage();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🕌</span>
          <span className="brand-text">Noor<span className="brand-accent">Academy</span></span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/quran" className={`nav-link ${isActive('/quran')}`} onClick={() => setMobileOpen(false)}>📖 {t('Quran')}</Link>
          <Link to="/hadith" className={`nav-link ${isActive('/hadith')}`} onClick={() => setMobileOpen(false)}>📚 {t('Hadith')}</Link>
          <Link to="/fiqh" className={`nav-link ${isActive('/fiqh')}`} onClick={() => setMobileOpen(false)}>⚖️ {t('Fiqh')}</Link>
          <Link to="/prayer" className={`nav-link ${isActive('/prayer')}`} onClick={() => setMobileOpen(false)}>🕐 {t('Prayer')}</Link>
          <Link to="/weekly" className={`nav-link ${isActive('/weekly')}`} onClick={() => setMobileOpen(false)}>📚 {t('Weekly')}</Link>
          <Link to="/classes" className={`nav-link ${isActive('/classes')}`} onClick={() => setMobileOpen(false)}>🎓 {t('Classes')}</Link>
          <Link to="/kids/games" className={`nav-link ${isActive('/kids/games')}`} onClick={() => setMobileOpen(false)}>🎮 {t('Kids')}</Link>

          {user ? (
            <div className="nav-user">
              {isAdmin && <Link to="/admin" className="btn btn-sm btn-accent" onClick={() => setMobileOpen(false)}>⚙️ {t('Admin')}</Link>}
              <Link to="/kids" className="btn btn-sm btn-outline" onClick={() => setMobileOpen(false)}>👤 {user.name}</Link>
              <button className="btn btn-sm btn-danger" onClick={() => { logout(); setMobileOpen(false); }}>{t('Logout')}</button>
            </div>
          ) : (
            <div className="nav-user">
              <Link to="/login" className="btn btn-sm btn-outline" onClick={() => setMobileOpen(false)}>{t('Login')}</Link>
              <Link to="/register" className="btn btn-sm btn-primary" onClick={() => setMobileOpen(false)}>{t('Sign Up')}</Link>
            </div>
          )}
        </div>

        <select className="lang-select" value={lang} onChange={e => setLang(e.target.value)} aria-label={t('Language')} title={t('Language')}>
          {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>

        <button className="navbar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--navbar-height);
          background: rgba(10, 22, 40, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
          display: flex;
          align-items: center;
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
        }
        .brand-icon { font-size: 1.8rem; }
        .brand-accent { color: var(--accent); }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nav-link {
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          transition: var(--transition);
          white-space: nowrap;
        }
        .nav-link:hover, .nav-link.active {
          color: var(--text);
          background: var(--surface-light);
        }
        .nav-link.active { color: var(--primary-light); }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-inline-start: 12px;
          padding-inline-start: 12px;
          border-inline-start: 1px solid var(--border);
        }
        .lang-select {
          margin-inline-start: 8px; padding: 6px 8px; border-radius: var(--radius-md);
          background: var(--surface); color: var(--text); border: 1px solid var(--border);
          font-size: 0.85rem; cursor: pointer; max-width: 120px;
        }
        .navbar-toggle {
          display: none;
          background: var(--surface);
          color: var(--text);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 1.2rem;
        }
        @media (max-width: 1024px) {
          .navbar-toggle { display: block; }
          .lang-select { margin-inline-start: auto; margin-inline-end: 8px; }
          .navbar-links {
            display: none;
            position: absolute;
            top: var(--navbar-height);
            left: 0;
            right: 0;
            background: var(--bg-light);
            border-bottom: 1px solid var(--border);
            flex-direction: column;
            padding: 16px;
            gap: 8px;
          }
          .navbar-links.open { display: flex; }
          .nav-link { width: 100%; }
          .nav-user {
            margin-inline-start: 0;
            padding-inline-start: 0;
            border-inline-start: none;
            padding-top: 12px;
            border-top: 1px solid var(--border);
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </nav>
  );
}
