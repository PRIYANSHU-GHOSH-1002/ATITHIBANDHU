import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', nationality: '', idNumber: '',
    emergencyContact: { name: '', phone: '' },
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateEmergency(field, value) {
    setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, [field]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await register(form);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <h1>Your identity,<br /><span className="accent">chained &amp; verified.</span></h1>
          <p className="lede">
            Registration creates a tamper-evident digital ID — a hash-linked
            record that can be verified at any checkpoint, any time.
          </p>
        </div>
        <div className="auth-hero-signals">
          <div className="auth-signal-row"><span className="dot dot-gold" />SHA-256 identity ledger</div>
          <div className="auth-signal-row"><span className="dot dot-green" />Encrypted credential storage</div>
          <div className="auth-signal-row"><span className="dot dot-purple" />Emergency contact on file</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <span className="eyebrow">Create account</span>
          <h2>Your Digital Tourist ID</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label className="field-label">Full name</label>
              <input placeholder="Priyanshu Ghosh" onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input placeholder="you@example.com" type="email" onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input placeholder="••••••••" type="password" onChange={(e) => update('password', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input placeholder="9876543210" onChange={(e) => update('phone', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Nationality</label>
              <input placeholder="Indian" onChange={(e) => update('nationality', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Passport / National ID number</label>
              <input placeholder="Z1234567" onChange={(e) => update('idNumber', e.target.value)} required />
            </div>

            <hr className="divider" />
            <p className="fieldset-label">Emergency contact</p>
            <div>
              <label className="field-label">Contact name</label>
              <input placeholder="Optional" onChange={(e) => updateEmergency('name', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Contact phone</label>
              <input placeholder="Optional" onChange={(e) => updateEmergency('phone', e.target.value)} />
            </div>

            {error && <p className="error">{error}</p>}
            <button type="submit">Register</button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}
