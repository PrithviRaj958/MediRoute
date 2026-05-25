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
    
    // Poll every 30 seconds for live resource updates
    const interval = setInterval(fetchHospitals, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-container">
        <header className="admin-header">
            <h1>🚑 MediRoute Operator Terminal</h1>
        </header>
        
        {/* Hospital Network Status Panel */}
        <section className="stats-card" style={{ margin: "20px" }}>
            <h3 style={{ borderBottom: "2px solid var(--border-color)", paddingBottom: "10px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                🏥 Live Hospital Network Status
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
                {networkHospitals.map(h => (
                    <div key={h._id} style={{ background: "var(--bg-color)", padding: "15px", borderRadius: "var(--radius-md)", borderLeft: `5px solid ${h.availableBeds > 0 && h.traumaTeamAvailable ? 'var(--success-color)' : 'var(--danger-color)'}` }}>
                        <p style={{ fontWeight: "bold", margin: "0 0 10px 0", fontSize: "1.1rem" }}>{h.name}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.9rem" }}>
                            <div><strong>Beds:</strong> {h.availableBeds}/{h.totalBeds}</div>
                            <div><strong>ICU:</strong> <span style={{ color: h.icuBeds > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{h.icuBeds}</span></div>
                            <div><strong>O-Neg Blood:</strong> <span style={{ color: h.bloodSupplyStatus === 'Stable' ? 'var(--success-color)' : h.bloodSupplyStatus === 'Low' ? 'var(--warning-color)' : 'var(--danger-color)' }}>{h.bloodSupplyStatus}</span></div>
                            <div><strong>Trauma Team:</strong> <span style={{ color: h.traumaTeamAvailable ? 'var(--success-color)' : 'var(--danger-color)' }}>{h.traumaTeamAvailable ? 'Available' : 'Busy'}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <main className="dashboard-content" style={{ padding: "0 20px 20px 20px" }}>
            <EmergencyPage />
        </main>
    </div>
  );
}

export default OperatorDashboard;