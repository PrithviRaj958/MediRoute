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
    subscribeToLocationUpdates,
    subscribeToHospitalAlerts,
    subscribeToEmergencyCompleted
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
    const [analytics, setAnalytics] = useState({ totalHandledToday: 0, avgResponseTimeMins: 0, capacityLoad: 0 });
    const [admittedPatients, setAdmittedPatients] = useState([]);
    const [activeEmergencies, setActiveEmergencies] = useState([]); // Array for Fleet View
    const [fleetPositions, setFleetPositions] = useState({}); // Map of emergencyId -> {lat, lng}

    const fetchPatientsAndAnalytics = async () => {
        try {
            const token = localStorage.getItem("token");
            const [analyticsRes, patientsRes] = await Promise.all([
                axios.get("http://localhost:5000/api/hospitals/analytics", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("http://localhost:5000/api/emergencies/admitted", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAnalytics(analyticsRes.data);
            setAdmittedPatients(patientsRes.data);
        } catch (e) {
            console.error("Failed to fetch analytics or patients", e);
        }
    };

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

                    fetchPatientsAndAnalytics();
                    
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

                    // Listen to simulation location updates
                    subscribeToLocationUpdates((data) => {
                        setFleetPositions(prev => ({
                            ...prev,
                            [data.emergencyId]: { lat: data.coords[0], lng: data.coords[1] }
                        }));
                    });

                    // 4. Listen for proximity alerts
                    subscribeToHospitalAlerts((data) => {
                        setAmbulanceAlert(data.message || "🚨 Ambulance is arriving shortly!");
                        setTimeout(() => setAmbulanceAlert(""), 15000); // clear after 15s
                    });

                    // Listen for completed dispatches
                    subscribeToEmergencyCompleted((data) => {
                        setActiveEmergencies(prev => prev.filter(e => String(e._id) !== String(data.emergencyId)));
                        setFleetPositions(prev => {
                            const newPositions = { ...prev };
                            delete newPositions[data.emergencyId];
                            return newPositions;
                        });
                        fetchPatientsAndAnalytics();
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
            setActiveEmergencies(prev => [...prev, fullData]); // Add to fleet view array
            setIsTracking(true);
            setIncomingEmergency(null);
            setSuccessMsg("✅ Emergency Accepted. Tracking Ambulance..."); 
            
            // 4. Update local state (Backend already decremented it in DB via socket handshake)
            setHospital(prev => ({ ...prev, availableBeds: Math.max(0, prev.availableBeds - 1) }));

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

    const handleResourceUpdate = async (field, value) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put("http://localhost:5000/api/hospitals/update-resources", 
                { [field]: value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHospital(res.data.hospital);
            setSuccessMsg("✅ Resource Updated.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError("Resource update failed");
        }
    };

    const handleDischarge = async (emergencyId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:5000/api/emergencies/discharge", 
                { emergencyId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAdmittedPatients(prev => prev.filter(p => p._id !== emergencyId));
            setHospital(prev => ({ ...prev, availableBeds: prev.availableBeds + 1 }));
            setSuccessMsg("✅ Patient Discharged. Bed freed up.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            setError("Discharge failed");
        }
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
            {/* Analytics Banner */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "20px" }}>
                <div style={{ background: "linear-gradient(135deg, var(--primary-color), #0d9488)", color: "white", padding: "20px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)" }}>
                    <h4 style={{ margin: 0, opacity: 0.9, fontSize: "0.9rem", textTransform: "uppercase" }}>Total Dispatches Today</h4>
                    <p style={{ margin: "5px 0 0 0", fontSize: "2rem", fontWeight: "bold" }}>{analytics.totalHandledToday}</p>
                </div>
                <div style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "white", padding: "20px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)" }}>
                    <h4 style={{ margin: 0, opacity: 0.9, fontSize: "0.9rem", textTransform: "uppercase" }}>Avg Response Time</h4>
                    <p style={{ margin: "5px 0 0 0", fontSize: "2rem", fontWeight: "bold" }}>{analytics.avgResponseTimeMins} <span style={{fontSize: "1rem"}}>mins</span></p>
                </div>
                <div style={{ background: "linear-gradient(135deg, #e11d48, #be123c)", color: "white", padding: "20px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)" }}>
                    <h4 style={{ margin: 0, opacity: 0.9, fontSize: "0.9rem", textTransform: "uppercase" }}>ER Capacity Load</h4>
                    <p style={{ margin: "5px 0 0 0", fontSize: "2rem", fontWeight: "bold" }}>{analytics.capacityLoad}%</p>
                </div>
            </div>
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
                    <section className="control-card">
                        <h3>Critical Resources</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label style={{ fontWeight: "bold", color: "var(--text-main)" }}>ICU Beds</label>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <button className="btn" style={{ padding: "5px 10px", background: "var(--danger-color)", color: "white" }} onClick={() => handleResourceUpdate('icuBeds', Math.max(0, hospital.icuBeds - 1))}>-</button>
                                    <span style={{ padding: "5px 15px", background: "var(--bg-color)", borderRadius: "var(--radius-md)", fontWeight: "bold" }}>{hospital?.icuBeds || 0}</span>
                                    <button className="btn" style={{ padding: "5px 10px", background: "var(--success-color)", color: "white" }} onClick={() => handleResourceUpdate('icuBeds', hospital.icuBeds + 1)}>+</button>
                                </div>
                            </div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label style={{ fontWeight: "bold", color: "var(--text-main)" }}>O-Neg Blood</label>
                                <select className="form-select" style={{ width: "auto", padding: "5px 10px" }} value={hospital?.bloodSupplyStatus || 'Stable'} onChange={(e) => handleResourceUpdate('bloodSupplyStatus', e.target.value)}>
                                    <option value="Stable">Stable</option>
                                    <option value="Low">Low</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label style={{ fontWeight: "bold", color: "var(--text-main)" }}>Trauma Team</label>
                                <button className="btn" style={{ background: hospital?.traumaTeamAvailable ? "var(--success-color)" : "var(--danger-color)", color: "white", padding: "5px 15px" }} onClick={() => handleResourceUpdate('traumaTeamAvailable', !hospital.traumaTeamAvailable)}>
                                    {hospital?.traumaTeamAvailable ? "Available" : "Busy"}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Live Arrivals Board & Fleet View Map */}
                {activeEmergencies.length > 0 && (
                    <section className="map-card" style={{ padding: 0, overflow: "hidden", marginTop: "20px" }}>
                        <div className="map-header" style={{ padding: "20px 30px", marginBottom: 0, borderBottom: "1px solid var(--border-color)", background: "var(--bg-color)" }}>
                            <h3 style={{ color: "var(--danger-color)", margin: 0 }}>🚑 Live ER Arrivals Board (Fleet View)</h3>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success-color)", padding: "5px 10px", borderRadius: "20px", fontWeight: "bold" }}>
                                    ● LIVE: {activeEmergencies.length} Incoming
                                </span>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0" }}>
                            {/* Arrivals List */}
                            <div style={{ borderRight: "1px solid var(--border-color)", background: "var(--surface-color)", height: "450px", overflowY: "auto" }}>
                                {activeEmergencies.map((em, idx) => (
                                    <div key={em._id} style={{ padding: "15px", borderBottom: "1px solid var(--border-color)", borderLeft: `4px solid ${em.severity === 'High' ? 'var(--danger-color)' : em.severity === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)'}` }}>
                                        <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>Unit {em.assignedAmbulance?.vehicleNumber || `#${idx+1}`}</p>
                                        <p style={{ margin: "0 0 5px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>Patient: {em.patientName}</p>
                                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "bold", color: "var(--primary-color)" }}>ETA: Tracking Live</p>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Fleet Map View */}
                            <div style={{ height: "450px" }}>
                                {/* Since TrackAmbulanceWidget supports only 1 emergencyId, we'll just show the first one for now,
                                    or we need to update TrackAmbulanceWidget to accept multiple. Let's pass the first one to avoid breaking immediately,
                                    then we'll refactor TrackAmbulanceWidget or LiveMapView. */}
                                <TrackAmbulanceWidget emergencyId={activeEmergencies[0]._id} activeEmergencies={activeEmergencies} isFleetView={true} hospital={hospital} fleetPositions={fleetPositions} />
                            </div>
                        </div>
                    </section>
                )}

                {/* Admitted ER Patients List */}
                <section className="stats-card" style={{ marginTop: "20px" }}>
                    <h3 style={{ borderBottom: "2px solid var(--border-color)", paddingBottom: "10px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                        🏥 Active ER Patients
                    </h3>
                    {admittedPatients.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No patients currently admitted.</p>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {admittedPatients.map(patient => (
                                <div key={patient._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-color)", padding: "15px", borderRadius: "var(--radius-md)", borderLeft: `5px solid ${patient.severity === 'High' ? 'var(--danger-color)' : patient.severity === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)'}` }}>
                                    <div>
                                        <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>{patient.patientName}</p>
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Arrived: {new Date(patient.updatedAt).toLocaleTimeString()}</p>
                                    </div>
                                    <button onClick={() => handleDischarge(patient._id)} className="btn btn-add" style={{ padding: "8px 15px", background: "var(--primary-color)", color: "white" }}>
                                        Discharge Patient
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main> 
        </div>
    );
}

export default HospitalPanel;