const app = require("./src/app");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const socketManager = require("./src/sockets/socketManager");

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

connectDB();

// Initialize socket manager
socketManager(io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});