import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { initiateSocketConnection, subscribeToAmbulanceMovement } from "../services/socketService";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function TrackAmbulance() {
  const [emergency, setEmergency] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);

  const emergencyId = localStorage.getItem("emergencyId");

  // 1. Initial Fetch and Socket Setup
  useEffect(() => {
    const hId = localStorage.getItem("hospitalId");
    initiateSocketConnection(hId);

    // Listen for real-time socket updates from Driver
    subscribeToAmbulanceMovement((data) => {
      console.log("Ambulance moved in real-time:", data);
      setLiveLocation({ lat: data.lat, lng: data.lng });
    });

    fetchEmergency();
  }, []);

  // 2. Database Backup: Refresh emergency data every 3 seconds
  useEffect(() => {
    fetchEmergency();
    const interval = setInterval(fetchEmergency, 3000); 
    return () => clearInterval(interval);
  }, []);

  const fetchEmergency = async () => {
    if (!emergencyId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/emergencies/${emergencyId}`);
      setEmergency(res.data);
    } catch (err) {
      console.error("Error fetching emergency details:", err);
    }
  };

  if (!emergency) return <h2>Loading emergency data...</h2>;

  if (!emergency.assignedAmbulance) {
    return <h2>Waiting for ambulance assignment...</h2>;
  }

  const amb = emergency.assignedAmbulance;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚑 Ambulance Tracking</h2>
      <div style={{ marginBottom: '10px' }}>
        <strong>Vehicle:</strong> {amb.vehicleNumber} | 
        <strong> Status:</strong> {amb.status}
      </div>

      <MapContainer
        center={[
          amb.location.coordinates[1],
          amb.location.coordinates[0]
        ]}
        zoom={14}
        style={{ height: "450px", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Marker
          position={[
            liveLocation?.lat || amb.location.coordinates[1],
            liveLocation?.lng || amb.location.coordinates[0]
          ]}
        >
          <Popup>
            🚑 {amb.vehicleNumber} <br />
            {liveLocation ? "Live Tracking Active" : "Synced with Database"}
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
}

export default TrackAmbulance;