import {useState, useEffect, useRef, use} from "react";
import "../Map.css";

function MapView({emergency, lat, lng}) {
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersGroup = useRef(null);

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
        const nlat = parseFloat(lat);
        const nlng = parseFloat(lng);

        mapInstance.current = L.map(mapRef.current).setView([nlat,nlng],13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  //fetches actual map
            attribution : "© OpenStreetMap"
        }).addTo(mapInstance.current);
        markersGroup.current = L.layerGroup().addTo(mapInstance.current); // this is like a white board upadated route 
        }                                                                  // can be drawn again without effecting map
    }, [mapLoaded, emergency, lat, lng]);

    //Update markers
    useEffect( () => {
        if(mapInstance.current && markersGroup.current && emergency?.status === "ASSIGNED") {
            const L = window.L;
            markersGroup.current.clearLayers(); //clear old markers
            const nlat = parseFloat(lat);
            const nlng = parseFloat(lng);

            //add patient marker
            L.marker([nlat, nlng], {
                icon: L.divIcon({ html:'<div class="map-marker">🏠</div>',
                className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 32] })
            }).addTo(markersGroup.current).bindPopup("Patient Location");

            //add ambulance marker
            if (emergency.assignedAmbulance?.location) {
                const ambLoc = emergency.assignedAmbulance.location.coordinates;
                L.marker([ambLoc[1], ambLoc[0]], {
                    icon: L.divIcon({ html: '<div class="map-marker">🚑</div>', 
                    className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 16] })
                }).addTo(markersGroup.current).bindPopup("Assigned Ambulance");
            }
            //add hospital marker
            if (emergency.assignedHospital?.location) {
                const hospLoc = emergency.assignedHospital.location.coordinates;
                L.marker([hospLoc[1], hospLoc[0]], {
                    icon: L.divIcon({ html: '<div class="map-marker">🏥</div>', 
                    className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 32] })
                }).addTo(markersGroup.current).bindPopup(`Hospital: ${emergency.assignedHospital.name}`);
            }
            const group = markersGroup.current.getLayers();
            if(group.length > 0) {
                const bounds = L.latLngBounds(group.map(m => m.getLatLng()));
                mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [emergency, lat, lng, mapLoaded] );
    return <div ref={mapRef} className="live-map-view" />;
}

export default MapView;