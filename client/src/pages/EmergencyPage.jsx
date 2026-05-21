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
    }

    return () => {
      if (socket) {
        socket.off("driver_confirmed_assignment");
        socket.off("handshake_completed");
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
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="emergency-container">
      <div className="emergency-grid">
        <div className="form-section">
          <h3 className="section-title">
            <span style={{ fontSize: "1.8rem" }}>🚨</span> Dispatch Emergency Unit
          </h3>
          <p className="section-subtitle">Enter the patient's details and GPS coordinates to broadcast an immediate SOS to all available units in the vicinity.</p>
          
          <div className="input-grid">
            <div className="input-group-full">
                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Patient Name</label>
                <input placeholder="e.g. John Doe" onChange={e => setName(e.target.value)} className="form-input" disabled={!!emergency} />
            </div>

            <div>
                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Longitude (X)</label>
                <input placeholder="77.5946" onChange={e => setLng(e.target.value)} className="form-input" disabled={!!emergency} />
            </div>
            
            <div>
                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Latitude (Y)</label>
                <input placeholder="12.9716" onChange={e => setLat(e.target.value)} className="form-input" disabled={!!emergency} />
            </div>

            <div className="input-group-full">
                <label style={{ display: "block", marginBottom: "8px", color: "var(--text-main)", fontWeight: "600" }}>Triage Severity Level</label>
                <select value={severity} onChange={e => setSeverity(e.target.value)} className="form-select" disabled={!!emergency}>
                <option value="Low">🟢 Low Priority (Non-Life Threatening)</option>
                <option value="Medium">🟡 Medium Priority (Urgent Care)</option>
                <option value="High">🔴 High Priority (Critical/Life Threatening)</option>
                </select>
            </div>

            <div className="input-group-full" style={{ marginTop: "10px" }}>
                <button onClick={createAndBroadcastEmergency} disabled={loading || !!emergency} className="primary-btn">
                {loading ? "Broadcasting to Network..." : (emergency ? "Dispatch Active - Form Locked" : "Broadcast SOS to Drivers")}
                </button>
                {emergency && (
                <button onClick={() => setEmergency(null)} className="btn btn-decline" style={{ marginTop: "15px", width: "100%", padding: "12px" }}>
                    Clear Active Dispatch & Reset
                </button>
                )}
            </div>
          </div>
        </div>

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
          <div className="tracking-section">
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