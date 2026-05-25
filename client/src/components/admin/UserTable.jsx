import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, deleteUser } from '../../services/adminService';
import DeleteConfirmModal from './DeleteConfirmModal';

const ALL_ROLES = ['', 'DRIVER', 'OPERATOR', 'HOSPITAL_ADMIN', 'SYSTEM_ADMIN'];
const ROLE_LABELS = {
  '': 'All Users',
  DRIVER: 'Drivers',
  OPERATOR: 'Operators',
  HOSPITAL_ADMIN: 'Hospital Admins',
  SYSTEM_ADMIN: 'System Admins'
};

const ROLE_BADGE = {
  DRIVER: 'badge-driver',
  OPERATOR: 'badge-operator',
  HOSPITAL_ADMIN: 'badge-hospital-admin',
  SYSTEM_ADMIN: 'badge-system-admin'
};

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(roleFilter);
      setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>User Management</h2>
          <p>View and manage all registered users by role</p>
        </div>
        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
          {users.length} user{users.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="role-filter-tabs">
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            className={`role-filter-tab ${roleFilter === role ? 'active' : ''}`}
            onClick={() => setRoleFilter(role)}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="data-table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No users found{roleFilter ? ` with role "${ROLE_LABELS[roleFilter]}"` : ''}.</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Assigned To</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="cell-primary">{u.name}</div>
                    <div className="cell-secondary">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] || 'badge-pending'}`}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{u.phone || '—'}</td>
                  <td>
                    {u.hospitalId ? (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>🏥 {u.hospitalId.name}</div>
                      </div>
                    ) : u.ambulanceId ? (
                      <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>
                        🚑 {u.ambulanceId.vehicleNumber}
                      </div>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <button className="btn-danger" onClick={() => setDeleteTarget(u)}>
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete User"
          name={`${deleteTarget.name} (${deleteTarget.email})`}
          warning="This will permanently remove the user account and all associated data."
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
