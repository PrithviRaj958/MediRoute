import React, { useEffect, useRef, useState } from "react";
import { useEmergency } from "../../context/EmergencyContext";
import "../../Map.css"; // Ensure this has the styles

const LiveMapView = ({ patientLocation, hospitalLocation, initialAmbulanceLocation, isFleetView, activeEmergencies, hospital, fleetPositions = {} }) => {
    const { location } = useEmergency();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const ambulanceMarker = useRef(null);
    const fleetMarkers = useRef({}); // Store multiple markers by ID
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

    const extractCoords = (obj) => {
        if (!obj || !obj.location || !obj.location.coordinates) return null;
        return {
            lat: obj.location.coordinates[1],
            lng: obj.location.coordinates[0]
        };
    };

    useEffect(() => {
        if (!mapLoaded || !mapRef.current || mapInstance.current) return;

        const L = window.L;
        
        // Determine center
        let centerLat = hospitalLocation?.lat || hospital?.location?.coordinates[1] || 0;
        let centerLng = hospitalLocation?.lng || hospital?.location?.coordinates[0] || 0;

        if (!isFleetView && patientLocation) {
            centerLat = patientLocation.lat;
            centerLng = patientLocation.lng;
        }

        mapInstance.current = L.map(mapRef.current).setView([centerLat, centerLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: "© OpenStreetMap"
        }).addTo(mapInstance.current);

        const markersGroup = L.layerGroup().addTo(mapInstance.current);
        const boundsList = [];

        if (isFleetView && activeEmergencies && hospital) {
            // Fleet View Logic
            const hLat = hospital.location.coordinates[1];
            const hLng = hospital.location.coordinates[0];
            L.marker([hLat, hLng], {
                icon: L.divIcon({ html: '<div class="map-marker" style="transform:scale(1.5);">🏥</div>', className: 'custom-leaflet-icon', iconSize: [40, 40] })
            }).addTo(markersGroup).bindPopup(hospital.name);
            boundsList.push([hLat, hLng]);

            activeEmergencies.forEach((em) => {
                const ambLoc = extractCoords(em.assignedAmbulance);
                if (ambLoc) {
                    const color = em.severity === 'High' ? 'var(--danger-color)' : em.severity === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)';
                    const marker = L.marker([ambLoc.lat, ambLoc.lng], {
                        icon: L.divIcon({ html: `<div class="map-marker" style="border-color:${color}; box-shadow: 0 0 10px ${color}">🚑</div>`, className: 'custom-leaflet-icon smooth-marker', iconSize: [32, 32] })
                    }).addTo(markersGroup).bindPopup(`Patient: ${em.patientName}`);
                    
                    fleetMarkers.current[em._id] = marker;
                    boundsList.push([ambLoc.lat, ambLoc.lng]);
                }
            });

        } else {
            // Standard Single View Logic
            if (patientLocation) {
                L.marker([patientLocation.lat, patientLocation.lng], {
                    icon: L.divIcon({ html: '<div class="map-marker">🏠</div>', className: 'custom-leaflet-icon', iconSize: [32, 32] })
                }).addTo(markersGroup).bindPopup("Patient");
                boundsList.push([patientLocation.lat, patientLocation.lng]);
            }

            if (hospitalLocation) {
                L.marker([hospitalLocation.lat, hospitalLocation.lng], {
                    icon: L.divIcon({ html: '<div class="map-marker">🏥</div>', className: 'custom-leaflet-icon', iconSize: [32, 32] })
                }).addTo(markersGroup).bindPopup("Hospital");
                boundsList.push([hospitalLocation.lat, hospitalLocation.lng]);
            }

            if (initialAmbulanceLocation) {
                ambulanceMarker.current = L.marker([initialAmbulanceLocation.lat, initialAmbulanceLocation.lng], {
                    icon: L.divIcon({ html: '<div class="map-marker">🚑</div>', className: 'custom-leaflet-icon smooth-marker', iconSize: [32, 32] })
                }).addTo(markersGroup).bindPopup("Ambulance");
                boundsList.push([initialAmbulanceLocation.lat, initialAmbulanceLocation.lng]);
            }
        }

        // Fit bounds
        if (boundsList.length > 0) {
            const bounds = L.latLngBounds(boundsList);
            mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }

    }, [mapLoaded, patientLocation, hospitalLocation, initialAmbulanceLocation, isFleetView, activeEmergencies, hospital]);

    // Listen to live location updates for Single View
    useEffect(() => {
        if (!isFleetView && location && ambulanceMarker.current && window.L) {
            ambulanceMarker.current.setLatLng(location);
        }
    }, [location, isFleetView]);

    // Listen to live location updates for Fleet View
    useEffect(() => {
        if (isFleetView && fleetPositions && Object.keys(fleetPositions).length > 0 && window.L) {
            Object.keys(fleetPositions).forEach(emergencyId => {
                const marker = fleetMarkers.current[emergencyId];
                if (marker) {
                    marker.setLatLng([fleetPositions[emergencyId].lat, fleetPositions[emergencyId].lng]);
                }
            });
        }
    }, [fleetPositions, isFleetView]);

    return (
        <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "10px", overflow: "hidden" }} />
    );
};

export default LiveMapView;
