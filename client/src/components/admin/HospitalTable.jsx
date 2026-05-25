import React, { useState, useEffect, useCallback } from 'react';
import { getHospitals, deleteHospital } from '../../services/adminService';
import CreateHospitalModal from './CreateHospitalModal';
import AssignAdminModal from './AssignAdminModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function HospitalTable() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(data.hospitals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteHospital(deleteTarget._id);
      setDeleteTarget(null);
      fetchHospitals();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const bedUtil = (h) => {
    if (!h.totalBeds) return 0;
    return Math.round((h.availableBeds / h.totalBeds) * 100);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Hospital Management</h2>
          <p>Create hospitals and assign hospital admins</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Create Hospital
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : hospitals.length === 0 ? (
        <div className="data-table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">🏥</div>
            <p>No hospitals yet. Create one to get started.</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Contact</th>
                <th>Beds</th>
                <th>Utilization</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h._id}>
                  <td>
                    <div className="cell-primary">{h.name}</div>
                    <div className="cell-secondary">📍 {h.address}</div>
                  </td>
                  <td>{h.contactNumber}</td>
                  <td>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{h.availableBeds}</span>
                    <span style={{ color: '#475569' }}> / {h.totalBeds}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="bar-chart-track" style={{ width: '80px' }}>
                        <div
                          className="bar-chart-fill"
                          style={{
                            width: `${bedUtil(h)}%`,
                            background: bedUtil(h) > 60
                              ? '#10b981'
                              : bedUtil(h) > 30
                                ? '#f59e0b'
                                : '#ef4444'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{bedUtil(h)}%</span>
                    </div>
                  </td>
                  <td>
                    {h.adminId ? (
                      <div>
                        <div className="cell-primary">{h.adminId.name}</div>
                        <div className="cell-secondary">{h.adminId.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#475569', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-assign" onClick={() => setAssignTarget(h)}>
                        👤 Assign Admin
                      </button>
                      <button className="btn-danger" onClick={() => setDeleteTarget(h)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateHospitalModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchHospitals}
        />
      )}
      {assignTarget && (
        <AssignAdminModal
          hospital={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={fetchHospitals}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Hospital"
          name={deleteTarget.name}
          warning="This will remove the hospital and unassign its admin."
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
