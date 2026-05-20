import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useEmergency } from "../context/EmergencyContext";
import LiveMapView from "../components/Map/LiveMapView";
import StatusTimeline from "../components/Timeline/StatusTimeline";

const TrackAmbulance = () => {
    const { emergencyId } = useParams();
    const { joinEmergency, status, eta } = useEmergency();
    const [emergencyDetails, setEmergencyDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (emergencyId) {
            joinEmergency(emergencyId);
        }
    }, [emergencyId, joinEmergency]);

    useEffect(() => {
        const fetchDetails = async () => {
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
    }, [emergencyId]);

    if (loading) {
        return <div className="p-8 text-center text-gray-600">Loading tracking data...</div>;
    }

    if (!emergencyDetails) {
        return <div className="p-8 text-center text-red-500">Emergency not found.</div>;
    }

    // Extract coordinates safely
    // MongoDB stores Point as [lng, lat]
    const extractCoords = (obj) => {
        if (!obj || !obj.location || !obj.location.coordinates) return null;
        return {
            lat: obj.location.coordinates[1],
            lng: obj.location.coordinates[0]
        };
    };

    const patientLocation = {
        lat: parseFloat(emergencyDetails.location.lat) || extractCoords(emergencyDetails)?.lat,
        lng: parseFloat(emergencyDetails.location.lng) || extractCoords(emergencyDetails)?.lng,
    };
    
    const hospitalLocation = extractCoords(emergencyDetails.assignedHospital);
    const initialAmbulanceLocation = extractCoords(emergencyDetails.assignedAmbulance);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
                    <p className="text-gray-500">Emergency Request: #{emergencyId.slice(-6).toUpperCase()}</p>
                </div>

                <StatusTimeline />

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <LiveMapView 
                        patientLocation={patientLocation}
                        hospitalLocation={hospitalLocation}
                        initialAmbulanceLocation={initialAmbulanceLocation}
                    />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm text-gray-500 mb-1">Ambulance Details</h3>
                        <p className="font-semibold">{emergencyDetails.assignedAmbulance?.vehicleNumber || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{emergencyDetails.assignedAmbulance?.driverName || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm text-gray-500 mb-1">Patient Details</h3>
                        <p className="font-semibold">{emergencyDetails.patientName || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">Severity: {emergencyDetails.severity}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackAmbulance;