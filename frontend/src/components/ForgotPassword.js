import { useState } from 'react';
import API from '../services/api';

function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setOtpSent(true);
      setMessage(res.data.message || 'OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await API.post('/auth/reset-password', { email, otp, newPassword });
      setMessage(res.data.message || 'Password reset successful');
      setTimeout(() => { onNavigate('login'); }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto', background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', animation: 'fadeIn 0.4s ease-out' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔐 Password Recovery</h2>
      <p style={{ fontSize: '.9rem', color: '#475569', marginBottom: '1.5rem' }}>Enter your registered faculty email to receive a one-time OTP and reset your password securely.</p>

      {!otpSent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#334155' }}>Faculty Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder='name.branch@anits.edu.in' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.9rem' }} />
          <button disabled={!email || loading} onClick={sendOTP} style={{ padding: '12px 18px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: (!email||loading)?'not-allowed':'pointer' }}>{loading? 'Sending...' : 'Send OTP'}</button>
        </div>
      )}

      {otpSent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
          <div style={{ fontSize: '.8rem', color: '#0f766e', background: '#ecfdf5', padding: '.75rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5' }}>OTP sent to {email}. It expires in 10 minutes.</div>
          <label style={{ fontSize: '.75rem', fontWeight: 600 }}>Enter OTP</label>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder='6-digit OTP' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.9rem', letterSpacing: '4px', textAlign: 'center' }} />
          <label style={{ fontSize: '.75rem', fontWeight: 600 }}>New Password</label>
          <input type='password' value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder='At least 6 characters' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.9rem' }} />
          <label style={{ fontSize: '.75rem', fontWeight: 600 }}>Confirm Password</label>
          <input type='password' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder='Re-enter password' style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.9rem' }} />
          <button disabled={loading || !otp || !newPassword || !confirmPassword} onClick={resetPassword} style={{ padding: '14px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: (loading||!otp||!newPassword||!confirmPassword)?'not-allowed':'pointer' }}>{loading? 'Processing...' : 'Reset Password'}</button>
        </div>
      )}

      {message && <div style={{ marginTop: '1rem', fontSize: '.75rem', color: '#065f46', background: '#d1fae5', padding: '.6rem .9rem', borderRadius: '8px', border: '1px solid #10b981' }}>{message}</div>}
      {error && <div style={{ marginTop: '1rem', fontSize: '.75rem', color: '#991b1b', background: '#fee2e2', padding: '.6rem .9rem', borderRadius: '8px', border: '1px solid #fecaca' }}>{error}</div>}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button type='button' onClick={() => onNavigate('login')} style={{ background: 'none', border: 'none', color: '#667eea', fontSize: '.8rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Back to Login</button>
      </div>
    </div>
  );
}

export default ForgotPassword;
