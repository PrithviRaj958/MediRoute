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
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Emergency Status</h2>
                {eta !== null && (
                    <div className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                        ETA: {eta} seconds
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
                
                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isActive = index === currentIndex;
                    const Icon = step.icon;
                    
                    return (
                        <div key={step.key} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                                isCompleted ? 'border-green-500 bg-green-50 text-green-500' : 'border-gray-200 bg-white text-gray-400'
                            }`}>
                                <Icon size={20} />
                            </div>
                            <span className={`text-xs mt-2 font-medium ${
                                isActive ? 'text-gray-900' : 'text-gray-500'
                            }`}>
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
