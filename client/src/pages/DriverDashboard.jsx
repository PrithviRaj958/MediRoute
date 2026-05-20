import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  emitDriverLocation,
  initiateSocketConnection,
  subscribeToPatientLocation,
  unsubscribeFromPatientLocation,
  joinEmergencyRoom
} from "../services/socketService";

function DriverDashboard() {
  const [ambulance, setAmbulance] = useState(null);
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [emergency, setEmergency] = useState(null);
  const [patientLat, setPatientLat] = useState(null);
  const [patientLng, setPatientLng] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isAutoTracking, setIsAutoTracking] = useState(false);

  const token = localStorage.getItem("token");
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);
  const watchId = useRef(null);

  // 🔌 Start socket connection
  useEffect(() => {
    initiateSocketConnection();
  }, []);

  // Load Leaflet dynamically
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

  // 🚑 Fetch ambulance assigned to driver
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
      setLat(res.data.location.coordinates[1]);
      setLng(res.data.location.coordinates[0]);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch emergency details if any
  const fetchEmergency = useCallback(async () => {
    try {
      const emergencyId = localStorage.getItem("emergencyId");
      if (!emergencyId) return;
      
      const res = await axios.get(
        `http://localhost:5000/api/emergencies/${emergencyId}`
      );
      
      if (res.data && res.data.status === "ASSIGNED") {
        setEmergency(res.data);
        setPatientLat(res.data.location.coordinates[1]);
        setPatientLng(res.data.location.coordinates[0]);
        joinEmergencyRoom(emergencyId);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstance.current) {
      const L = window.L;
      const initialLat = lat || 40;
      const initialLng = lng || -74;
      mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(mapInstance.current);
      markersGroup.current = L.layerGroup().addTo(mapInstance.current);
    }
  }, [mapLoaded]);

  // Update map view when location changes
  useEffect(() => {
    if (mapInstance.current && lat && lng) {
      mapInstance.current.setView([lat, lng], 13);
    }
  }, [lat, lng]);

  // Subscribe to patient location updates
  useEffect(() => {
    if (emergency) {
      subscribeToPatientLocation((locationData) => {
        if (locationData.emergencyId === emergency._id) {
          setPatientLat(locationData.lat);
          setPatientLng(locationData.lng);
        }
      });
    }

    return () => {
      unsubscribeFromPatientLocation();
    };
  }, [emergency]);

  // Auto-track driver location
  useEffect(() => {
    if (isAutoTracking && ambulance) {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude);
          setLng(longitude);
          
          // Update backend and emit via socket
          updateLocationBackend(latitude, longitude);
        },
        (error) => {
          console.error("Location error:", error);
          alert("Unable to access your location. Please enable location services.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => {
        if (watchId.current) {
          navigator.geolocation.clearWatch(watchId.current);
        }
      };
    }
  }, [isAutoTracking, ambulance]);

  const updateLocationBackend = async (latitude, longitude) => {
    try {
      const payload = {
        ambulanceId: ambulance._id,
        emergencyId: emergency?._id,
        lng: longitude,
        lat: latitude
      };

      await axios.put(
        "http://localhost:5000/api/ambulances/location",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      emitDriverLocation(payload);
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  // Update map markers
  useEffect(() => {
    if (mapInstance.current && markersGroup.current && lat && lng) {
      const L = window.L;
      markersGroup.current.clearLayers();

      // Add ambulance marker
      L.marker([lat, lng], {
        icon: L.divIcon({
          html: '<div class="map-marker ambulance-marker">🚑</div>',
          className: "custom-leaflet-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      })
        .addTo(markersGroup.current)
        .bindPopup(`<b>Ambulance</b><br/>${ambulance?.vehicleNumber || "My Ambulance"}`);

      // Add patient marker if available
      if (patientLat && patientLng) {
        L.marker([patientLat, patientLng], {
          icon: L.divIcon({
            html: '<div class="map-marker patient-marker">📍</div>',
            className: "custom-leaflet-icon",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup(`<b>Patient</b><br/>${emergency?.patientName || "Patient Location"}`);
      }

      // Add hospital marker if available
      if (emergency?.assignedHospital?.location) {
        const hospLoc = emergency.assignedHospital.location.coordinates;
        L.marker([hospLoc[1], hospLoc[0]], {
          icon: L.divIcon({
            html: "🏥",
            className: "text-2xl",
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        })
          .addTo(markersGroup.current)
          .bindPopup(`<b>Hospital</b><br/>${emergency.assignedHospital.name}`);
      }

      // Fit map bounds
      if (mapInstance.current) {
        const group = L.featureGroup([]);
        if (lat && lng) group.addLayer(L.marker([lat, lng]));
        if (patientLat && patientLng) group.addLayer(L.marker([patientLat, patientLng]));
        if (emergency?.assignedHospital?.location) {
          const hospLoc = emergency.assignedHospital.location.coordinates;
          group.addLayer(L.marker([hospLoc[1], hospLoc[0]]));
        }
        if (group.getLayers().length > 0) {
          mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
      }
    }
  }, [lat, lng, patientLat, patientLng, emergency, ambulance]);

  // 📍 Update location manually
  const updateLocation = async () => {
    try {
      const payload = {
        ambulanceId: ambulance._id,
        emergencyId: emergency?._id,
        lng: parseFloat(lng),
        lat: parseFloat(lat)
      };

      await axios.put(
        "http://localhost:5000/api/ambulances/location",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      emitDriverLocation(payload);
      fetchAmbulance();
    } catch (err) {
      console.error(err);
    }
  };

  // 🚦 Update status
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
    fetchEmergency();
  }, [fetchAmbulance, fetchEmergency]);

  if (!ambulance)
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.card}>
            <h2 style={styles.title}>🚑 Driver Dashboard</h2>

            <div style={styles.info}>
              <p><b>Vehicle:</b> {ambulance.vehicleNumber}</p>
              <p><b>Status:</b> {ambulance.status}</p>
              <p>
                <b>Location:</b>{" "}
                {Number.isFinite(Number(lat)) ? Number(lat).toFixed(4) : lat},{" "}{Number.isFinite(Number(lng)) ? Number(lng).toFixed(4) : lng}
              </p>
              {emergency && (
                <>
                  <p><b>Patient:</b> {emergency.patientName}</p>
                  <p><b>Hospital:</b> {emergency.assignedHospital?.name || "N/A"}</p>
                </>
              )}
            </div>

            <hr />

            <h3 style={styles.subTitle}>📍 Update Location</h3>

            <input
              style={styles.input}
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />

            <button style={styles.primaryBtn} onClick={updateLocation}>
              Update Location Manually
            </button>

            <button
              style={{
                ...styles.primaryBtn,
                background: isAutoTracking ? "#f44336" : "#4caf50",
                marginTop: "10px"
              }}
              onClick={() => setIsAutoTracking(!isAutoTracking)}
            >
              {isAutoTracking ? "🔴 Stop Auto-Track" : "🟢 Start Auto-Track"}
            </button>

            <hr />

            <h3 style={styles.subTitle}>🚦 Update Status</h3>

            <div style={styles.buttonGroup}>
              <button
                style={styles.greenBtn}
                onClick={() => updateStatus("AVAILABLE")}
              >
                Available
              </button>

              <button
                style={styles.orangeBtn}
                onClick={() => updateStatus("BUSY")}
              >
                Busy
              </button>

              <button
                style={styles.redBtn}
                onClick={() => updateStatus("OFFLINE")}
              >
                Offline
              </button>
            </div>
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.mapContainer}>
            <h3 style={styles.mapTitle}>📍 Live Route Tracking</h3>
            <div ref={mapRef} style={styles.map} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    padding: "10px",
    background: "linear-gradient(to right, #e0f7fa, #f5f7fa)",
    overflow: "hidden"
  },

  mainContent: {
    display: "flex",
    gap: "10px",
    height: "100%"
  },

  leftPanel: {
    flex: "0 0 35%",
    overflowY: "auto"
  },

  rightPanel: {
    flex: "1",
    minWidth: 0
  },

  card: {
    padding: "20px",
    borderRadius: "15px",
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center"
  },

  title: {
    marginBottom: "15px",
    color: "#333"
  },

  subTitle: {
    marginTop: "15px",
    marginBottom: "10px",
    color: "#555"
  },

  info: {
    marginBottom: "15px",
    lineHeight: "1.6",
    color: "#444",
    textAlign: "left"
  },

  input: {
    width: "100%",
    padding: "10px",
    margin: "6px 0",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none",
    fontSize: "13px",
    boxSizing: "border-box"
  },

  primaryBtn: {
    width: "100%",
    padding: "10px",
    marginTop: "8px",
    border: "none",
    borderRadius: "8px",
    background: "#2196f3",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px"
  },

  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    gap: "5px"
  },

  greenBtn: {
    flex: 1,
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    background: "#4caf50",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px"
  },

  orangeBtn: {
    flex: 1,
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    background: "#ff9800",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px"
  },

  redBtn: {
    flex: 1,
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    background: "#f44336",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px"
  },

  mapContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    background: "#fff"
  },

  mapTitle: {
    padding: "15px",
    margin: 0,
    background: "#f5f5f5",
    borderBottom: "1px solid #ddd",
    color: "#333"
  },

  map: {
    flex: 1,
    borderRadius: "0 0 15px 15px"
  },

  mapPlaceholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "15px",
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    color: "#999"
  }
};

export default DriverDashboard;