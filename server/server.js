require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server,{   //this keeps the TCP connection alive for real-time communication wihout redialing
    cors : {
        origin : "http://localhost:3000",
        methods : ["GET","POST"]
    }
})
connectDB();

module.exports.io = io;

io.on("connection",(socket) =>{
    console.log(`User connected: ${socket.id}`);

    socket.on("join_hospital_room",(hospitalId) => {
        socket.join(hospitalId);
        console.log(`Hospital ${hospitalId} is online`);
    });

    socket.on("join_emergency_room",(emergencyId) => {
        socket.join(`emergency_${emergencyId}`);
        console.log(`Joined emergency room: emergency_${emergencyId}`);
    });

    socket.on("send_emergency_request",(data) => {
        const {hospitalId} = data;
        console.log(`Emergency request received for hospital ${hospitalId}`);
        io.to(hospitalId).emit("incoming_emergency_alert", data);
    });

    socket.on("hospital_accept_handshake",(data) =>{
        console.log(`Hospital ${data.hospitalId} accepted request ${data.requestId}`);
        io.emit("handshake_completed", {
            status : "ACCEPTED",
            hospitalId : data.hospitalId,
            message :"Hospital is ready. Proceed to ER enterance."
        });
    });

    socket.on("disconnect", () =>{
        console.log(`User disconnected: ${socket.id}`);
    });

    socket.on("driver_location_update", (data) => {
        const { hospitalId, emergencyId, lat, lng, ambulanceId } = data;
        console.log(`Relaying location for Ambulance ${ambulanceId} to Hospital ${hospitalId} and emergency ${emergencyId}`);
        if (hospitalId) {
            io.to(hospitalId).emit("ambulance_moved", { lat, lng, ambulanceId });
        }
        if (emergencyId) {
            io.to(`emergency_${emergencyId}`).emit("driver_location_update", { lat, lng, ambulanceId });
        }
    });

    socket.on("patient_location_update", (data) => {
        const { emergencyId, lat, lng, patientName } = data;
        console.log(`Patient location update for emergency ${emergencyId}: ${lat}, ${lng}`);
        io.to(`emergency_${emergencyId}`).emit("patient_location_update", { lat, lng, patientName, emergencyId });
    });
})

server.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});
