import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-body">
          <div className="brand-mark">
            <span className="beacon-dot" />
            <span className="brand-wordmark"><span className="accent">Atithi</span>Bandhu</span>
          </div>
          <h1>Every traveler,<br /><span className="accent">a tracked signal.</span></h1>
          <p className="lede">
            Live location, geofenced zones, and one-tap emergency response —
            watching over tourists the way a coastal beacon watches over ships.
          </p>
        </div>
        <div className="auth-hero-signals">
          <div className="auth-signal-row"><span className="dot dot-green" />Safe zone monitoring active</div>
          <div className="auth-signal-row"><span className="dot dot-gold" />Digital ID chain verified</div>
          <div className="auth-signal-row"><span className="dot dot-purple" />24/7 response network</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <span className="eyebrow">Sign in</span>
          <h2>Welcome back</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label className="field-label">Email</label>
              <input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Login</button>
          </form>
          <p className="auth-footer">No account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
