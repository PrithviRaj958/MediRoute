import { useEffect, useState, useCallback } from "react";
import axios from "axios";

function DriverDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");

  const token = localStorage.getItem("token");

  // 🔹 Fetch ambulance assigned to driver
const fetchAmbulance = useCallback(async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/ambulances/my",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setAmbulance(res.data);

  } catch (err) {
    console.error(err);
  }
}, [token]);

  // 🔹 Update ambulance location
  const updateLocation = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/ambulances/location",
        {
          ambulanceId: ambulance._id,
          lng: parseFloat(lng),
          lat: parseFloat(lat)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchAmbulance(); // refresh data

    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Update status
  const updateStatus = async (status) => {
    try {
      await axios.put(
        "http://localhost:5000/api/ambulances/status",
        {
          ambulanceId: ambulance._id,
          status
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchAmbulance();

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
  fetchAmbulance();
}, [fetchAmbulance]);

  if (!ambulance) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>🚑 Driver Dashboard</h2>

      <hr />

      <p><b>Vehicle Number:</b> {ambulance.vehicleNumber}</p>
      <p><b>Status:</b> {ambulance.status}</p>

      <p>
        <b>Location:</b>{" "}
        {ambulance.location.coordinates[1]},{" "}
        {ambulance.location.coordinates[0]}
      </p>

      <hr />

      <h3>📍 Update Location</h3>

      <input
        placeholder="Longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
      />

      <input
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
      />

      <br /><br />

      <button onClick={updateLocation}>
        Update Location
      </button>

      <hr />

      <h3>🚦 Update Status</h3>

      <button onClick={() => updateStatus("AVAILABLE")}>
        Set Available
      </button>

      <button onClick={() => updateStatus("BUSY")}>
        Set Busy
      </button>

      <button onClick={() => updateStatus("OFFLINE")}>
        Set Offline
      </button>
    </div>
  );
}

export default DriverDashboard;