import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
    emitDriverLocation, 
    initiateSocketConnection, 
    getSocket 
} from "../services/socketService";  
import TrackAmbulanceWidget from "../components/Map/TrackAmbulanceWidget";
import "../HospitalPanel.css"; // Reuse the polished dashboard styles

function DriverDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null); 
  // 🔥 NEW: Track if we are waiting for the hospital to confirm
  const [isWaiting, setIsWaiting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const token = localStorage.getItem("token");

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const fetchAmbulance = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/ambulances/my",
        getAuthHeader()
      );
      setAmbulance(res.data);
    } catch (err) {
      console.error("403 Forbidden: The token in your browser is NOT a Driver role.", err);
    }
  }, []);

  useEffect(() => {
    fetchAmbulance();
  }, [fetchAmbulance]);

  useEffect(() => {
    if (!ambulance) return;
    const socket = initiateSocketConnection(); 
    
    if (socket) {
      socket.on("incoming_dispatch_request", (data) => {
        setPendingRequest(data);
      });

      socket.on("handshake_completed", async (data) => {
        if (String(data.ambulanceId) === String(ambulance._id)) {
          // 🔥 FIX: Stop showing the waiting message once confirmed
          setIsWaiting(false); 
          showToast("Hospital Confirmed! Start Navigating.");
          await fetchAmbulance(); 
        }
      });
    }

    return () => {
        socket?.off("incoming_dispatch_request");
        socket?.off("handshake_completed");
    };
  }, [ambulance, fetchAmbulance]);

  const handleAcceptRequest = async () => {
    try {
      // 🔥 Start waiting state
      setIsWaiting(true);

      const res = await axios.post(
        "http://localhost:5000/api/emergencies/driver-accept", 
        { emergencyId: pendingRequest._id, ambulanceId: ambulance._id },
        getAuthHeader()
      );

      setActiveEmergency(res.data.emergency);
      setAmbulance(res.data.ambulance); 
      setPendingRequest(null);

      const socket = getSocket();
      if (socket) {
        socket.emit("driver_accept_emergency", {
            hospitalId: res.data.hospitalId,
            emergencyId: res.data.emergency._id,
            ambulanceId: ambulance._id,
            patientName: res.data.emergency.patientName,
            severity: res.data.emergency.severity
        });
      }
    } catch (err) {
      setIsWaiting(false); // Reset if it fails
      console.error("Accept failed:", err);
    }
  };

  const updateLocation = async () => {
    if (!ambulance) return;
    try {
      const payload = {
        ambulanceId: ambulance._id,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        hospitalId: ambulance.assignedHospitalId || localStorage.getItem("activeHospitalId")
      };
      await axios.put("http://localhost:5000/api/ambulances/location", payload, getAuthHeader());
      emitDriverLocation(payload); 
      fetchAmbulance(); 
    } catch (err) { console.error("Location update failed:", err); }
  };

  const updateStatus = async (status) => {
    try {
      await axios.put("http://localhost:5000/api/ambulances/status", { ambulanceId: ambulance._id, status }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      fetchAmbulance();
    } catch (err) { console.error("Status update failed:", err); }
  };

  const completeDispatch = async () => {
    if (!activeEmergency) return;
    try {
      await axios.post("http://localhost:5000/api/emergencies/complete", 
        { emergencyId: activeEmergency._id }, 
        getAuthHeader()
      );
      setActiveEmergency(null);
      showToast("Dispatch Completed successfully! You are now Available.");
      fetchAmbulance();
    } catch (err) {
      console.error("Failed to complete dispatch:", err);
      showToast("Failed to complete dispatch.");
    }
  };

  if (!ambulance) return <div className="admin-container" style={{ textAlign: "center", marginTop: "50px" }}><h2>Loading Driver Terminal...</h2></div>;

  return (
    <div className="admin-container">
      {toastMessage && (
        <div style={{
            position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
            background: "var(--surface-color)", color: "var(--text-main)", 
            padding: "15px 30px", borderRadius: "var(--radius-lg)", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 9999,
            borderLeft: "5px solid var(--primary-color)", fontWeight: "bold",
            animation: "slideDown 0.3s ease-out"
        }}>
            {toastMessage}
        </div>
      )}

      <header className="admin-header">
          <h1>🚑 Driver Terminal</h1>
          <div className="hospital-badge">
              {ambulance.vehicleNumber} | <span style={{ color: ambulance.status === 'AVAILABLE' ? 'var(--success-color)' : 'var(--danger-color)' }}>{ambulance.status}</span>
          </div>
      </header>
      
      {/* 1. Request Alert (Glassmorphism Modal) */}
      {pendingRequest && !isWaiting && (
        <div className="emergency-modal-overlay">
          <div className="emergency-modal" style={{ borderTop: "6px solid var(--danger-color)" }}>
            <h2>🚨 NEW DISPATCH</h2>
            <div className="patient-info">
              <p><strong>Patient:</strong> {pendingRequest.patientName}</p>
              <p><strong>Severity:</strong> {pendingRequest.severity || "High"}</p>
            </div>
            <div className="handshake-buttons">
              <button onClick={handleAcceptRequest} className="btn btn-accept">ACCEPT DISPATCH</button>
              <button onClick={() => setPendingRequest(null)} className="btn btn-decline">Ignore</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Waiting Message: Shows after Accept is clicked */}
      {isWaiting && !activeEmergency?.assignedHospital && (
        <div className="success-banner" style={{ background: "var(--secondary-color)", color: "var(--primary-color)", borderLeftColor: "var(--primary-color)" }}>
            ⏳ Request Accepted! Waiting for Hospital routing confirmation...
        </div>
      )}

      <main className="dashboard-content">
        <div className="dashboard-grid">
            <section className="control-card">
                <h3>🚦 Duty Status</h3>
                <div className="button-group" style={{ flexDirection: "column", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={() => updateStatus("AVAILABLE")}>Set Available</button>
                    <button className="btn btn-danger" style={{ background: "var(--warning-color)" }} onClick={() => updateStatus("BUSY")}>Set Busy</button>
                    <button className="btn btn-decline" onClick={() => updateStatus("OFFLINE")}>Go Offline</button>
                </div>
            </section>

            <section className="control-card">
                <h3>📍 Manual GPS Override</h3>
                <div className="input-group">
                    <label>Longitude</label>
                    <input className="input-field" placeholder="77.5946" value={lng} onChange={(e) => setLng(e.target.value)} />
                </div>
                <div className="input-group">
                    <label>Latitude</label>
                    <input className="input-field" placeholder="12.9716" value={lat} onChange={(e) => setLat(e.target.value)} />
                </div>
                <button onClick={updateLocation} className="btn btn-primary" style={{ width: "100%" }}>Transmit Coordinates</button>
            </section>
        </div>

        {/* 3. Navigation Link (Shows only after hospital is assigned) */}
        {activeEmergency && (
          <section className="map-card" style={{ marginTop: "30px", padding: 0, overflow: "hidden" }}>
              <div className="map-header" style={{ padding: "20px 30px", marginBottom: 0, borderBottom: "1px solid var(--border-color)", background: "var(--bg-color)" }}>
                  <h3 style={{ color: "var(--danger-color)", margin: 0 }}>📍 Active Navigation: {activeEmergency.patientName}</h3>
                  <button onClick={completeDispatch} className="btn btn-add" style={{ padding: "8px 16px", background: "var(--success-color)", color: "white" }}>
                      Dispatching Completed ✅
                  </button>
              </div>
              <div style={{ padding: "20px" }}>
                  {activeEmergency.assignedHospital && (
                      <p style={{ marginBottom: "20px", fontSize: "1.1rem" }}>
                          <strong>Destination:</strong> {activeEmergency.assignedHospital.name}
                      </p>
                  )}
                  <TrackAmbulanceWidget emergencyId={activeEmergency._id} />
              </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DriverDashboard;