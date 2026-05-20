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

export const emitDriverLocation = (data) => {
    if(socket){
        socket.emit('driver_location_update',data);
    }
};

export const subscribeToAmbulanceMovement = (callback) => {
    if(!socket) return;
    socket.on('ambulance_moved', (coords) => {
        console.log('Ambulance movement received');
        callback(coords);
    });
};

export const subscribeToDriverLocation = (callback) => {
    if(!socket) return;
    socket.on('driver_location_update', (coords) => {
        console.log('Driver location received');
        callback(coords);
    });
};

export const emitPatientLocation = (data) => {
    if(socket){
        socket.emit('patient_location_update', data);
    }
};

export const subscribeToPatientLocation = (callback) => {
    if(!socket) return;
    socket.on('patient_location_update', (coords) => {
        console.log('Patient location received');
        callback(coords);
    });
};

export const unsubscribeFromPatientLocation = () => {
    if(!socket) return;
    socket.off('patient_location_update');
};

export const unsubscribeFromDriverLocation = () => {
    if(!socket) return;
    socket.off('driver_location_update');
};

export const joinEmergencyRoom = (emergencyId) => {
    if(socket){
        socket.emit('join_emergency_room', emergencyId);
    }
};

export const subscribeToEmergencyUpdates = (callback) => {
    if(!socket) return;
    socket.on('emergency_updated', (data) => {
        console.log('Emergency updated');
        callback(data);
    });
};

export const getSocket = () => socket;