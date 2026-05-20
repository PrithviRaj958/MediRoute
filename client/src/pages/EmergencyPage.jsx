import { useState, useEffect } from "react";
import axios from "axios";
import "../Emergency.css";
import { getSocket, initiateSocketConnection } from "../services/socketService"; 

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
      {(!emergency) && (
        <div className="form-section">
          <h3 className="section-title">🚨 Create & Broadcast Incident</h3>
          <div className="input-group">
            <input placeholder="Patient Name" onChange={e => setName(e.target.value)} className="form-input" />
            <div className="coord-row">
              <input placeholder="Longitude" onChange={e => setLng(e.target.value)} className="form-input" />
              <input placeholder="Latitude" onChange={e => setLat(e.target.value)} className="form-input" />
            </div>
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="form-select">
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <button onClick={createAndBroadcastEmergency} disabled={loading} className="primary-btn">
              {loading ? "Broadcasting..." : "Broadcast to Drivers"}
            </button>
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
        <div className="tracking-section">
          <div className="confirmation-card">
            <h3>✅ Dispatch Active</h3>
            <div className="conf-details">
              <p><strong>Ambulance:</strong> {emergency.assignedAmbulance?.vehicleNumber}</p>
              <p><strong>Facility:</strong> {emergency.assignedHospital?.name}</p>
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <button 
                className="primary-btn" 
                onClick={() => window.open(`/track/${emergency._id}`, '_blank')}
            >
                Open Live Tracking 🗺️
            </button>
          </div>
        </div>
      )}

      {/* Only show text sentence if the hospital hasn't accepted yet */}
      {message && (!emergency || !emergency.assignedHospital) && (
        <p className="status-feedback">{message}</p>
      )}
    </div>
  );
}

export default EmergencyPage;