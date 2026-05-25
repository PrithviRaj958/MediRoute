import React, { useState, useEffect, useCallback } from 'react';
import { getAmbulances, deleteAmbulance } from '../../services/adminService';
import CreateAmbulanceModal from './CreateAmbulanceModal';
import AssignDriverModal from './AssignDriverModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const STATUS_BADGE = {
  AVAILABLE: 'badge-available',
  BUSY: 'badge-busy',
  OFFLINE: 'badge-offline'
};

export default function AmbulanceTable() {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAmbulances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAmbulances();
      setAmbulances(data.ambulances);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAmbulances(); }, [fetchAmbulances]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteAmbulance(deleteTarget._id);
      setDeleteTarget(null);
      fetchAmbulances();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Ambulance Fleet</h2>
          <p>Manage ambulances and assign drivers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Add Ambulance
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : ambulances.length === 0 ? (
        <div className="data-table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">🚑</div>
            <p>No ambulances yet. Add one to get started.</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Capability</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ambulances.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="cell-primary">{a.vehicleNumber}</div>
                    <div className="cell-secondary">ID: {a._id.slice(-6).toUpperCase()}</div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: a.capability === 'ALS'
                          ? 'rgba(99,102,241,0.15)'
                          : 'rgba(59,130,246,0.15)',
                        color: a.capability === 'ALS' ? '#6366f1' : '#3b82f6',
                        border: `1px solid ${a.capability === 'ALS' ? 'rgba(99,102,241,0.3)' : 'rgba(59,130,246,0.3)'}`
                      }}
                    >
                      {a.capability}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[a.status] || 'badge-offline'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    {a.driverId ? (
                      <div>
                        <div className="cell-primary">{a.driverId.name}</div>
                        <div className="cell-secondary">{a.driverId.email}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#475569', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    {a.currentLocation?.coordinates ? (
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {a.currentLocation.coordinates[1].toFixed(4)},&nbsp;
                        {a.currentLocation.coordinates[0].toFixed(4)}
                      </span>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '0.78rem' }}>Unknown</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-assign" onClick={() => setAssignTarget(a)}>
                        🚗 Assign Driver
                      </button>
                      <button className="btn-danger" onClick={() => setDeleteTarget(a)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateAmbulanceModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchAmbulances}
        />
      )}
      {assignTarget && (
        <AssignDriverModal
          ambulance={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={fetchAmbulances}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Ambulance"
          name={deleteTarget.vehicleNumber}
          warning="This will remove the ambulance record and unassign its driver."
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
