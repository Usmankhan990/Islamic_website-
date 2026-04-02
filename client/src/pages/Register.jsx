import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'parent', phone: '', city: '', country: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page page">
      <div className="auth-container animate-slide-up" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <span style={{ fontSize: '3rem' }}>🌟</span>
          <h1 className="heading-lg">Join NoorAcademy</h1>
          <p className="text-muted">Create your free account to start learning</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="Your full name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" name="confirmPassword" className="form-input" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange}>
              <option value="parent">Parent / Adult Learner</option>
              <option value="child">Child / Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">City (optional)</label>
              <input type="text" name="city" className="form-input" value={form.city} onChange={handleChange} placeholder="Your city" />
            </div>
            <div className="form-group">
              <label className="form-label">Country (optional)</label>
              <input type="text" name="country" className="form-input" value={form.country} onChange={handleChange} placeholder="Your country" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : '🚀 Create Free Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign In</Link></p>
        </div>
      </div>

      <style>{`
        .auth-page { display: flex; align-items: center; justify-content: center; }
        .auth-container { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 40px; }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-header h1 { margin: 12px 0 8px; }
        .auth-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--error); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 0.9rem; }
        .auth-footer { text-align: center; margin-top: 24px; color: var(--text-muted); font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
