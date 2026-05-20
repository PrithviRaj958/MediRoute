import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const EmergencyContext = createContext();

export const useEmergency = () => useContext(EmergencyContext);

export const EmergencyProvider = ({ children }) => {
    const socket = useSocket();
    const [activeEmergency, setActiveEmergency] = useState(null);
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState("DISPATCHED");
    const [eta, setEta] = useState(null);

    useEffect(() => {
        if (!socket) return;

        const handleLocationUpdate = (data) => {
            if (activeEmergency === data.emergencyId) {
                setLocation(data.coords);
                setEta(data.eta);
            }
        };

        const handleStatusUpdate = (data) => {
            if (activeEmergency === data.emergencyId) {
                setStatus(data.status);
            }
        };

        socket.on("location_update", handleLocationUpdate);
        socket.on("emergency_status_update", handleStatusUpdate);

        return () => {
            socket.off("location_update", handleLocationUpdate);
            socket.off("emergency_status_update", handleStatusUpdate);
        };
    }, [socket, activeEmergency]);

    const joinEmergency = React.useCallback((emergencyId) => {
        if (socket && emergencyId) {
            setActiveEmergency(emergencyId);
            socket.emit("join_emergency_room", emergencyId);
            console.log(`[EmergencyContext] Emitted join_emergency_room for ${emergencyId}`);
        } else {
            console.log(`[EmergencyContext] Waiting for socket to connect...`);
        }
    }, [socket]);

    const value = {
        activeEmergency,
        location,
        status,
        eta,
        joinEmergency
    };

    return (
        <EmergencyContext.Provider value={value}>
            {children}
        </EmergencyContext.Provider>
    );
};
