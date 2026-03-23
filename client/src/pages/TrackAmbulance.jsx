import { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function TrackAmbulance() {
  const [emergency, setEmergency] = useState(null);

  const emergencyId = localStorage.getItem("emergencyId");

  const fetchEmergency = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/emergencies/${emergencyId}`
      );

      setEmergency(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmergency();

    const interval = setInterval(fetchEmergency, 3000); // 🔥 refresh every 3 sec

    return () => clearInterval(interval);
  }, []);

  if (!emergency) return <h2>Loading...</h2>;

  if (!emergency.assignedAmbulance) {
    return <h2>Waiting for ambulance assignment...</h2>;
  }

  const amb = emergency.assignedAmbulance;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚑 Ambulance Tracking</h2>

      <MapContainer
        center={[
          amb.location.coordinates[1],
          amb.location.coordinates[0]
        ]}
        zoom={13}
        style={{ height: "400px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            amb.location.coordinates[1],
            amb.location.coordinates[0]
          ]}
        >
          <Popup>
            🚑 {amb.vehicleNumber}
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
}

export default TrackAmbulance;