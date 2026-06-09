const socketManager = (io) => {
    const activeDriverTimeouts = new Map();
    const activeHospitalTimeouts = new Map();

    const triggerHospitalTimeout = (emergencyId, hospitalId) => {
        clearHospitalTimeout(emergencyId);
        const timeoutId = setTimeout(async () => {
            console.log(`Server-side handshake timeout (15s) expired for hospital ${hospitalId} on emergency ${emergencyId}`);
            await declineHospital(emergencyId, hospitalId);
        }, 15000); 
        activeHospitalTimeouts.set(emergencyId.toString(), timeoutId);
    };

    const clearHospitalTimeout = (emergencyId) => {
        const timeoutId = activeHospitalTimeouts.get(emergencyId.toString());
        if (timeoutId) {
            clearTimeout(timeoutId);
            activeHospitalTimeouts.delete(emergencyId.toString());
        }
    };

    const triggerDriverTimeout = (emergencyId, ambulanceId) => {
        clearDriverTimeout(emergencyId);
        const timeoutId = setTimeout(async () => {
            console.log(`Server-side dispatch timeout (16s) expired for driver ${ambulanceId} on emergency ${emergencyId}`);
            await declineDriver(emergencyId, ambulanceId);
        }, 16000); // 16s (slightly longer than client's 15s to allow client-side decline first)
        activeDriverTimeouts.set(emergencyId.toString(), timeoutId);
    };

    const clearDriverTimeout = (emergencyId) => {
        const timeoutId = activeDriverTimeouts.get(emergencyId.toString());
        if (timeoutId) {
            clearTimeout(timeoutId);
            activeDriverTimeouts.delete(emergencyId.toString());
        }
    };

    const Emergency = require("../models/emergency.model");
    const Hospital = require("../models/hospital.model");
    const Ambulance = require("../models/ambulance.model");
    const { startSimulation } = require("../services/simulationService");

    const declineDriver = async (emergencyId, ambulanceId) => {
        clearDriverTimeout(emergencyId);
        try {
            const em = await Emergency.findById(emergencyId);
            if (!em || em.status !== "PENDING" || em.assignedAmbulance) return;

            const currentIndex = em.currentAmbulanceIndex;
            const expectedAmbulanceId = em.candidateAmbulances[currentIndex]?.toString();
            
            // Safety check to ensure we decline the correct driver in order
            if (expectedAmbulanceId !== ambulanceId.toString()) return;

            if (!em.ignoredAmbulances.includes(ambulanceId)) {
                em.ignoredAmbulances.push(ambulanceId);
            }
            
            em.currentAmbulanceIndex += 1;
            const nextIndex = em.currentAmbulanceIndex;

            if (em.candidateAmbulances && nextIndex < em.candidateAmbulances.length) {
                const nextAmbulanceId = em.candidateAmbulances[nextIndex].toString();
                await em.save();
                
                console.log(`Pinging next nearest ambulance: ${nextAmbulanceId}`);
                io.to(`ambulance_${nextAmbulanceId}`).emit("incoming_dispatch_request", em);
                
                // Start timeout for next driver
                triggerDriverTimeout(em._id, nextAmbulanceId);
            } else {
                console.log(`All available ambulances declined emergency ${emergencyId}`);
                io.emit("dispatch_failed", {
                    emergencyId,
                    message: "No available ambulances accepted the SOS dispatch request."
                });
            }
        } catch (err) {
            console.error("Error in declineDriver helper:", err);
        }
    };

    const declineHospital = async (requestId, hospitalId) => {
        clearHospitalTimeout(requestId);
        console.log(`Hospital ${hospitalId} declined handshake for request ${requestId}`);

        try {
            const em = await Emergency.findById(requestId).populate("assignedAmbulance");
            if (!em || em.status !== "PENDING") return;

            const currentIndex = em.currentHospitalIndex;
            const expectedHospitalId = em.candidateHospitals[currentIndex]?.toString();
            
            // Safety check to ensure we decline the correct hospital in order
            if (expectedHospitalId !== hospitalId.toString()) return;

            if (!em.ignoredHospitals.includes(hospitalId)) {
                em.ignoredHospitals.push(hospitalId);
            }

            em.currentHospitalIndex += 1;
            const nextIndex = em.currentHospitalIndex;

            if (em.candidateHospitals && nextIndex < em.candidateHospitals.length) {
                const nextHospitalId = em.candidateHospitals[nextIndex].toString();
                await em.save();

                console.log(`Pinging next nearest hospital: ${nextHospitalId}`);
                io.to(nextHospitalId).emit("incoming_emergency_alert", {
                    requestId: em._id,
                    patientName: em.patientName,
                    severity: em.severity,
                    ambulanceId: em.assignedAmbulance ? em.assignedAmbulance._id : null
                });

                // Start timeout for next hospital
                triggerHospitalTimeout(em._id, nextHospitalId);
            } else {
                console.log(`All hospitals declined handshake for request ${requestId}`);
                
                // Release the assigned driver
                if (em.assignedAmbulance) {
                    await Ambulance.findByIdAndUpdate(em.assignedAmbulance, { status: "AVAILABLE" });
                }

                // Reset emergency
                const prevAmbulance = em.assignedAmbulance;
                em.assignedAmbulance = null;
                em.assignedHospital = null;
                em.status = "PENDING";
                await em.save();

                // Notify driver and operator of failure
                io.emit("handshake_failed", {
                    requestId,
                    ambulanceId: prevAmbulance ? prevAmbulance._id : null,
                    message: "No hospitals accepted the routing request. SOS has been reset."
                });
            }
        } catch (err) {
            console.error("Error in declineHospital helper:", err);
        }
    };

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join_hospital_room", (hospitalId) => {
            socket.join(hospitalId);
            console.log(`Socket ${socket.id} joined hospital room: ${hospitalId}`);
        });

        socket.on("join_emergency_room", (emergencyId) => {
            socket.join(`emergency_room_${emergencyId}`);
            console.log(`Socket ${socket.id} joined emergency room: emergency_room_${emergencyId}`);
        });

        // Driver registers their room
        socket.on("join_ambulance_room", (ambulanceId) => {
            socket.join(`ambulance_${ambulanceId}`);
            console.log(`Socket ${socket.id} joined ambulance room: ambulance_${ambulanceId}`);
        });

        // 1. Operator initiates dispatch targeting ONLY the first nearest candidate
        socket.on("broadcast_to_drivers", async (data) => {
            console.log(`Initiating sequential dispatch for emergency request ${data._id}`);
            try {
                const em = await Emergency.findById(data._id);
                if (em && em.candidateAmbulances && em.candidateAmbulances.length > 0) {
                    const targetAmbulanceId = em.candidateAmbulances[0].toString();
                    console.log(`Pinging first nearest ambulance: ${targetAmbulanceId}`);
                    io.to(`ambulance_${targetAmbulanceId}`).emit("incoming_dispatch_request", em);
                    
                    // Start server-side timeout
                    triggerDriverTimeout(em._id, targetAmbulanceId);
                }
            } catch (err) {
                console.error("Error broadcasting to first driver:", err);
            }
        });

        // Driver Declines or Times Out -> Ping the next driver
        socket.on("driver_decline_dispatch", async (data) => {
            const { emergencyId, ambulanceId } = data;
            console.log(`Driver ${ambulanceId} declined dispatch request ${emergencyId}`);
            await declineDriver(emergencyId, ambulanceId);
        });

        // 2. Driver Accepts -> Trigger the First Hospital Alert
        socket.on("driver_accept_emergency", (data) => {
            const { hospitalId, emergencyId, ambulanceId, patientName, severity } = data;
            console.log(`Driver ${ambulanceId} accepted. Alerting Hospital ${hospitalId}`);

            // Clear the driver timeout!
            clearDriverTimeout(emergencyId);

            // Notify the specific hospital room (Trigger Red Modal)
            if (hospitalId) {
                io.to(hospitalId).emit("incoming_emergency_alert", {
                    requestId: emergencyId,
                    patientName: patientName,
                    severity: severity,
                    ambulanceId: ambulanceId
                });

                // Start server-side timeout for first hospital handshake
                triggerHospitalTimeout(emergencyId, hospitalId);
            }

            // Also notify the Operator that a driver has picked it up
            io.emit("driver_confirmed_assignment", {
                emergencyId,
                ambulanceId,
                status: "DRIVER_EN_ROUTE"
            });
        });

        // Hospital Declines -> Alert the next nearest hospital
        socket.on("hospital_decline_handshake", async (data) => {
            const { requestId, hospitalId } = data;
            await declineHospital(requestId, hospitalId);
        });

        // 3. Hospital Accepts -> Handshake Completed & DB Updated
        socket.on("hospital_accept_handshake", async (data) => {
            const { hospitalId, requestId, ambulanceId } = data;
            console.log(`Hospital ${hospitalId} accepted request ${requestId}. Saving to DB.`);

            // Clear the hospital timeout!
            clearHospitalTimeout(requestId);

            try {
                // Update DB state: assign hospital and mark status as ASSIGNED
                const emergency = await Emergency.findById(requestId);
                if (emergency) {
                    emergency.assignedHospital = hospitalId;
                    emergency.status = "ASSIGNED";
                    await emergency.save();
                }

                // Decrement available beds count in Hospital collection
                const hospital = await Hospital.findById(hospitalId);
                if (hospital && hospital.availableBeds > 0) {
                    hospital.availableBeds -= 1;
                    await hospital.save();
                    console.log(`Decremented available beds for hospital ${hospitalId}. New count: ${hospital.availableBeds}`);
                }

                // Final confirmation to Driver, Hospital and Operator (unlocks tracking view)
                io.emit("handshake_completed", {
                    status: "ACCEPTED",
                    requestId: requestId,
                    hospitalId: hospitalId,
                    ambulanceId: ambulanceId,
                    message: "Hospital confirmed. Proceed to ER."
                });

                // Fetch locations for simulation
                const ambulance = await Ambulance.findById(ambulanceId);

                if (emergency && hospital && ambulance && emergency.location && hospital.location && ambulance.location) {
                    const patientLocation = {
                        lat: emergency.location.coordinates[1],
                        lng: emergency.location.coordinates[0]
                    };
                    const hospitalLocation = {
                        lat: hospital.location.coordinates[1],
                        lng: hospital.location.coordinates[0]
                    };
                    const startLocation = {
                        lat: ambulance.location.coordinates[1],
                        lng: ambulance.location.coordinates[0]
                    };

                    startSimulation(requestId, startLocation, patientLocation, hospitalLocation, io);
                }
            } catch (err) {
                console.error("Error completing hospital handshake:", err);
            }
        });

        socket.on("driver_location_update", (data) => {
            const { hospitalId, lat, lng, ambulanceId } = data;
            io.to(hospitalId).emit("ambulance_moved", { lat, lng, ambulanceId });
        });

        socket.on("emergency_completed", (data) => {
            const { emergencyId, hospitalId } = data;
            console.log(`Emergency ${emergencyId} completed. Notifying hospital ${hospitalId}`);
            if (hospitalId) {
                io.to(hospitalId).emit("emergency_completed_hospital", { emergencyId });
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketManager;
