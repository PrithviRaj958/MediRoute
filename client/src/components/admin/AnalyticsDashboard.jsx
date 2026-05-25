import React, { useEffect, useState, useCallback } from 'react';
import { getStats } from '../../services/adminService';
import StatsCards from './StatsCards';

const REFRESH_INTERVAL = 30; // seconds

const STATUS_COLORS = {
  PENDING: '#6366f1',
  ASSIGNED: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981'
};

const TYPE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function buildDonutGradient(segments) {
  if (!segments.length) return 'conic-gradient(rgba(255,255,255,0.06) 0deg 360deg)';
  const total = segments.reduce((s, x) => s + x.count, 0);
  if (!total) return 'conic-gradient(rgba(255,255,255,0.06) 0deg 360deg)';
  let cursor = 0;
  const parts = segments.map((seg) => {
    const deg = (seg.count / total) * 360;
    const color = seg.color;
    const part = `${color} ${cursor}deg ${cursor + deg}deg`;
    cursor += deg;
    return part;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Stats fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const emergencyByStatus = stats?.emergencyByStatus ?? [];
  const emergencyByType = stats?.emergencyByType ?? [];
  const emergencyBySeverity = stats?.emergencyBySeverity ?? [];

  const statusSegments = emergencyByStatus.map((s) => ({
    ...s,
    color: STATUS_COLORS[s._id] || '#64748b'
  }));

  const totalEmergencies = emergencyByStatus.reduce((s, x) => s + x.count, 0);
  const totalByType = emergencyByType.reduce((s, x) => s + x.count, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>System Overview</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
            Live system metrics — auto-refreshes every {REFRESH_INTERVAL}s
          </p>
        </div>
        <div className="refresh-indicator">
          <div className="refresh-dot" />
          <span>Refreshing in {countdown}s</span>
          {lastUpdated && (
            <span style={{ marginLeft: '0.5rem', color: '#334155' }}>
              · Last: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => { fetchStats(); setCountdown(REFRESH_INTERVAL); }}
            className="btn-secondary"
            style={{ marginLeft: '0.75rem', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <StatsCards stats={stats} loading={loading} />

      <div className="analytics-grid">
        {/* Emergency by Status — Donut */}
        <div className="analytics-card">
          <h3>Emergency by Status</h3>
          <div className="donut-chart-container">
            <div
              className="donut-chart"
              style={{ background: buildDonutGradient(statusSegments) }}
            />
            <div className="donut-legend">
              {statusSegments.length === 0 && (
                <div style={{ color: '#475569', fontSize: '0.82rem' }}>No data yet</div>
              )}
              {statusSegments.map((seg) => (
                <div className="legend-item" key={seg._id}>
                  <div className="legend-dot" style={{ background: seg.color }} />
                  <span>{seg._id}</span>
                  <span className="legend-value">{seg.count}</span>
                </div>
              ))}
              {totalEmergencies > 0 && (
                <div className="legend-item" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', marginTop: '0.3rem' }}>
                  <span style={{ fontWeight: 600, color: '#94a3b8' }}>Total</span>
                  <span className="legend-value">{totalEmergencies}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency by Type — Bar chart */}
        <div className="analytics-card">
          <h3>Emergency by Type</h3>
          {emergencyByType.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '0.82rem' }}>No data yet</div>
          ) : (
            emergencyByType.map((item, i) => (
              <div key={item._id} className="bar-chart-row">
                <div className="bar-chart-label">
                  <span>{item._id}</span>
                  <span style={{ color: TYPE_COLORS[i % TYPE_COLORS.length] }}>{item.count}</span>
                </div>
                <div className="bar-chart-track">
                  <div
                    className="bar-chart-fill"
                    style={{
                      width: totalByType ? `${(item.count / totalByType) * 100}%` : '0%',
                      background: TYPE_COLORS[i % TYPE_COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ambulance Fleet Status */}
        <div className="analytics-card">
          <h3>Ambulance Fleet Status</h3>
          <div className="donut-chart-container">
            <div
              className="donut-chart"
              style={{
                background: buildDonutGradient([
                  { _id: 'AVAILABLE', count: stats?.availableAmbulances ?? 0, color: '#10b981' },
                  { _id: 'BUSY', count: stats?.busyAmbulances ?? 0, color: '#f59e0b' },
                  { _id: 'OFFLINE', count: stats?.offlineAmbulances ?? 0, color: '#ef4444' }
                ])
              }}
            />
            <div className="donut-legend">
              {[
                { label: 'Available', value: stats?.availableAmbulances ?? 0, color: '#10b981' },
                { label: 'Busy', value: stats?.busyAmbulances ?? 0, color: '#f59e0b' },
                { label: 'Offline', value: stats?.offlineAmbulances ?? 0, color: '#ef4444' }
              ].map((item) => (
                <div className="legend-item" key={item.label}>
                  <div className="legend-dot" style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
              <div className="legend-item" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', marginTop: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>Total Fleet</span>
                <span className="legend-value">{stats?.totalAmbulances ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Severity */}
        <div className="analytics-card">
          <h3>Emergency by Severity</h3>
          {emergencyBySeverity.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '0.82rem' }}>No data yet</div>
          ) : (
            emergencyBySeverity.map((item) => {
              const colorMap = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
              const color = colorMap[item._id] || '#6366f1';
              const total = emergencyBySeverity.reduce((s, x) => s + x.count, 0);
              return (
                <div key={item._id} className="bar-chart-row">
                  <div className="bar-chart-label">
                    <span>{item._id}</span>
                    <span style={{ color }}>{item.count}</span>
                  </div>
                  <div className="bar-chart-track">
                    <div
                      className="bar-chart-fill"
                      style={{ width: total ? `${(item.count / total) * 100}%` : '0%', background: color }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
