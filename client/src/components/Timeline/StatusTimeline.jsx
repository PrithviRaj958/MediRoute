import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { CheckCircle, Clock, Truck, UserPlus, MapPin, Flag } from 'lucide-react';

const StatusTimeline = () => {
    const { status, eta } = useEmergency();

    const steps = [
        { key: "DISPATCHED", label: "Dispatched", icon: Clock },
        { key: "DRIVER_EN_ROUTE", label: "En Route to Patient", icon: Truck },
        { key: "PATIENT_PICKED_UP", label: "Patient Picked Up", icon: UserPlus },
        { key: "EN_ROUTE_TO_HOSPITAL", label: "En Route to Hospital", icon: MapPin },
        { key: "ARRIVED_AT_HOSPITAL", label: "Arrived at Hospital", icon: Flag },
    ];

    const getCurrentIndex = () => {
        return steps.findIndex(s => s.key === status) || 0;
    };

    const currentIndex = getCurrentIndex();

    return (
        <div style={{ background: "var(--bg-color)", padding: "25px", borderRadius: "var(--radius-lg)", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h2 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-main)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Timeline Progress</h2>
                {eta !== null && (
                    <div style={{ color: "var(--primary-color)", fontWeight: "bold", background: "rgba(15, 118, 110, 0.1)", padding: "8px 16px", borderRadius: "var(--radius-full)", border: "1px solid rgba(15, 118, 110, 0.2)" }}>
                        ETA: {eta} seconds
                    </div>
                )}
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: "20px", width: "100%", height: "4px", background: "var(--border-color)", zIndex: 0, borderRadius: "2px" }}></div>
                
                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isActive = index === currentIndex;
                    const Icon = step.icon;
                    
                    return (
                        <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--bg-color)", padding: "0 10px", zIndex: 1, position: "relative", minWidth: "100px", textAlign: "center" }}>
                            <div style={{ 
                                width: "45px", 
                                height: "45px", 
                                borderRadius: "50%", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                border: `4px solid ${isCompleted ? 'var(--success-color)' : 'var(--border-color)'}`,
                                background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-color)',
                                color: isCompleted ? 'var(--success-color)' : 'var(--text-muted)',
                                transition: "all 0.3s ease",
                                transform: isActive ? "scale(1.15)" : "scale(1)",
                                boxShadow: isActive ? "0 0 15px rgba(16, 185, 129, 0.4)" : "none"
                            }}>
                                <Icon size={20} />
                            </div>
                            <span style={{ 
                                fontSize: "0.85rem", 
                                marginTop: "12px", 
                                fontWeight: isActive ? "700" : "600",
                                color: isActive ? "var(--text-main)" : "var(--text-muted)",
                                lineHeight: "1.2"
                            }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusTimeline;
