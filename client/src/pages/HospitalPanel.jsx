import { useState, useEffect } from 'react';
import axios from 'axios';
import '../HospitalPanel.css';
import MapView from '../components/MapView';
import { 
    initiateSocketConnection, 
    disconnectSocket, 
    subscribeToEmergencies, 
    getSocket, 
    subscribeToAmbulanceMovement,
    subscribeToHospitalAlerts
} from '../services/socketService';
import TrackAmbulanceWidget from '../components/Map/TrackAmbulanceWidget';

const HospitalPanel = () => {
    const [hospital, setHospital] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [awaitingAssignment, setAwaitingAssignment] = useState(false);
    const [updateValue, setUpdateValue] = useState(1);  
    const [incomingEmergency, setIncomingEmergency] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [ambulancePos, setAmbulancePos] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [activeEmergencyData, setActiveEmergencyData] = useState(null);
    const [ambulanceAlert, setAmbulanceAlert] = useState("");

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
                    
                    // 1. Join the socket room
                    initiateSocketConnection(hospitalData._id);

                    // 2. Listen for new emergencies
                    subscribeToEmergencies((data) => {
                        console.log('🚨 Emergency alert received:', data);
                        setIncomingEmergency(data);
                    });

                    // 3. Listen for live movement
                    subscribeToAmbulanceMovement((data) => {
                        setAmbulancePos({ lat: data.lat, lng: data.lng });
                    });

                    // 4. Listen for proximity alerts
                    subscribeToHospitalAlerts((data) => {
                        setAmbulanceAlert(data.message || "🚨 Ambulance is arriving shortly!");
                        setTimeout(() => setAmbulanceAlert(""), 15000); // clear after 15s
                    });

                } else {
                    throw new Error("Hospital data is invalid");
                }
            } catch (err) {
                // Check if the 404 is because this user isn't assigned to a hospital yet
                if (err.response?.status === 404 && err.response?.data?.assigned === false) {
                    setAwaitingAssignment(true);
                } else {
                    setError("Failed to fetch hospital data. Please try again.");
                }
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
            setError("Update failed");
        }
    };

    const handleAccepthandshake = async () => {
        if (!incomingEmergency) return;
        
        try {
            // 1. Fetch FULL emergency details
            const res = await axios.get(`http://localhost:5000/api/emergencies/${incomingEmergency.requestId}`);
            const fullData = res.data;

            // 2. Manual emit to ensure ambulanceId is passed to the driver
            const socket = getSocket();
            if (socket) {
                socket.emit('hospital_accept_handshake', {
                    requestId: incomingEmergency.requestId,
                    hospitalId: hospital._id,
                    ambulanceId: fullData.assignedAmbulance._id 
                });
                
                // Join the emergency room to receive simulation events directly (like proximity alerts)
                socket.emit('join_emergency_room', incomingEmergency.requestId);
            }

            // 3. Update UI States
            setActiveEmergencyData(fullData);
            setIsTracking(true);
            setIncomingEmergency(null);
            setSuccessMsg("✅ Emergency Accepted. Tracking Ambulance..."); 
            
            // 4. Update Database
            await handleUpdate('decrement', 1);

            // Clear success message after 4s
            setTimeout(() => setSuccessMsg(""), 4000);

        } catch (err) {
            console.error("Handshake failed:", err);
            setError("Could not establish connection with ambulance.");
        }
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

    // Hospital admin registered but not yet linked to a hospital by the System Admin
    if (awaitingAssignment) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#050810',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                flexDirection: 'column',
                gap: '1rem',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏥</div>
                <h2 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>Account Pending Assignment</h2>
                <p style={{ color: '#94a3b8', maxWidth: '420px', lineHeight: 1.6 }}>
                    Your account has been created successfully, but the System Administrator
                    hasn't linked it to a hospital yet.
                </p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Please contact your System Admin and ask them to assign your account
                    (<strong style={{ color: '#94a3b8' }}>{localStorage.getItem('name')}</strong>) to your hospital
                    from the Admin Panel.
                </p>
                <div style={{
                    marginTop: '1rem',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    color: '#6366f1',
                    fontSize: '0.85rem'
                }}>
                    🛡️ Once assigned, refresh this page — no re-login required.
                </div>
                <button
                    onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                    style={{
                        marginTop: '1rem',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        padding: '0.6rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif'
                    }}
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="admin-container">
            {ambulanceAlert && (
                <div className="emergency-modal-overlay" style={{ background: "transparent", alignItems: "flex-start", paddingTop: "20px" }}>
                    <div className="success-banner" style={{ background: "var(--danger-color)", color: "white", padding: "20px 40px", fontSize: "1.2rem", border: "2px solid #b91c1c", animation: "pulseText 1.5s infinite" }}>
                        🚨 PROXIMITY ALERT: {ambulanceAlert}
                    </div>
                </div>
            )}
            {successMsg && <div className="success-banner">{successMsg}</div>}
            {error && <div className="error-msg">{error}</div>}

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
                            >
                                {hospital?.availableBeds <= 0 ? "No Beds" : "Accept & Reserve"}
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
                            <button className="btn btn-add" onClick={() => handleUpdate('increment')}>Add</button>
                            <button className="btn btn-remove" onClick={() => handleUpdate('decrement')}>Remove</button>
                        </div>
                    </section>
                </div>

                {isTracking && activeEmergencyData && (
                    <section className="map-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div className="map-header" style={{ padding: "20px 30px", marginBottom: 0, borderBottom: "1px solid var(--border-color)", background: "var(--bg-color)" }}>
                            <h3 style={{ color: "var(--danger-color)", margin: 0 }}>🚑 Incoming Ambulance Live Feed</h3>
                            <button className="btn-close-map" onClick={() => setIsTracking(false)}>Close Map</button>
                        </div>
                        <div style={{ padding: "20px" }}>
                            <TrackAmbulanceWidget emergencyId={activeEmergencyData._id} />
                        </div>
                    </section>
                )}
            </main> 
        </div>
    );
}

export default HospitalPanel;