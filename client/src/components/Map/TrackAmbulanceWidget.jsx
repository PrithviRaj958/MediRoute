import React, { useEffect, useState } from "react";
import axios from "axios";
import { useEmergency } from "../../context/EmergencyContext";
import LiveMapView from "./LiveMapView";
import StatusTimeline from "../Timeline/StatusTimeline";

const TrackAmbulanceWidget = ({ emergencyId, activeEmergencies = [], isFleetView = false, hospital = null, fleetPositions = {} }) => {
    const { joinEmergency, status, eta } = useEmergency();
    const [emergencyDetails, setEmergencyDetails] = useState(null);
    const [loading, setLoading] = useState(!isFleetView);

    useEffect(() => {
        if (emergencyId && !isFleetView) {
            joinEmergency(emergencyId);
        }
    }, [emergencyId, joinEmergency, isFleetView]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (isFleetView) return;
            try {
                // Fetch complete emergency details (including coords) from API
                const res = await axios.get(`http://localhost:5000/api/emergencies/${emergencyId}`);
                setEmergencyDetails(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching emergency details:", err);
                setLoading(false);
            }
        };

        if (emergencyId) {
            fetchDetails();
        }
    }, [emergencyId, isFleetView]);

    if (loading && !isFleetView) {
        return <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading tracking data...</div>;
    }

    if (!emergencyDetails && !isFleetView) {
        return <div style={{ padding: "20px", textAlign: "center", color: "var(--danger-color)" }}>Emergency not found.</div>;
    }

    // Extract coordinates safely
    const extractCoords = (obj) => {
        if (!obj || !obj.location || !obj.location.coordinates) return null;
        return {
            lat: obj.location.coordinates[1],
            lng: obj.location.coordinates[0]
        };
    };

    let patientLocation, hospitalLocation, initialAmbulanceLocation;

    if (!isFleetView) {
        patientLocation = {
            lat: parseFloat(emergencyDetails.location.lat) || extractCoords(emergencyDetails)?.lat,
            lng: parseFloat(emergencyDetails.location.lng) || extractCoords(emergencyDetails)?.lng,
        };
        hospitalLocation = extractCoords(emergencyDetails.assignedHospital);
        initialAmbulanceLocation = extractCoords(emergencyDetails.assignedAmbulance);
    }

    return (
        <div style={{ width: "100%", background: "var(--surface-color)", padding: "30px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Header Area */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-color)", paddingBottom: "15px" }}>
                <h2 style={{ margin: 0, color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.6rem" }}>
                    🛰️ Global Tracking System
                </h2>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success-color)", padding: "8px 16px", borderRadius: "var(--radius-full)", fontWeight: "bold", border: "1px solid var(--success-color)" }}>
                    ● LIVE
                </div>
            </div>

            {!isFleetView && <StatusTimeline />}

            {/* Map Container */}
            <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "4px solid var(--border-color)", boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)" }}>
                <LiveMapView 
                    patientLocation={patientLocation}
                    hospitalLocation={hospitalLocation}
                    initialAmbulanceLocation={initialAmbulanceLocation}
                    isFleetView={isFleetView}
                    activeEmergencies={activeEmergencies}
                    hospital={hospital}
                    fleetPositions={fleetPositions}
                />
            </div>

            {/* Details Cards (Hidden in Fleet View) */}
            {!isFleetView && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                    <div style={{ background: "linear-gradient(135deg, var(--bg-color), var(--surface-color))", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <h3 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" }}>
                            🚑 Dispatch Unit
                        </h3>
                        <p style={{ fontWeight: "800", margin: "0 0 5px 0", fontSize: "1.2rem", color: "var(--text-main)" }}>{emergencyDetails?.assignedAmbulance?.vehicleNumber || 'N/A'}</p>
                        <p style={{ fontSize: "0.95rem", color: "var(--text-main)", margin: 0 }}>Driver: <strong>{emergencyDetails?.assignedAmbulance?.driverName || 'N/A'}</strong></p>
                    </div>

                    <div style={{ background: "linear-gradient(135deg, var(--bg-color), var(--surface-color))", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
                        <h3 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" }}>
                            👤 Subject Profile
                        </h3>
                        <p style={{ fontWeight: "800", margin: "0 0 5px 0", fontSize: "1.2rem", color: "var(--text-main)" }}>{emergencyDetails?.patientName || 'Unknown'}</p>
                        <p style={{ fontSize: "0.95rem", margin: 0, color: "var(--danger-color)", fontWeight: "600" }}>Triage: {emergencyDetails?.severity}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackAmbulanceWidget;
