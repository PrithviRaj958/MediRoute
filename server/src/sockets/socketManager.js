const socketManager = (io) => {
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

        // 1. Operator broadcasts to ALL nearby drivers
        socket.on("broadcast_to_drivers", (data) => {
            console.log("Broadcasting emergency to all drivers...");
            io.emit("incoming_dispatch_request", data);
        });

        // 2. Driver Accepts -> Trigger the Hospital Alert
        socket.on("driver_accept_emergency", (data) => {
            const { hospitalId, emergencyId, ambulanceId, patientName, severity } = data;
            console.log(`Driver ${ambulanceId} accepted. Notifying Hospital ${hospitalId}`);

            // Notify the specific hospital room (Trigger Red Modal)
            if (hospitalId) {
                io.to(hospitalId).emit("incoming_emergency_alert", {
                    requestId: emergencyId,
                    patientName: patientName,
                    severity: severity,
                    ambulanceId: ambulanceId
                });
            }

            // Also notify the Operator that a driver has picked it up
            io.emit("driver_confirmed_assignment", {
                emergencyId,
                ambulanceId,
                status: "DRIVER_EN_ROUTE"
            });
        });

        const { startSimulation } = require("../services/simulationService");
        const Emergency = require("../models/emergency.model");
        const Hospital = require("../models/hospital.model");
        const Ambulance = require("../models/ambulance.model");

        // 3. Hospital Accepts -> Handshake Completed
        socket.on("hospital_accept_handshake", async (data) => {
            const { hospitalId, requestId, ambulanceId } = data;
            console.log(`Hospital ${hospitalId} accepted for request ${requestId}`);

            // Final confirmation to Driver and Operator
            io.emit("handshake_completed", {
                status: "ACCEPTED",
                requestId: requestId,
                hospitalId: hospitalId,
                ambulanceId: ambulanceId,
                message: "Hospital confirmed. Proceed to ER."
            });

            try {
                // Fetch locations for simulation from DB
                const emergency = await Emergency.findById(requestId);
                const hospital = await Hospital.findById(hospitalId);
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
                } else {
                    console.log("Missing location data for simulation in database.");
                }
            } catch (err) {
                console.error("Error starting simulation:", err);
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
