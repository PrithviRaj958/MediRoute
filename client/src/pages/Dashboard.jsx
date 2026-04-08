import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Activity, Map, ChevronRight, HeartPulse } from 'lucide-react';
import '../Dashboard.css';

const Dashboard= () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [role, setRole] = useState("LOADING");

  useEffect(() => {
    const storedRole = localStorage.getItem("role"); 
    const hospitalId = localStorage.getItem("hospitalId");
    setRole(storedRole || "USER");

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 2 : 100));
    }, 30);

    const timer = setTimeout(() => {
      // In a real app, these would navigate to different routes
      if (storedRole === "OPERATOR") {
        navigate("/operator");
      } else if (storedRole === "HOSPITAL_ADMIN") {
        if (!hospitalId) {
          navigate("/login");
        } else {
          navigate("/hospital-admin");
        }
      } else if (storedRole === "DRIVER") {
        navigate("/driver");
      } else {
        navigate("/login");
      }
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="clinical-root">
      <div className="clinical-grid"></div>
      <div className="clinical-bg-accent accent-tl"></div>
      <div className="clinical-bg-accent accent-br"></div>

      <div className="clinical-card">
        <div className="clinical-icon-box">
          <HeartPulse size={36} />
        </div>

        <h1 className="clinical-title">
          MediRoute <span className="clinical-badge">v2.0</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Medical Logistics Management System</p>

        <div className="clinical-progress-container">
          <div className="clinical-progress-label">
            <span>{progress < 100 ? 'Syncing Clinical Data...' : 'Protocol Ready'}</span>
            <span>{progress}%</span>
          </div>
          <div className="clinical-progress-track">
            <div className="clinical-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="clinical-stats">
          <div className="clinical-stat-card">
            <ShieldCheck size={20} color="#0ea5e9" />
            <span>Encrypted</span>
          </div>
          <div className="clinical-stat-card">
            <Activity size={20} color="#0ea5e9" />
            <span>Real-time</span>
          </div>
          <div className="clinical-stat-card">
            <Map size={20} color="#0ea5e9" />
            <span>Routed</span>
          </div>
        </div>

        {progress === 100 && (
          <div className="clinical-redirecting">
            Redirecting to {role.replace('_', ' ')} Workspace <ChevronRight size={18} />
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '24px', fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>
        SECURE TERMINAL : {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default Dashboard;
