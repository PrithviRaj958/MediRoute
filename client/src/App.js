import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import AmbulanceManagement from "./pages/AmbulanceManagement";
import Dashboard from "./pages/Dashboard.jsx";
import DriverDashboard from "./pages/DriverDashboard";
import TrackAmbulance from "./pages/TrackAmbulance";
import EmergencyPage from "./pages/EmergencyPage";
import HospitalPanel from "./pages/HospitalPanel.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import OperatorDashboard from "./pages/OperatorDashboard.jsx";

const OperatorPanel = () => <h1>Operator Panel</h1>;

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/driver" element={
          <ProtectedRoute allowedRoles="DRIVER">
            <DriverDashboard />
          </ProtectedRoute>
        } />

        <Route path="/operator" element={
          <ProtectedRoute allowedRoles="OPERATOR">
            <OperatorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/ambulances" element={<AmbulanceManagement />} />

        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/track" element={<TrackAmbulance />} />

        <Route path="/hospital-admin" element={
          <ProtectedRoute allowedRoles="HOSPITAL_ADMIN">
            <HospitalPanel />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" />} />

      </Routes>
    </Router>
  );
}

export default App;