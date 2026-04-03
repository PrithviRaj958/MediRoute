import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield, Activity, MapPin, ChevronRight } from 'lucide-react';
import '../Dashboard.css';

/**
 * MediRoute Futuristic Dashboard Redirector
 * Logic-only file that interacts with Dashboard.css
 */

const Dashboard = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState("LOADING");

  useEffect(() => {
    // 1. Retrieve role and ID from localStorage
    const storedRole = localStorage.getItem("role"); 
    const hospitalId = localStorage.getItem("hospitalId");
    setRole(storedRole || "USER");

    // 2. Animate the progress bar for visual feedback
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 3 : 100));
    }, 40);

    // 3. Handle the redirection logic after the animation
    const timer = setTimeout(() => {
      if (storedRole === "OPERATOR") {
        navigate("/operator");
      } else if (storedRole === "HOSPITAL_ADMIN") {
        if (!hospitalId) {
          console.error("No hospital linked to this admin account.");
          navigate("/login");
        } else {
          navigate("/hospital-admin");
        }
      } else if (storedRole === "DRIVER") {
        navigate("/driver");
      } else {
        navigate("/login");
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="dashboard-root">
      {/* Background Animated Elements */}
      <div className="dashboard-blob-1"></div>
      <div className="dashboard-blob-2"></div>
      <div className="dashboard-grid-overlay"></div>

      {/* Futuristic UI Card */}
      <div className="dashboard-card">
        <div className="dashboard-logo-container">
          <Activity color="white" size={40} />
        </div>
        
        <h1 className="dashboard-title">MediRoute</h1>
        <p className="dashboard-subtitle">Next-Gen Medical Logistics</p>

        <div className="dashboard-content-area">
          <p className="dashboard-status-text">
            {progress < 100 ? 'Authenticating Secure Session' : 'Initializing Workspace...'}
          </p>
          <p className="dashboard-role-text">
            Accessing {role.replace('_', ' ')} terminal
          </p>

          {/* Progress Bar (Width is dynamic based on state) */}
          <div className="dashboard-progress-track">
            <div 
              className="dashboard-progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Visual Indicators */}
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-item">
              <Shield size={18} color="#60a5fa" />
              <span className="dashboard-stat-label">Secure</span>
            </div>
            <div className="dashboard-stat-item">
              <MapPin size={18} color="#34d399" />
              <span className="dashboard-stat-label">Live GPS</span>
            </div>
            <div className="dashboard-stat-item">
              <Loader2 size={18} color="#22d3ee" className="dashboard-spinning-icon" />
              <span className="dashboard-stat-label">Syncing</span>
            </div>
          </div>

          {/* Redirection Active Indicator */}
          {progress === 100 && (
            <div className="dashboard-redirect-info">
              Redirection Protocol Active <ChevronRight size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Decorative System ID */}
      <p className="dashboard-system-id">
        System ID: MR-{Math.floor(Math.random() * 9000) + 1000}-QX
      </p>
    </div>
  );
};

export default Dashboard;