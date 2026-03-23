import { useState } from "react";
import axios from "axios";

function EmergencyPage() {
  const [name, setName] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [emergencyId, setEmergencyId] = useState("");
  const [message, setMessage] = useState("");

  const createEmergency = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/emergencies",
      {
        patientName: name,
        lng: parseFloat(lng),
        lat: parseFloat(lat)
      }
    );

    localStorage.setItem("emergencyId", res.data._id);
    setEmergencyId(res.data._id);
    setMessage("Emergency created!");
  };

  const assignAmbulance = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/emergencies/assign",
      { emergencyId }
    );

    setMessage(res.data.message);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>🚨 Emergency Request</h2>

      <input placeholder="Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Longitude" onChange={e => setLng(e.target.value)} />
      <input placeholder="Latitude" onChange={e => setLat(e.target.value)} />

      <br /><br />

      <button onClick={createEmergency}>Create Emergency</button>
      <button onClick={assignAmbulance}>Assign Ambulance</button>

      <p>{message}</p>
    </div>
  );
}

export default EmergencyPage;