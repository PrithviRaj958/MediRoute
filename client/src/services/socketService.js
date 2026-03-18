import {io} from 'socket.io-client';
const SOCKET_URL = "http://localhost:5000";
let socket;

export const initiateSocketConnection = (hospitalId) => {
    socket = io(SOCKET_URL);
    console.log('Connecting socket...');
    if(socket && hospitalId) {
        socket.emit('join_hospital_room', hospitalId);
    }
};

export const disconnectSocket = () => {
    console.log('Disconnecting socket...');
    if(socket) {
        socket.disconnect();
    }  
};

export const subscribeToEmergencies = (callback) => {
    if(!socket) return;
    socket.on('incoming_emergency_alert', (data) => {
        console.log('Emergency alert recieved in service');
        return callback(data);
    });
};

export const acceptEmergencyhandshake = (requestId, hospitalId) => {
    if(socket) {
        socket.emit('hospital_accept_handshake', {requestId, hospitalId});
    }
};

export const getSocket = () => socket;