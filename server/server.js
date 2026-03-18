const app = require("./src/app");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server,{   //this keeps the TCP connection alive for real-time communication wihout redialing
    cors : {
        origin : "http://localhost:3000",
        methods : ["GET","POST"]
    }
})
connectDB();

io.on("connection",(socket) =>{
    console.log(`User connected: ${socket.id}`);

    socket.on("join_hospital_room",(hospitalId) => {
        socket.join(hospitalId);
        console.log(`Hospital ${hospitalId} is online`);
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
})

server.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});
