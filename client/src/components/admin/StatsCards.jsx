import React from 'react';

const cards = [
  {
    key: 'totalHospitals',
    label: 'Total Hospitals',
    icon: '🏥',
    accent: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    iconBg: 'rgba(99,102,241,0.15)',
    format: (v) => v,
    sub: (s) => `${s.availableBeds ?? 0} beds available`
  },
  {
    key: 'totalAmbulances',
    label: 'Total Ambulances',
    icon: '🚑',
    accent: 'linear-gradient(90deg, #3b82f6, #6366f1)',
    iconBg: 'rgba(59,130,246,0.15)',
    format: (v) => v,
    sub: (s) => `${s.availableAmbulances ?? 0} available · ${s.busyAmbulances ?? 0} busy`
  },
  {
    key: 'activeEmergencies',
    label: 'Active Emergencies',
    icon: '🚨',
    accent: 'linear-gradient(90deg, #ef4444, #f97316)',
    iconBg: 'rgba(239,68,68,0.15)',
    format: (v) => v,
    sub: () => 'Pending + Assigned + In Progress'
  },
  {
    key: 'availableBeds',
    label: 'Available Beds',
    icon: '🛏️',
    accent: 'linear-gradient(90deg, #10b981, #06b6d4)',
    iconBg: 'rgba(16,185,129,0.15)',
    format: (v) => v,
    sub: (s) => `of ${s.totalBeds ?? 0} total beds`
  },
  {
    key: 'totalUsers',
    label: 'Registered Users',
    icon: '👥',
    accent: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
    iconBg: 'rgba(139,92,246,0.15)',
    format: (v) => v,
    sub: () => 'Drivers, Operators, Admins'
  },
  {
    key: 'availableAmbulances',
    label: 'Fleet Available',
    icon: '✅',
    accent: 'linear-gradient(90deg, #10b981, #22c55e)',
    iconBg: 'rgba(16,185,129,0.15)',
    format: (v) => v,
    sub: (s) => `${s.offlineAmbulances ?? 0} offline`
  },
];

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="stats-grid">
        {cards.map((_, i) => (
          <div key={i} className="stat-card" style={{ opacity: 0.4 }}>
            <div className="stat-card-icon" />
            <div className="stat-card-value">—</div>
            <div className="stat-card-label">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {cards.map((card, i) => (
        <div
          key={card.key}
          className="stat-card"
          style={{
            '--card-accent': card.accent,
            '--icon-bg': card.iconBg,
            animationDelay: `${i * 0.06}s`
          }}
        >
          <div className="stat-card-icon">{card.icon}</div>
          <div className="stat-card-value">{card.format(stats?.[card.key] ?? 0)}</div>
          <div className="stat-card-label">{card.label}</div>
          <div className="stat-card-sub">{card.sub(stats ?? {})}</div>
        </div>
      ))}
    </div>
  );
}
