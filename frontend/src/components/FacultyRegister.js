import { useState } from 'react';
import API from '../services/api';

function FacultyRegister({ onNavigate }) {
  const [form, setForm] = useState({ name: '', branch: 'CSE', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const branches = ['CSE','CSM','CSD','CSC','ECE','EEE','MECH','CIVIL','IT','ADMIN'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateEmailFormat = (email) => /^[a-z]+\.[a-z]+@anits\.edu\.in$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');

    if (!form.name.trim() || !form.branch || !form.email.trim() || !form.password.trim()) {
      setError('All fields are required'); return;
    }
    if (!validateEmailFormat(form.email.trim().toLowerCase())) {
      setError('Email must match name.branch@anits.edu.in'); return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) { setError('You must login as admin first'); setLoading(false); return; }
      const res = await API.post('/auth/register', {
        name: form.name.trim(),
        branch: form.branch,
        email: form.email.trim().toLowerCase(),
        password: form.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Faculty registered');
      setForm({ name: '', branch: 'CSE', email: '', password: '' });
    } catch (err) {
      const apiErr = err.response?.data;
      if (apiErr?.details) {
        setError(`${apiErr.error}: ${Array.isArray(apiErr.details) ? apiErr.details.join(', ') : apiErr.details}`);
      } else {
        setError(apiErr?.error || 'Registration failed');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', background: 'white', padding: '2.2rem', borderRadius: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.12)', animation: 'fadeIn 0.4s ease-out' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>👤 Register New Faculty</h2>
      <p style={{ fontSize: '.9rem', color: '#475569', marginBottom: '1.5rem' }}>Only <strong>admin / superadmin</strong> accounts can create faculty. Login as <code>admin.admin@anits.edu.in</code> first.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', fontWeight: 600 }}>Full Name</label>
          <input name='name' value={form.name} onChange={handleChange} placeholder='e.g., John Doe' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', fontWeight: 600 }}>Branch</label>
          <select name='branch' value={form.branch} onChange={handleChange} style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem' }}>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', fontWeight: 600 }}>Faculty Email</label>
          <input name='email' value={form.email} onChange={handleChange} placeholder='firstname.lastname@anits.edu.in' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem' }} />
          <div style={{ fontSize: '.65rem', color: '#64748b' }}>Format required: name.branch@anits.edu.in</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', fontWeight: 600 }}>Password</label>
          <input type='password' name='password' value={form.password} onChange={handleChange} placeholder='Min 6 characters' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem' }} />
        </div>
        <button type='submit' disabled={loading} style={{ padding: '14px 18px', background: loading? '#94a3b8':'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, cursor: loading? 'not-allowed':'pointer', boxShadow: '0 6px 20px rgba(102,126,234,0.35)' }}>{loading? 'Registering...' : '✅ Create Account'}</button>
      </form>

      {message && <div style={{ marginTop: '1rem', fontSize: '.75rem', color: '#065f46', background: '#d1fae5', padding: '.6rem .9rem', borderRadius: '8px', border: '1px solid #10b981' }}>{message}</div>}
      {error && <div style={{ marginTop: '1rem', fontSize: '.75rem', color: '#991b1b', background: '#fee2e2', padding: '.6rem .9rem', borderRadius: '8px', border: '1px solid #fecaca' }}>{error}</div>}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button type='button' onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#667eea', fontSize: '.8rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Back to Login</button>
      </div>
    </div>
  );
}

export default FacultyRegister;
