import React,{useEffect }from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");

    const timer = setTimeout(() => {
    if (role === "OPERATOR") {
      navigate("/operator");
    } else if (role === "ADMIN") {
      navigate("/admin");
    } else if(role === "DRIVER") {
      navigate("/driver");
    } else {
      navigate("/login");
    } 
  },2000);
  return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <p>Welcome! You are successfully logged in.</p>
      <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Redirecting to your MediRoute workspace...</h2>
    </div>
    </div>
  );
};

export default Dashboard;