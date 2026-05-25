import React, { useState, useEffect, useCallback } from 'react';
import { getEmergencies } from '../../services/adminService';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' }
];

const STATUS_BADGE = {
  PENDING: 'badge-pending',
  ASSIGNED: 'badge-assigned',
  IN_PROGRESS: 'badge-in-progress',
  COMPLETED: 'badge-completed'
};

const SEVERITY_BADGE = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low'
};

export default function EmergencyTable() {
  const [emergencies, setEmergencies] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmergencies(statusFilter);
      setEmergencies(data.emergencies);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchEmergencies(); }, [fetchEmergencies]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Emergency Log</h2>
          <p>View all emergency dispatches and their status</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={fetchEmergencies} style={{ padding: '0.5rem 1rem' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : emergencies.length === 0 ? (
        <div className="data-table-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">🚨</div>
            <p>No emergencies found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type & Severity</th>
                <th>Status</th>
                <th>Patient</th>
                <th>Ambulance</th>
                <th>Hospital</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.map((em) => (
                <tr key={em._id}>
                  <td>
                    <div className="cell-primary">{em.emergencyType || 'Unknown'}</div>
                    <div style={{ marginTop: '0.3rem' }}>
                      <span className={`badge ${SEVERITY_BADGE[em.severity] || 'badge-pending'}`}>
                        {em.severity}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[em.status] || 'badge-pending'}`}>
                      {em.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      {em.patientName || '—'}
                    </span>
                  </td>
                  <td>
                    {em.assignedAmbulance ? (
                      <div>
                        <div className="cell-primary">{em.assignedAmbulance.vehicleNumber}</div>
                        <div className="cell-secondary">{em.assignedAmbulance.status}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '0.78rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {em.assignedHospital ? (
                      <div className="cell-primary" style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {em.assignedHospital.name}
                      </div>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '0.78rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {formatDate(em.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
