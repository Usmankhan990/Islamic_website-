import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <span style={{ fontSize: '3rem' }}>🕌</span>
          <h1 className="heading-lg">Welcome Back</h1>
          <p className="text-muted">Sign in to continue your Islamic learning journey</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : '🔑 Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign Up</Link></p>
          <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Demo Admin: admin@islamicplatform.com / admin123
          </p>
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
      `}</style>
    </div>
  );
}
