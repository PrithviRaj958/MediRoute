import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token =localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
        return <Navigate to="/login" replace />;
    }else if (allowedRoles && userRole !== allowedRoles) {
        return <Navigate to="/login" replace />;
    }   
    return children;
};

export default ProtectedRoute;