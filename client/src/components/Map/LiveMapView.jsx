import React, { useEffect, useRef, useState } from "react";
import { useEmergency } from "../../context/EmergencyContext";
import "../../Map.css"; // Ensure this has the styles

const LiveMapView = ({ patientLocation, hospitalLocation, initialAmbulanceLocation }) => {
    const { location } = useEmergency();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const ambulanceMarker = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (window.L) { setMapLoaded(true); return; }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
            setMapLoaded(true);
        };
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (mapLoaded && mapRef.current && !mapInstance.current && patientLocation) {
            const L = window.L;
            mapInstance.current = L.map(mapRef.current).setView([patientLocation.lat, patientLocation.lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: "© OpenStreetMap"
            }).addTo(mapInstance.current);

            const markersGroup = L.layerGroup().addTo(mapInstance.current);

            // Add Patient
            L.marker([patientLocation.lat, patientLocation.lng], {
                icon: L.divIcon({ html: '<div class="map-marker">🏠</div>', className: 'custom-leaflet-icon', iconSize: [32, 32] })
            }).addTo(markersGroup).bindPopup("Patient");

            // Add Hospital
            if (hospitalLocation) {
                L.marker([hospitalLocation.lat, hospitalLocation.lng], {
                    icon: L.divIcon({ html: '<div class="map-marker">🏥</div>', className: 'custom-leaflet-icon', iconSize: [32, 32] })
                }).addTo(markersGroup).bindPopup("Hospital");
            }

            // Add initial ambulance
            if (initialAmbulanceLocation) {
                ambulanceMarker.current = L.marker([initialAmbulanceLocation.lat, initialAmbulanceLocation.lng], {
                    icon: L.divIcon({ html: '<div class="map-marker">🚑</div>', className: 'custom-leaflet-icon smooth-marker', iconSize: [32, 32] })
                }).addTo(markersGroup).bindPopup("Ambulance");
            }

            // Fit bounds
            const bounds = L.latLngBounds([
                [patientLocation.lat, patientLocation.lng],
                ...(hospitalLocation ? [[hospitalLocation.lat, hospitalLocation.lng]] : []),
                ...(initialAmbulanceLocation ? [[initialAmbulanceLocation.lat, initialAmbulanceLocation.lng]] : [])
            ]);
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [mapLoaded, patientLocation, hospitalLocation, initialAmbulanceLocation]);

    // Listen to live location updates
    useEffect(() => {
        if (location && ambulanceMarker.current && window.L) {
            // Use native setLatLng with CSS transition
            ambulanceMarker.current.setLatLng(location);
        }
    }, [location]);

    return (
        <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "10px", overflow: "hidden" }} />
    );
};

export default LiveMapView;
