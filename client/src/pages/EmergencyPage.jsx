import { useEffect, useState, useRef } from "react";
import axios from "axios";
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
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);

  const API_BASE = "http://localhost:5000/api";

  //loading leaflet dynamically
  useEffect( () => {
    if(window.L) { setMapLoaded(true); return; }
    const link = document.createElement("link");                  //this part manually creates a <Link> tag
    link.rel = "stylesheet";                                     //and shoves it into the <head> of the 
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";//document to load leaflet css
    document.head.appendChild(link);
    const script = document.createElement("script");              //same for leaflet js
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";  
    script.async = true;
    script.onload = () => setMapLoaded(true);   //when leaflet is loaded, we set mapLoaded to true
    document.head.appendChild(script);
  },[]);

  //initializes the map once emergency is assigned
  useEffect(() => {
    if(mapLoaded && emergency?.status === "ASSIGNED" && mapRef.current && !mapInstance.current ) {
      const L = window.L;
      mapInstance.current = L.map(mapRef.current).setView([lat,lng],13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  //fetches actual map
        attribution : "© OpenStreetMap"
    }).addTo(mapInstance.current);
      markersGroup.current = L.layerGroup().addTo(mapInstance.current); // this is like a white board upadated route 
    }                                                                  // can be drawn again without effecting map
  }, [mapLoaded, emergency]);

  //Update markers
  useEffect( () => {
    if(mapInstance.current && markersGroup.current && emergency?.status === "ASSIGNED") {
      const L = window.L;
      markersGroup.current.clearLayers(); //clear old markers

      //add patient marker
      L.marker([lat, lng], {
        icon: L.divIcon({ html:'<div class="map-marker patient-marker">🏠</div>',
          className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 32] })
      }).addTo(markersGroup.current).bindPopup("Patient Location");

      //add ambulance marker
      if (emergency.assignedAmbulance?.location) {
        const ambLoc = emergency.assignedAmbulance.location.coordinates;
        L.marker([ambLoc[1], ambLoc[0]], {
          icon: L.divIcon({ html: '<div class="map-marker ambulance-marker">🚑</div>', 
            className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 16] })
        }).addTo(markersGroup.current).bindPopup("Assigned Ambulance");
      }
      //add hospital marker
      if (emergency.assignedHospital?.location) {
        const hospLoc = emergency.assignedHospital.location.coordinates;
        L.marker([hospLoc[1], hospLoc[0]], {
          icon: L.divIcon({ html: '🏥', className: 'text-2xl', iconSize: [16, 30] })
        }).addTo(markersGroup.current).bindPopup(`Hospital: ${emergency.assignedHospital.name}`);
      }
  }
}, [emergency]);

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
          <div ref={mapRef} className="live-map-view" />
        </div>
      )}

      {message && <p className="status-feedback">{message}</p>}
    </div>
  );
}

export default EmergencyPage;