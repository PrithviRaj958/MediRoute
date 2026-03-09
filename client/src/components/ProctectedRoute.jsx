import React from "react";
import { Navigate } from "react-router-dom";

const ProctectedRoute = ({ children, allowedRoles }) => {
    const tolken =localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!tolken) {
        return <Navigate to="/login" replace />;
    }else if (allowedRoles && userRole !== allowedRoles) {
        return <Navigate to="/login" replace />;
    }   
    return children;
};

export default ProctectedRoute;