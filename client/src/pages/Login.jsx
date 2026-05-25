import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, HeartPulse, LogIn, UserPlus   } from "lucide-react";
import "../Login.css";

/**
 * MediRoute Futuristic Login Component
 * All logic and styling are consolidated into this single file 
 * to ensure compatibility with the build environment.
 */

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("hospitalId", res.data.user.hospitalId || "");
      
      // Smooth redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="clinical-login-root">
    

      <div className="clinical-grid"></div>
      <div className="clinical-bg-accent accent-tr"></div>
      <div className="clinical-bg-accent accent-bl"></div>

      <div className="login-card">
        <div className="login-icon-box">
          <HeartPulse size={34} />
        </div>

        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Secure Terminal Access To MediRoute</p>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              className="clinical-input"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              className="clinical-input"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-button">
            Sign In <LogIn size={18} />
          </button>
        </form>

        <div className="redirect-link">
          <p>
            New to MediRoute? <Link to="/register">Create Account <UserPlus size={14} style={{ marginLeft: '2px' }} /></Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;