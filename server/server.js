const app = require("./src/app");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

connectDB();

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_hospital_room", (hospitalId) => {
        socket.join(hospitalId);
        console.log(`Socket ${socket.id} joined room: ${hospitalId}`);
    });

    // 1. Operator broadcasts to ALL nearby drivers
    socket.on("broadcast_to_drivers", (data) => {
        console.log("Broadcasting emergency to all drivers...");
        // In a production app, you'd use geo-spatial filtering here.
        // For now, we emit to all connected drivers.
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

    // 3. Hospital Accepts -> Handshake Completed
    socket.on("hospital_accept_handshake", (data) => {
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
    });

    socket.on("driver_location_update", (data) => {
        const { hospitalId, lat, lng, ambulanceId } = data;
        io.to(hospitalId).emit("ambulance_moved", { lat, lng, ambulanceId });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});