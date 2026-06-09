import { useState, useEffect } from "react";
import axios from "axios";
import "../Emergency.css";
import { getSocket, initiateSocketConnection } from "../services/socketService"; 
import TrackAmbulanceWidget from "../components/Map/TrackAmbulanceWidget";

function EmergencyPage() {
  const [name, setName] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [severity, setSeverity] = useState("Medium");
  
  const [emergency, setEmergency] = useState(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    initiateSocketConnection();
    const socket = getSocket();

    if (socket) {
      socket.on("driver_confirmed_assignment", async (data) => {
        await fetchCurrentEmergency(data.emergencyId); 
        setMessage("Driver assigned! Waiting for Hospital confirmation...");
      });

      socket.on("handshake_completed", async (data) => {
        await fetchCurrentEmergency(data.requestId);
        setMessage("✅ Hospital Ready! Live Tracking Started.");
      });

      socket.on("dispatch_failed", (data) => {
        setEmergency(null);
        setMessage(`❌ Dispatch Failed: ${data.message}`);
      });

      socket.on("handshake_failed", (data) => {
        setEmergency(null);
        setMessage(`❌ Handshake Failed: ${data.message}`);
      });
    }

    return () => {
      if (socket) {
        socket.off("driver_confirmed_assignment");
        socket.off("handshake_completed");
        socket.off("dispatch_failed");
        socket.off("handshake_failed");
      }
    };
  }, []);

  const fetchCurrentEmergency = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/emergencies/${id}`);
      setEmergency(res.data);
    } catch (err) {
      console.error("Error syncing emergency:", err);
    }
  };

  const createAndBroadcastEmergency = async () => {
    if (!name.trim()) {
      setMessage("Please enter patient name.");
      return;
    }
    if (!lng || isNaN(parseFloat(lng))) {
      setMessage("Please enter a valid longitude.");
      return;
    }
    if (!lat || isNaN(parseFloat(lat))) {
      setMessage("Please enter a valid latitude.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/emergencies`, {
        patientName: name,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        severity: severity
      });
      
      const newEmergency = res.data;
      setEmergency(newEmergency);
      
      const socket = getSocket();
      if (socket) {
        socket.emit("broadcast_to_drivers", newEmergency);
      }

      setMessage("🚨 Emergency Broadcasted! Waiting for a driver to respond...");
    } catch(err) {
      const errMsg = err.response?.data?.message || err.message;
      setMessage("Error: " + errMsg);
      setEmergency(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmergency(null);
    setIsFormExpanded(false);
    setName("");
    setLng("");
    setLat("");
    setSeverity("Medium");
    setMessage("");
  };

  return (
    <div className="emergency-container" style={{ margin: "0 auto", padding: "20px" }}>
      <div className="emergency-grid">
        
        {emergency ? (
          <>
            {/* Minimized bar displaying current SOS status */}
            <div className="dispatch-minimized-bar">
              <div className="minimized-info">
                <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                  <span style={{ fontSize: "1.2rem" }}>🚨</span>
                  <strong>Active SOS:</strong> {emergency.patientName}
                </p>
                <span className={`severity-badge severity-${emergency.severity.toLowerCase()}`} style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: "bold",
                  background: emergency.severity === "High" ? "rgba(239, 68, 68, 0.15)" : emergency.severity === "Medium" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  color: emergency.severity === "High" ? "var(--danger-color)" : emergency.severity === "Medium" ? "var(--warning-color)" : "var(--success-color)",
                  border: `1px solid ${emergency.severity === "High" ? "rgba(239, 68, 68, 0.3)" : emergency.severity === "Medium" ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                }}>
                  {emergency.severity} Priority
                </span>
                <p style={{ margin: 0 }}>
                  <strong>GPS Coordinates:</strong> [
                  {emergency.location?.coordinates 
                    ? `${emergency.location.coordinates[0].toFixed(4)}, ${emergency.location.coordinates[1].toFixed(4)}`
                    : `${lng}, ${lat}`
                  }]
                </p>
              </div>
              <div className="minimized-actions">
                <button onClick={() => setIsFormExpanded(true)} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
                  🔍 View Details
                </button>
                <button onClick={handleReset} className="btn btn-decline" style={{ padding: "8px 16px", fontSize: "0.9rem", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}>
                  Clear & Reset
                </button>
              </div>
            </div>

            {/* Modal Overlay for Expanded Details */}
            {isFormExpanded && (
              <div className="form-modal-overlay" onClick={() => setIsFormExpanded(false)}>
                <div className="form-modal-content" onClick={e => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={() => setIsFormExpanded(false)}>
                    &times;
                  </button>
                  <h3 className="section-title">
                    <span style={{ fontSize: "1.8rem" }}>🚨</span> Dispatch Details
                  </h3>
                  <p className="section-subtitle">
                    Active emergency broadcast details. The form is locked while the incident is ongoing.
                  </p>
                  
                  <div className="input-grid">
                    <div className="input-group-full">
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Patient Name</label>
                        <input 
                          value={emergency.patientName} 
                          className="form-input" 
                          disabled 
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Longitude (X)</label>
                        <input 
                          value={emergency.location?.coordinates ? emergency.location.coordinates[0] : lng} 
                          className="form-input" 
                          disabled 
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Latitude (Y)</label>
                        <input 
                          value={emergency.location?.coordinates ? emergency.location.coordinates[1] : lat} 
                          className="form-input" 
                          disabled 
                        />
                    </div>

                    <div className="input-group-full">
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Triage Severity Level</label>
                        <select 
                          value={emergency.severity} 
                          className="form-select" 
                          disabled
                        >
                          <option value="Low">🟢 Low Priority (Non-Life Threatening)</option>
                          <option value="Medium">🟡 Medium Priority (Urgent Care)</option>
                          <option value="High">🔴 High Priority (Critical/Life Threatening)</option>
                        </select>
                    </div>

                    <div className="input-group-full" style={{ marginTop: "20px" }}>
                        <button onClick={handleReset} className="btn btn-decline" style={{ width: "100%", padding: "12px", background: "var(--danger-color)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "bold", cursor: "pointer" }}>
                          Clear Active Dispatch & Reset
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="form-section">
            <h3 className="section-title">
              <span style={{ fontSize: "1.8rem" }}>🚨</span> Dispatch Emergency Unit
            </h3>
            <p className="section-subtitle">Enter the patient's details and GPS coordinates to broadcast an immediate SOS to all available units in the vicinity.</p>
            
            <div className="input-grid">
              <div className="input-group-full">
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Patient Name</label>
                  <input placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} className="form-input" />
              </div>

              <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Longitude (X)</label>
                  <input placeholder="74.8430" value={lng} onChange={e => setLng(e.target.value)} className="form-input" />
              </div>
              
              <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Latitude (Y)</label>
                  <input placeholder="12.8950" value={lat} onChange={e => setLat(e.target.value)} className="form-input" />
              </div>

              <div className="input-group-full">
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Triage Severity Level</label>
                  <select value={severity} onChange={e => setSeverity(e.target.value)} className="form-select">
                    <option value="Low">🟢 Low Priority (Non-Life Threatening)</option>
                    <option value="Medium">🟡 Medium Priority (Urgent Care)</option>
                    <option value="High">🔴 High Priority (Critical/Life Threatening)</option>
                  </select>
              </div>

              <div className="input-group-full" style={{ marginTop: "10px" }}>
                  <button onClick={createAndBroadcastEmergency} disabled={loading} className="primary-btn">
                    {loading ? "Broadcasting to Network..." : "Broadcast SOS to Drivers"}
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Show only if driver assigned but hospital is still null */}
        {emergency && (emergency.status === "PENDING" || !emergency.assignedHospital) && (
          <div className="waiting-card">
            <div className="loader-spinner"></div>
            <h4>Searching for Nearest Responder...</h4>
            <p>Patient: {emergency.patientName}</p>
            <p>Status: {emergency.status}</p>
          </div>
        )}

        {emergency && emergency.assignedHospital && emergency.assignedAmbulance && (
          <div className="tracking-section" style={{ width: "100%" }}>
            <div className="confirmation-card">
              <h3>✅ Dispatch Active</h3>
              <div className="conf-details">
                <p><strong>Ambulance:</strong> {emergency.assignedAmbulance?.vehicleNumber}</p>
                <p><strong>Facility:</strong> {emergency.assignedHospital?.name}</p>
              </div>
            </div>
            <div style={{ marginTop: "20px" }}>
              <TrackAmbulanceWidget emergencyId={emergency._id} />
            </div>
          </div>
        )}

        {/* Only show text sentence if the hospital hasn't accepted yet */}
        {message && (!emergency || !emergency.assignedHospital) && (
          <p className="status-feedback" style={{ gridColumn: "1 / -1" }}>{message}</p>
        )}
      </div>
    </div>
  );
}

export default EmergencyPage;