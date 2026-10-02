import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const signIn = async (loginEmail, loginPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      // Send each role to its own home
      const role = data.user?.role;
      navigate(role === 'child' ? '/kids' : role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(t(err.response?.data?.message || 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  // Demo accounts for testing — remove before going live
  const demoAccounts = [
    { icon: '🛡️', label: 'Admin', email: 'admin@islamicplatform.com', password: 'admin123' },
    { icon: '🎓', label: 'Teacher', email: 'teacher@islamicplatform.com', password: 'teacher123' },
    { icon: '👨‍👩‍👧', label: 'Parent', email: 'parent@islamicplatform.com', password: 'parent123' },
    { icon: '🧒', label: 'Kid', email: 'kid@islamicplatform.com', password: 'kid123' },
  ];

  return (
    <div className="auth-page page">
      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <span style={{ fontSize: '3rem' }}>🕌</span>
          <h1 className="heading-lg">{t('Welcome Back')}</h1>
          <p className="text-muted">{t('Sign in to continue your Islamic learning journey')}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('Email Address')}</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('Password')}</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('Enter password')} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? t('Signing in...') : '🔑 ' + t('Sign In')}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t("Don't have an account?")} <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{t('Sign Up')}</Link></p>
        </div>

        <div className="demo-logins">
          <p className="demo-title">{t('Test logins — click to sign in')}</p>
          <div className="demo-grid">
            {demoAccounts.map(a => (
              <button key={a.email} type="button" className="demo-btn" disabled={loading}
                onClick={() => { setEmail(a.email); setPassword(a.password); signIn(a.email, a.password); }}>
                <strong>{a.icon} {t(a.label)}</strong>
                <span>{a.email}</span>
                <span>{a.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .auth-page { display: flex; align-items: center; justify-content: center; }
        .auth-container {
          max-width: 440px;
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 40px;
        }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-header h1 { margin: 12px 0 8px; }
        .auth-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: var(--error);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          font-size: 0.9rem;
        }
        .auth-footer { text-align: center; margin-top: 24px; color: var(--text-muted); font-size: 0.9rem; }
        .demo-logins { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
        .demo-title { text-align: center; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 10px; }
        .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .demo-btn {
          display: flex; flex-direction: column; gap: 2px; text-align: start; padding: 10px 12px;
          background: var(--surface-light); border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text); cursor: pointer; transition: var(--transition); min-width: 0;
        }
        .demo-btn:hover:not(:disabled) { border-color: var(--primary-light); }
        .demo-btn span { font-size: 0.72rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 400px) { .auth-container { padding: 28px 18px; } }
      `}</style>
    </div>
  );
}
