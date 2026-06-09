import React, { useState, useEffect } from "react";
import axios from "axios";
import EmergencyPage from "./EmergencyPage";
import "../HospitalPanel.css"; // Reuse the polished dashboard styles

const OperatorDashboard = () => {
  const [networkHospitals, setNetworkHospitals] = useState([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/hospitals/all");
        setNetworkHospitals(res.data);
      } catch(err) {
        console.error("Failed to fetch hospital network", err);
      }
    };
    fetchHospitals();
    
    // Poll every 10 seconds for more responsive resource updates during testing
    const interval = setInterval(fetchHospitals, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-container" style={{ maxWidth: "100%", margin: "0 auto", padding: "0 20px" }}>
        <header className="admin-header" style={{ marginBottom: "20px" }}>
            <h1>🚑 MediRoute Operator Terminal</h1>
        </header>
        
        <div className="operator-layout-container">
            {/* Main Area: Dispatch Unit / Tracking View */}
            <main className="operator-main-area">
                <EmergencyPage />
            </main>

            {/* Sidebar Column: Live Hospital Network Status */}
            <aside className="operator-sidebar">
                <h3 style={{ 
                    borderBottom: "2px solid var(--border-color)", 
                    paddingBottom: "10px", 
                    margin: "0 0 15px 0", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    fontSize: "1.2rem",
                    color: "var(--text-main)"
                }}>
                    🏥 Live Hospital Network
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {networkHospitals.map(h => (
                        <div key={h._id} style={{ 
                            background: "var(--bg-color)", 
                            padding: "15px", 
                            borderRadius: "var(--radius-md)", 
                            border: "1px solid var(--border-color)",
                            borderLeft: `5px solid ${h.availableBeds > 0 && h.traumaTeamAvailable ? 'var(--success-color)' : 'var(--danger-color)'}`,
                            boxShadow: "var(--shadow-sm)"
                        }}>
                            <p style={{ fontWeight: "bold", margin: "0 0 8px 0", fontSize: "1.05rem", color: "var(--text-main)" }}>{h.name}</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.88rem" }}>
                                <div><strong>Beds:</strong> {h.availableBeds}/{h.totalBeds}</div>
                                <div><strong>ICU:</strong> <span style={{ color: h.icuBeds > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{h.icuBeds}</span></div>
                                <div style={{ gridColumn: "1 / -1" }}><strong>O-Neg Blood:</strong> <span style={{ color: h.bloodSupplyStatus === 'Stable' ? 'var(--success-color)' : h.bloodSupplyStatus === 'Low' ? 'var(--warning-color)' : 'var(--danger-color)' }}>{h.bloodSupplyStatus}</span></div>
                                <div style={{ gridColumn: "1 / -1" }}><strong>Trauma Team:</strong> <span style={{ color: h.traumaTeamAvailable ? 'var(--success-color)' : 'var(--danger-color)' }}>{h.traumaTeamAvailable ? 'Available' : 'Busy'}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    </div>
  );
}

export default OperatorDashboard;