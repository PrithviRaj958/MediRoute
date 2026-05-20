import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  initiateSocketConnection,
  joinEmergencyRoom,
  emitPatientLocation,
  subscribeToDriverLocation,
  unsubscribeFromDriverLocation
} from "../services/socketService";
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
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [driverLat, setDriverLat] = useState(null);
  const [driverLng, setDriverLng] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);
  const watchId = useRef(null);

  const API_BASE = "http://localhost:5000/api";

  // Initialize socket connection for live updates
  useEffect(() => {
    initiateSocketConnection();
  }, []);

  // Loading leaflet dynamically
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map when an emergency exists
  useEffect(() => {
    if (mapLoaded && emergency && mapRef.current && !mapInstance.current) {
      const L = window.L;
      mapInstance.current = L.map(mapRef.current).setView([lat || 0, lng || 0], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(mapInstance.current);
      markersGroup.current = L.layerGroup().addTo(mapInstance.current);
    }
  }, [mapLoaded, emergency]);

  // Join emergency room and subscribe to driver location
  useEffect(() => {
    if (emergency?.status === "ASSIGNED") {
      joinEmergencyRoom(emergency._id);
      
      // Subscribe to ambulance movement updates from driver
      subscribeToDriverLocation((locationData) => {
        if (locationData.emergencyId === emergency._id || !locationData.emergencyId) {
          setDriverLat(locationData.lat);
          setDriverLng(locationData.lng);
        }
      });
    }

    return () => {
      unsubscribeFromDriverLocation();
    };
  }, [emergency]);

  // Start tracking patient location
  useEffect(() => {
    if (isTrackingLocation && emergency?.status === "ASSIGNED") {
      const startLocationTracking = () => {
        if (!navigator.geolocation) {
          setMessage("Geolocation is not supported by your browser");
          return;
        }

        watchId.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLat(latitude);
            setLng(longitude);

            // Update location on backend and emit via socket
            updatePatientLocationLive(latitude, longitude);
            emitPatientLocation({
              emergencyId: emergency._id,
              lat: latitude,
              lng: longitude,
              patientName: emergency.patientName
            });
          },
          (error) => {
            console.error("Location error:", error);
            setMessage("Unable to access your location. Please enable location services.");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      };

      startLocationTracking();

      return () => {
        if (watchId.current) {
          navigator.geolocation.clearWatch(watchId.current);
        }
      };
    }
  }, [isTrackingLocation, emergency]);

  // Update patient location on backend
  const updatePatientLocationLive = async (latitude, longitude) => {
    try {
      await axios.put(`${API_BASE}/emergencies/location/update`, {
        emergencyId: emergency._id,
        lat: latitude,
        lng: longitude
      });
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  // Update markers
  useEffect(() => {
    if (mapInstance.current && markersGroup.current && emergency) {
      const L = window.L;
      markersGroup.current.clearLayers();
      const markers = [];

      // Add patient marker
      if (lat && lng) {
        markers.push(L.marker([lat, lng], {
          icon: L.divIcon({
            html: '<div class="map-marker patient-marker">📍</div>',
            className: "custom-leaflet-icon",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup("Patient Location"));
      }

      // Add ambulance marker
      if (emergency.assignedAmbulance?.location) {
        const ambLoc = emergency.assignedAmbulance.location.coordinates;
        markers.push(L.marker([ambLoc[1], ambLoc[0]], {
          icon: L.divIcon({
            html: '<div class="map-marker ambulance-marker">🚑</div>',
            className: "custom-leaflet-icon",
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup("Assigned Ambulance"));
      }

      // Add driver marker if available
      if (driverLat && driverLng) {
        markers.push(L.marker([driverLat, driverLng], {
          icon: L.divIcon({
            html: '<div class="map-marker driver-marker">🚗</div>',
            className: "custom-leaflet-icon",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup("Driver Location"));
      }

      // Add hospital marker
      if (emergency.assignedHospital?.location) {
        const hospLoc = emergency.assignedHospital.location.coordinates;
        markers.push(L.marker([hospLoc[1], hospLoc[0]], {
          icon: L.divIcon({
            html: "🏥",
            className: "text-2xl",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup(`Hospital: ${emergency.assignedHospital.name}`));
      }

      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    }
  }, [emergency, driverLat, driverLng, lat, lng]);

  const createEmergency = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/emergencies`, {
        patientName: name,
        lng: parseFloat(lng),
        lat: parseFloat(lat),
        severity: severity
      });
      localStorage.setItem("emergencyId", res.data._id);
      setEmergency(res.data);
      setMessage("Emergency created! Fetching nearby ambulances...");
      const ambulancesRes = await axios.get(
        `${API_BASE}/ambulances/nearest?lat=${lat}&lng=${lng}`
      );
      setNearbyAmbulances(
        ambulancesRes.data
          ? Array.isArray(ambulancesRes.data)
            ? ambulancesRes.data
            : [ambulancesRes.data]
          : []
      );
    } catch (err) {
      setMessage("Error creating emergency: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignAmbulance = async (ambulanceId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/emergencies/assign`, {
        emergencyId: emergency._id,
        ambulanceId,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });

      setMessage(res.data.message);
      setEmergency(res.data.emergency);
      setIsTrackingLocation(true); // Start tracking once ambulance is assigned
    } catch (err) {
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
            <input
              placeholder="Patient Name"
              onChange={e => setName(e.target.value)}
              className="form-input"
            />
            <div className="coord-row">
              <input
                placeholder="Longitude"
                onChange={e => setLng(e.target.value)}
                className="form-input"
              />
              <input
                placeholder="Latitude"
                onChange={e => setLat(e.target.value)}
                className="form-input"
              />
            </div>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value)}
              className="form-select"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority (Urgent)</option>
            </select>
            <button
              onClick={createEmergency}
              disabled={loading}
              className="primary-btn"
            >
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
                  <button
                    onClick={() => assignAmbulance(amb._id)}
                    className="assign-btn"
                  >
                    Dispatch
                  </button>
                </div>
              ))
            ) : (
              <p className="no-data">Searching for nearby units...</p>
            )}
          </div>
        </div>
      )}

      {emergency && (
        <div className="tracking-section">
          <div className="confirmation-card">
            <h3>{emergency.status === "ASSIGNED" ? "✅ Dispatch Active" : "🕒 Waiting for Dispatch"}</h3>
            <div className="conf-details">
              <p>
                <strong>Patient Location:</strong>{" "}
                {lat && lng ? `${lat.toFixed ? lat.toFixed(4) : lat}, ${lng.toFixed ? lng.toFixed(4) : lng}` : "Not available"}
              </p>
              {emergency.status === "ASSIGNED" && (
                <>
                  <p>
                    <strong>Ambulance:</strong>{" "}
                    {emergency.assignedAmbulance?.vehicleNumber || "Dispatching..."}
                  </p>
                  <p>
                    <strong>Facility:</strong>{" "}
                    {emergency.assignedHospital?.name || "Evaluating Best ER..."}
                  </p>
                  <p>
                    <strong>Tracking Status:</strong>{" "}
                    {isTrackingLocation ? "📍 LIVE" : "⏸ Ready"}
                  </p>
                </>
              )}
            </div>
          </div>
          <div ref={mapRef} className="live-map-view" />
          {emergency.status === "PENDING" && (
            <p className="status-feedback">Emergency logged. Waiting for ambulance assignment...</p>
          )}
        </div>
      )}

      {message && <p className="status-feedback">{message}</p>}
    </div>
  );
}

export default EmergencyPage;