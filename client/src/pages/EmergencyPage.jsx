import { useEffect, useState, useRef } from "react";
import axios from "axios";
import MapView from "../components/MapView";
import "../Emergency.css";

function EmergencyPage() {
  const [name, setName] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [severity, setSeverity] = useState("Medium");
  
  const [emergency, setEmergency] = useState(null);
  const [nearbyAmbulances, setNearbyAmbulances] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://localhost:5000/api";
    

  const createEmergency = async () => {
    setLoading(true);
    try{
    const res = await axios.post(
      `${API_BASE}/emergencies`,
      {
        patientName: name,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        severity: severity
      }
    );
    localStorage.setItem("emergencyId", res.data._id);
    setEmergency(res.data);
    setMessage("Emergency created! Fetching nearby ambulances...");
    const ambulancesRes = await axios.get(
      `${API_BASE}/ambulances/nearest?lat=${lat}&lng=${lng}`
    );
    setNearbyAmbulances(ambulancesRes.data ? (Array.isArray(ambulancesRes.data) ? ambulancesRes.data : [ambulancesRes.data]) : []);
} catch(err){
    setMessage("Error creating emergency: " + err.message);
  } finally {
    setLoading(false);
  }
}

  const assignAmbulance = async (ambulanceId) => {
    setLoading(true);
    try{
    const res = await axios.post(
      `${API_BASE}/emergencies/assign`,
      { emergencyId: emergency._id,
        ambulanceId,
        lat: parseFloat(lat),
          lng: parseFloat(lng) 
      }
    );

    setMessage(res.data.message);
    setEmergency(res.data.emergency);
  } catch(err){
    setMessage("Error assigning ambulance: " + err.message);  
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="emergency-container">
      {(!emergency || emergency.status === "PENDING") && (
        <div className="form-section">
          <h3 className="section-title">🚨 Log Incident</h3>
          <div className="input-group">
            <input placeholder="Patient Name" onChange={e => setName(e.target.value)} className="form-input" />
            <div className="coord-row">
              <input placeholder="Longitude" onChange={e => setLng(e.target.value)} className="form-input" />
              <input placeholder="Latitude" onChange={e => setLat(e.target.value)} className="form-input" />
            </div>
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="form-select">
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority (Urgent)</option>
            </select>
            <button onClick={createEmergency} disabled={loading} className="primary-btn">
              {loading ? "Processing..." : "Create Emergency"}
            </button>
          </div>
        </div>
      )}

      {emergency && emergency.status === "PENDING" && (
        <div className="ambulance-list-section">
          <h4 className="list-title">Nearby Available Units</h4>
          <div className="ambulance-list">
            {nearbyAmbulances.length > 0 ? (
              nearbyAmbulances.map(amb => (
                <div key={amb._id} className="ambulance-card">
                  <div className="amb-meta">
                    <span className="amb-id">{amb.vehicleNumber}</span>
                    <span className="amb-status">{amb.status}</span>
                  </div>
                  <button onClick={() => assignAmbulance(amb._id)} className="assign-btn">Dispatch</button>
                </div>
              ))
            ) : (
              <p className="no-data">Searching for nearby units...</p>
            )}
          </div>
        </div>
      )}

      {emergency && emergency.status === "ASSIGNED" && (
        <div className="tracking-section">
          <div className="confirmation-card">
            <h3>✅ Dispatch Active</h3>
            <div className="conf-details">
              <p><strong>Ambulance:</strong> {emergency.assignedAmbulance?.vehicleNumber || "Dispatching..."}</p>
              <p><strong>Facility:</strong> {emergency.assignedHospital?.name || "Evaluating Best ER..."}</p>
            </div>
          </div>
          <MapView emergency={emergency} lat={lat} lng={lng} />
        </div>
      )}

      {message && <p className="status-feedback">{message}</p>}
    </div>
  );
}

export default EmergencyPage;