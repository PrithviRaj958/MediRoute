import React, { useState, useEffect } from 'react';
import { getUsers, assignDriver } from '../../services/adminService';

export default function AssignDriverModal({ ambulance, onClose, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers('DRIVER')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return setError('Please select a driver');
    setLoading(true);
    setError('');
    try {
      await assignDriver(ambulance._id, selectedUser);
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
          <h3>🚗 Assign Driver</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Assigning driver to:{' '}
          <strong style={{ color: 'var(--text-main)' }}>{ambulance.vehicleNumber}</strong>
          {' '}
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>({ambulance.capability})</span>
        </p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Driver</label>
            {fetching ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : users.length === 0 ? (
              <div style={{ color: '#475569', fontSize: '0.85rem', padding: '0.75rem 0' }}>
                No drivers found. Register a driver account first.
              </div>
            ) : (
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
                <option value="">— Choose a driver —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}){u.ambulanceId ? ' · Currently assigned' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
            ⚠️ If this driver is already assigned to another ambulance, they will be reassigned here.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || fetching || users.length === 0}>
              {loading ? 'Assigning...' : 'Assign Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
