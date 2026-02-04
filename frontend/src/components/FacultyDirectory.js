import { useEffect, useState, useCallback } from 'react';
import { FiUsers, FiPlus } from 'react-icons/fi';
import API from '../services/api';
import FacultyRegister from './FacultyRegister';
import { toast } from './Toast';

function FacultyDirectory({ onNavigate }) {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', branch: '', role: '', isActive: true, email: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const fetchFaculties = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) { setError('Login as admin'); setLoading(false); return; }
      const res = await API.get(`/auth/faculty?search=${encodeURIComponent(search)}&role=${roleFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaculties(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load faculty');
    } finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

  const openEdit = (faculty) => {
    setSelected(faculty);
    setEditForm({ name: faculty.name, branch: faculty.branch, role: faculty.role, isActive: faculty.isActive, email: faculty.email, newPassword: '' });
  };

  const updateField = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    toast.info('Updating faculty details...');
    try {
      const token = localStorage.getItem('jwt_token');
      await API.patch(`/auth/faculty/${selected.id || selected._id}`, {
        name: editForm.name,
        branch: editForm.branch,
        role: editForm.role,
        isActive: editForm.isActive,
        email: editForm.email
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Forced password reset if provided
      if (editForm.newPassword.trim()) {
        await API.post(`/auth/faculty/${selected.id || selected._id}/reset-password`, { newPassword: editForm.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Faculty updated & password reset successfully!');
      } else {
        toast.success('Faculty details updated successfully!');
      }

      setSelected(null);
      setEditForm({ name: '', branch: '', role: '', isActive: true, email: '', newPassword: '' });
      fetchFaculties();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update faculty';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FiUsers size={32} style={{ color: '#667eea' }} />
          <div>
            <h2 style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>Faculty Directory</h2>
            <p style={{ fontSize: '.85rem', color: '#64748b', fontWeight: 500, margin: '4px 0 0 0' }}>Manage and review existing faculty accounts.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(s => !s)} style={{ padding: '12px 20px', background: showCreate? '#dc2626':'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(102,126,234,0.35)', display: 'flex', alignItems: 'center', gap: '8px' }}>{showCreate? 'Close Form' : <><FiPlus size={18} /> New Faculty</>}</button>
      </div>

      {showCreate && <div style={{ marginBottom: '2rem' }}><FacultyRegister onNavigate={onNavigate} /></div>}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search name or email...' style={{ flex: '1 1 240px', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '.9rem' }}>
          <option value='all'>All Roles</option>
          <option value='faculty'>Faculty</option>
          <option value='admin'>Admin</option>
          <option value='superadmin'>Superadmin</option>
        </select>
        <button onClick={fetchFaculties} style={{ padding: '12px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '12px', border: '2px solid #fecaca', fontSize: '.8rem', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', fontSize: '.9rem', color: '#64748b' }}>Loading faculty...</div>
        ) : faculties.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', fontSize: '.9rem', color: '#64748b' }}>No faculty found</div>
        ) : (
          faculties.map(f => (
            <div key={f.email} onClick={() => openEdit(f)} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(14,165,233,0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }} style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '2px solid #bae6fd', padding: '1.25rem', borderRadius: '16px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '.6rem', cursor: 'pointer', transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(14,165,233,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                <div style={{ fontWeight: 700, color: '#0c4a6e', fontSize: '.95rem' }}>{f.name}</div>
                <span style={{ fontSize: '.65rem', padding: '.3rem .6rem', background: '#1e3a8a', color: 'white', borderRadius: '6px', fontWeight: 600 }}>{f.role}</span>
              </div>
              <div style={{ fontSize: '.7rem', color: '#1e3a8a', wordBreak: 'break-all' }}>{f.email}</div>
              <div style={{ fontSize: '.65rem', color: '#475569' }}>Branch: {f.branch}</div>
              <div style={{ fontSize: '.65rem', color: '#475569' }}>Active: {f.isActive ? '✅' : '❌'}</div>
              <div style={{ fontSize: '.65rem', color: '#dc2626', fontWeight: 600, wordBreak: 'break-all' }}>Password: {f.plaintextPassword || '••••••'}</div>
              <div style={{ fontSize: '.6rem', color: '#64748b' }}>Last Login: {f.lastLogin ? new Date(f.lastLogin).toLocaleString() : '—'}</div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', animation: 'scaleIn .3s ease-out', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✏️ Edit Faculty</h3>
            <div style={{ fontSize: '.7rem', color: '#64748b', wordBreak: 'break-all' }}>Editing: {selected.email}</div>
            {selected.plaintextPassword && (
              <div style={{ background: '#fef3c7', border: '2px solid #fbbf24', padding: '10px 14px', borderRadius: '10px', fontSize: '.7rem', color: '#92400e', fontWeight: 600 }}>
                🔑 Current Password: <span style={{ fontFamily: 'monospace', fontSize: '.85rem' }}>{selected.plaintextPassword}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <label style={{ fontSize: '.65rem', fontWeight: 600 }}>Name</label>
              <input name='name' value={editForm.name} onChange={updateField} style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.85rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <label style={{ fontSize: '.65rem', fontWeight: 600 }}>Email</label>
              <input name='email' value={editForm.email} onChange={updateField} placeholder='name.branch@anits.edu.in' style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.85rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                <label style={{ fontSize: '.65rem', fontWeight: 600 }}>Branch</label>
                <input name='branch' value={editForm.branch} onChange={updateField} style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.85rem' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                <label style={{ fontSize: '.65rem', fontWeight: 600 }}>Role</label>
                <select name='role' value={editForm.role} onChange={updateField} style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.85rem' }}>
                  <option value='faculty'>Faculty</option>
                  <option value='admin'>Admin</option>
                  <option value='superadmin'>Superadmin</option>
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.7rem', fontWeight: 600 }}>
              <input type='checkbox' name='isActive' checked={editForm.isActive} onChange={updateField} /> Active Account
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <label style={{ fontSize: '.65rem', fontWeight: 600 }}>Force Password Reset (optional)</label>
              <input name='newPassword' type='password' value={editForm.newPassword} onChange={updateField} placeholder='New password (min 6)' style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '.85rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
              <button type='button' onClick={() => setSelected(null)} style={{ flex: '1 1 120px', padding: '12px 16px', background: '#64748b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type='button' disabled={saving} onClick={saveChanges} style={{ flex: '1 1 120px', padding: '12px 16px', background: saving? '#94a3b8':'#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: saving? 'not-allowed':'pointer' }}>{saving? 'Saving...' : '💾 Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDirectory;
