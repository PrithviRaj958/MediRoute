import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import HospitalTable from '../../components/admin/HospitalTable';
import AmbulanceTable from '../../components/admin/AmbulanceTable';
import UserTable from '../../components/admin/UserTable';
import EmergencyTable from '../../components/admin/EmergencyTable';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'hospitals', label: 'Hospitals', icon: '🏥' },
  { id: 'ambulances', label: 'Ambulances', icon: '🚑' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'emergencies', label: 'Emergencies', icon: '🚨' }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':    return <AnalyticsDashboard />;
      case 'hospitals':   return <HospitalTable />;
      case 'ambulances':  return <AmbulanceTable />;
      case 'users':       return <UserTable />;
      case 'emergencies': return <EmergencyTable />;
      default:            return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <div className="brand-icon">🏥</div>
          <h1>MediRoute</h1>
          <span>System Admin</span>
        </div>
        <div className="admin-header-right">
          <div className="admin-header-user">
            👤 <strong>{user.name || 'Admin'}</strong>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            ⏻ Logout
          </button>
        </div>
      </header>

      {/* ── Navigation Tabs ── */}
      <nav className="admin-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`admin-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="admin-content" key={activeTab}>
        {renderContent()}
      </main>
    </div>
  );
}
