import React from "react";
import EmergencyPage from "./EmergencyPage";
import "../operator.css";

const OperatorDashboard = () => {
  return (
    <div className="container">
        <div className="Header"><h1>🚑 MediRoute Operator Dashboard</h1></div>
        <div className="content">
            <div className="card">
            <h2>Create & Manage Emergencies</h2>
            <EmergencyPage />
            </div>
        </div>
    </div>
  );
}

export default OperatorDashboard;