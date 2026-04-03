import { useState, useEffect } from 'react';
import axios from 'axios';
import '../HospitalPanel.css';
import TrackAmbulance from './TrackAmbulance';
import { 
    initiateSocketConnection, 
    disconnectSocket, 
    subscribeToEmergencies, 
    acceptEmergencyhandshake, 
    getSocket, 
    subscribeToAmbulanceMovement 
} from '../services/socketService';

const HospitalPanel = () => {
    const [hospital, setHospital] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [updateValue, setUpdateValue] = useState(1);  
    const [incomingEmergency, setIncomingEmergency] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [ambulancePos, setAmbulancePos] = useState(null);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        const fetchHospital = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5000/api/hospitals/my-hospital", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const hospitalData = res.data;

                if (hospitalData && hospitalData._id) {
                    setHospital(hospitalData);
                    setLoading(false);
                    
                    // 1. Join the socket room for this hospital
                    initiateSocketConnection(hospitalData._id);

                    // 2. Listen for new emergencies
                    subscribeToEmergencies((data) => {
                        console.log('🚨 Emergency alert received:', data);
                        setIncomingEmergency(data);
                    });

                    // 3. Listen for live ambulance movement
                    subscribeToAmbulanceMovement((data) => {
                        console.log("🚑 Ambulance moved:", data);
                        setAmbulancePos({ lat: data.lat, lng: data.lng });
                    });

                } else {
                    throw new Error("Hospital data is empty or invalid");
                }
            } catch (err) {
                console.error("Fetch Error:", err);
                setError("Failed to fetch hospital data");
                setLoading(false);
            }
        };

        fetchHospital();
        return () => disconnectSocket();
    }, []);

    const handleUpdate = async (action, customValue = null) => {
        try {
            const token = localStorage.getItem("token");
            const amount = Number(customValue || updateValue);
            const res = await axios.put(`http://localhost:5000/api/hospitals/update-beds`, 
                { action, availableBeds: amount }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHospital(res.data.hospital);
        } catch (err) {
            setError("Failed to update bed availability");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleAccepthandshake = async () => {
        if (!incomingEmergency) return;
        localStorage.setItem("emergencyId", incomingEmergency.requestId);
        // Trigger socket handshake
        acceptEmergencyhandshake(incomingEmergency.requestId, hospital._id);
        
        // Update local DB
        await handleUpdate('decrement', 1); 
        
        setIncomingEmergency(null);
        setSuccessMsg("✅ Emergency Accepted. Tracking Ambulance...");
        setIsTracking(true); // Show the map
        
        setTimeout(() => setSuccessMsg(""), 4000);
    };

    const handleDeclinehandshake = () => {
        const socket = getSocket();
        if (socket) {
            socket.emit("hospital_decline_handshake", { 
                requestId: incomingEmergency.requestId,
                hospitalId: hospital._id
            });
        }
        setIncomingEmergency(null);
    };

    if (loading) return <div className="loader">Loading Dashboard...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    return (
        <div className="admin-container">
            {successMsg && <div className="success-banner">{successMsg}</div>}

            {incomingEmergency && (
                <div className="emergency-modal-overlay">
                    <div className="emergency-modal">
                        <h2>🚨 EMERGENCY REQUEST</h2>
                        <div className="patient-info">
                            <p><strong>Patient:</strong> {incomingEmergency.patientName}</p>
                            <p><strong>Severity:</strong> {incomingEmergency.severity}</p>
                        </div>
                        <div className="handshake-buttons">
                            <button 
                                className="btn btn-accept" 
                                disabled={hospital?.availableBeds <= 0} 
                                onClick={handleAccepthandshake}
                                style={{ opacity: hospital?.availableBeds <= 0 ? 0.5 : 1 }}
                            >
                                {hospital?.availableBeds <= 0 ? "No Beds Available" : "Accept & Reserve Bed"}
                            </button>
                            <button className="btn btn-decline" onClick={handleDeclinehandshake}>Decline</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="admin-header">
                <h1>MediRoute Admin</h1>
                <div className="hospital-badge">{hospital?.name}</div>
            </header>

            <main className="dashboard-content">
                <div className="dashboard-grid">
                    <section className="stats-card">
                        <h3>Bed Occupancy</h3>
                        <div className="bed-display">
                            <span className="count">{hospital?.availableBeds}</span>
                            <span className="label">Available / {hospital?.totalBeds} Total</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${(hospital?.availableBeds / hospital?.totalBeds) * 100}%` }}
                            ></div>
                        </div>
                    </section>

                    <section className="control-card">
                        <h3>Update Availability</h3>
                        <div className="input-group">
                            <label>Quantity</label>
                            <input 
                                type="number" 
                                value={updateValue} 
                                onChange={(e) => setUpdateValue(e.target.value)}
                                min="1"
                            />
                        </div>
                        <div className="button-group">
                            <button className="btn btn-add" onClick={() => handleUpdate('increment')}>Add Beds</button>
                            <button className="btn btn-remove" onClick={() => handleUpdate('decrement')}>Remove Beds</button>
                        </div>
                    </section>
                </div>

                {isTracking && (
                    <section className="live-map-section">
                        <div className="map-card">
                            <div className="map-header">
                                <h3>🚑 Incoming Ambulance Live Feed</h3>
                                <button className="btn-close-map" onClick={() => setIsTracking(false)}>Close Map</button>
                            </div>
                            {/* Pass data to the child component */}
                            <TrackAmbulance 
                                hospitalLocation={hospital?.location?.coordinates} 
                                ambulancePos={ambulancePos} 
                            />
                        </div>
                    </section>
                )}
            </main> 
        </div>
    );
}

export default HospitalPanel;