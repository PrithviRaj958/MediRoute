import { io } from 'socket.io-client';

const SOCKET_URL = "http://localhost:5000";
let socket;

export const initiateSocketConnection = (hospitalId) => {
    // 🔥 FIX 1: Prevent multiple connections. Reuse existing socket if active.
    if (!socket || !socket.connected) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'], // Faster, more stable for real-time GPS
            reconnectionAttempts: 5
        });
        console.log('Connecting socket...');
    }

    if (socket && hospitalId) {
        // Use 'once' or check state to avoid spamming the join event
        socket.emit('join_hospital_room', hospitalId);
    }
    
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
        socket = null; // 🔥 FIX 2: Clear the variable so it can be re-initialized
    }
};

export const subscribeToEmergencies = (callback) => {
    if (!socket) return;
    // 🔥 FIX 3: Always remove listener before adding to prevent memory leaks/duplicate alerts
    socket.off('incoming_emergency_alert'); 
    socket.on('incoming_emergency_alert', (data) => {
        console.log('Emergency alert received in service');
        callback(data);
    });
};

export const acceptEmergencyhandshake = (requestId, hospitalId, ambulanceId) => {
    if (socket) {
        // Ensure you pass the ambulanceId so the server can notify the driver!
        socket.emit('hospital_accept_handshake', { requestId, hospitalId, ambulanceId });
    }
};

export const emitDriverLocation = (data) => {
    if (socket && socket.connected) {
        socket.emit('driver_location_update', data);
    }
};

export const subscribeToAmbulanceMovement = (callback) => {
    if (!socket) return;
    socket.off('ambulance_moved'); 
    socket.on('ambulance_moved', (coords) => {
        console.log('Ambulance movement received');
        callback(coords);
    });
};

export const subscribeToHospitalAlerts = (callback) => {
    if (!socket) return;
    socket.off('hospital_alert');
    socket.on('hospital_alert', (data) => {
        console.log('Hospital alert received', data);
        callback(data);
    });
};

export const getSocket = () => socket;