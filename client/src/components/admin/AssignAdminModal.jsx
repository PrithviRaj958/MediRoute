import React, { useState, useEffect } from 'react';
import { getUsers, assignHospitalAdmin } from '../../services/adminService';

export default function AssignAdminModal({ hospital, onClose, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers('HOSPITAL_ADMIN')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return setError('Please select a user');
    setLoading(true);
    setError('');
    try {
      await assignHospitalAdmin(hospital._id, selectedUser);
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>🔗 Assign Hospital Admin</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Assigning admin to: <strong style={{ color: 'var(--text-main)' }}>{hospital.name}</strong>
        </p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Hospital Admin User</label>
            {fetching ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : (
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
                <option value="">— Choose a user —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}){u.hospitalId ? ' · Currently assigned' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
            ⚠️ If this user is already assigned to another hospital, they will be reassigned here.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || fetching}>
              {loading ? 'Assigning...' : 'Assign Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
