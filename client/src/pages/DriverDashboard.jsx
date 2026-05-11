import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
    emitDriverLocation, 
    initiateSocketConnection, 
    getSocket 
} from "../services/socketService";  
import MapView from "../components/MapView"; 

function DriverDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null); 
  // 🔥 NEW: Track if we are waiting for the hospital to confirm
  const [isWaiting, setIsWaiting] = useState(false);

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
          alert("Hospital Confirmed! Start Navigating.");
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
            patientName: res.data.emergency.patientName
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

  if (!ambulance) return <h2>Loading Driver Dashboard...</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>🚑 Driver Dashboard</h2>
      
      {/* 1. Request Alert */}
      {pendingRequest && !isWaiting && (
        <div style={{ background: "#fff3f3", padding: "20px", border: "2px solid #ff4d4d", borderRadius: "8px", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "#d32f2f" }}>🚨 New Emergency Nearby!</h3>
            <p><strong>Patient:</strong> {pendingRequest.patientName}</p>
            <button onClick={handleAcceptRequest} style={{ background: "#2e7d32", color: "white", padding: "10px 20px", border: "none", cursor: "pointer", borderRadius: "4px" }}>ACCEPT REQUEST</button>
            <button onClick={() => setPendingRequest(null)} style={{ background: "#ccc", marginLeft: "10px", padding: "10px 20px", border: "none", borderRadius: "4px" }}>Ignore</button>
        </div>
      )}

      {/* 🔥 2. Waiting Message: Shows after Accept is clicked */}
      {isWaiting && !activeEmergency?.assignedHospital && (
        <div style={{ background: "#e3f2fd", padding: "20px", border: "2px solid #2196f3", borderRadius: "8px", marginBottom: "20px", textAlign: 'center' }}>
            <div className="loader" style={{ marginBottom: '10px' }}>⏳</div>
            <h3 style={{ margin: 0, color: "#1976d2" }}>Request Accepted!</h3>
            <p>Waiting for Hospital to confirm bed availability...</p>
        </div>
      )}

      <div className="hospital-badge">
          Vehicle: <strong>{ambulance.vehicleNumber}</strong> | 
          Status: <strong style={{ color: ambulance.status === 'AVAILABLE' ? 'green' : 'red' }}>{ambulance.status}</strong>
      </div>

      <hr />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
          <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
      </div>
      <button onClick={updateLocation} className="btn-add">Transmit New Location</button>

      <h3>🚦 Availability</h3>
      <button onClick={() => updateStatus("AVAILABLE")}>Available</button>
      <button onClick={() => updateStatus("BUSY")}>Busy</button>
      <button onClick={() => updateStatus("OFFLINE")}>Offline</button>

      {/* 3. Navigation Map (Shows only after hospital is assigned) */}
      {activeEmergency && (
        <div className="driver-map-section" style={{ marginTop: "30px", borderTop: "3px solid #ff4d4d", paddingTop: "20px" }}>
            <h2 style={{ color: "#d32f2f" }}>📍 Navigating to: {activeEmergency.patientName}</h2>
            {/* Added hospital name if available */}
            {activeEmergency.assignedHospital && (
                <p><strong>Destination:</strong> {activeEmergency.assignedHospital.name}</p>
            )}
            <MapView 
                emergency={activeEmergency} 
                lat={activeEmergency.location.coordinates[1]} 
                lng={activeEmergency.location.coordinates[0]} 
            />
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;