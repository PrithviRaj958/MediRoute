import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // To log out, we just throw away the "Key Card"
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚑 MediRoute Dashboard</h1>
      <p>Welcome! You are successfully logged in.</p>
      <button onClick={handleLogout} style={{ padding: "10px", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;