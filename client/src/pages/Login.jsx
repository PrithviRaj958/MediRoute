import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });   

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage(""); 
        try {
            const res = await axios.post(
                "http://localhost:5000/api/auth/login",
                formData
            );  
            setMessage(res.data.message);
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        }
        catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    };
    
    return (
    <div className="login-container">
        <h2>Login</h2>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        
        {/* Added className="login-form" */}
        <form onSubmit={handleSubmit} className="login-form">
            <input
                className="login-input" // Added className
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
            />
            <input
                className="login-input" // Added className
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
            />
            <button type="submit" className="login-button">Login</button> {/* Added className */}
        </form>
        <div className="redirect-link">
                <p>New user? <Link to="/register">Register here</Link></p>
            </div>
    </div>
);
};

export default Login;
