 const activeSimulations = new Map();

// Helper to calculate distance in meters between two lat/lng points
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

// Helper to interpolate points for smooth sliding
const generatePath = (start, end, steps) => {
    const path = [];
    const latStep = (end.lat - start.lat) / steps;
    const lngStep = (end.lng - start.lng) / steps;
    for (let i = 1; i <= steps; i++) {
        path.push({ lat: start.lat + latStep * i, lng: start.lng + lngStep * i });
    }
    return path;
};

const startSimulation = (emergencyId, startLocation, patientLocation, hospitalLocation, io) => {
    if (activeSimulations.has(emergencyId)) {
        clearInterval(activeSimulations.get(emergencyId));
    }

    console.log(`Starting simulation for emergency: ${emergencyId}`);

    // Generate path
    // We assume 1 step = 2 seconds. For a quick demo, we use 20 steps to patient and 20 steps to hospital.
    const pathToPatient = generatePath(startLocation, patientLocation, 20);
    const pathToHospital = generatePath(patientLocation, hospitalLocation, 20);
    
    let currentPath = [...pathToPatient];
    let phase = "EN_ROUTE_TO_PATIENT"; 
    
    let index = 0;

    const simInterval = setInterval(() => {
        if (index >= currentPath.length) {
            if (phase === "EN_ROUTE_TO_PATIENT") {
                // Reached patient
                phase = "AT_PATIENT";
                io.to(`emergency_room_${emergencyId}`).emit("emergency_status_update", {
                    emergencyId,
                    status: "PATIENT_PICKED_UP",
                    timestamp: new Date()
                });
                
                // Pause for 4 seconds to simulate loading patient, then switch to hospital path
                setTimeout(() => {
                    phase = "EN_ROUTE_TO_HOSPITAL";
                    currentPath = [...pathToHospital];
                    index = 0;
                    io.to(`emergency_room_${emergencyId}`).emit("emergency_status_update", {
                        emergencyId,
                        status: "EN_ROUTE_TO_HOSPITAL",
                        timestamp: new Date()
                    });
                }, 4000);

            } else if (phase === "EN_ROUTE_TO_HOSPITAL") {
                // Reached hospital
                clearInterval(simInterval);
                activeSimulations.delete(emergencyId);
                io.to(`emergency_room_${emergencyId}`).emit("emergency_status_update", {
                    emergencyId,
                    status: "ARRIVED_AT_HOSPITAL",
                    timestamp: new Date()
                });
                console.log(`Simulation finished for emergency: ${emergencyId}`);
            }
            return;
        }

        if (phase === "AT_PATIENT") return; // Paused while loading patient

        const currentLocation = currentPath[index];
        
        // Calculate ETA roughly (remaining steps * 2 seconds)
        const remainingSteps = currentPath.length - index;
        const etaSeconds = remainingSteps * 2;

        io.to(`emergency_room_${emergencyId}`).emit("location_update", {
            emergencyId,
            coords: [currentLocation.lat, currentLocation.lng],
            eta: etaSeconds
        });

        // Trigger hospital alert if near (e.g. 5 steps away)
        if (phase === "EN_ROUTE_TO_HOSPITAL" && remainingSteps === 5) {
            io.to(`emergency_room_${emergencyId}`).emit("hospital_alert", {
                emergencyId,
                message: "Ambulance is arriving shortly!"
            });
        }

        index++;
    }, 2000); // Send update every 2 seconds

    activeSimulations.set(emergencyId, simInterval);
};

module.exports = { startSimulation };
