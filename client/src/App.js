import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProctectedRoute.jsx";

const DriverPanel = () => <h1>Driver Panel</h1>;
const OperatorPanel = () => <h1>Operator Panel</h1>;
const AdminPanel = () => <h1>Admin Panel</h1>;

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
            <DriverPanel />
          </ProtectedRoute>
        } />

        <Route path="/operator" element={
          <ProtectedRoute allowedRoles="OPERATOR">
            <OperatorPanel />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles="HOSPITAL_ADMIN">
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App; 