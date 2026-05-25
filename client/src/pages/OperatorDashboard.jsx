import React from "react";
import EmergencyPage from "./EmergencyPage";
import "../HospitalPanel.css"; // Reuse the polished dashboard styles

const OperatorDashboard = () => {
  return (
    <div className="admin-container">
        <header className="admin-header">
            <h1>🚑 MediRoute Operator Terminal</h1>
        </header>
        <main className="dashboard-content" style={{ padding: "20px 0" }}>
            <EmergencyPage />
        </main>
    </div>
  );
}

export default OperatorDashboard;