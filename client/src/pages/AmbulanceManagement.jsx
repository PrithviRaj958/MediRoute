import { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function AmbulanceManagement() {

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [ambulances, setAmbulances] = useState([]);

  const API = "http://localhost:5000/api/ambulances";

  const fetchAmbulances = async () => {
    try {
      const res = await axios.get(API);
      setAmbulances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addAmbulance = async () => {
    try {
      await axios.post(API, { vehicleNumber });
      setVehicleNumber("");
      fetchAmbulances();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h2>Ambulance Management</h2>

      <input
        placeholder="Vehicle Number"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
      />

      <button onClick={addAmbulance}>Add Ambulance</button>

      <h3>Ambulance Map</h3>

      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={12}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {ambulances.map((a) => (
          <Marker
            key={a._id}
            position={[a.location.coordinates[1], a.location.coordinates[0]]}
          >
            <Popup>
              🚑 {a.vehicleNumber} <br />
              Status: {a.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </div>
  );
}

export default AmbulanceManagement;