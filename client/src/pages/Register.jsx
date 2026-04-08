import "../Register.css";
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Mail, Lock, HeartPulse, UserPlus, User, ShieldCheck, LogIn } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "OPERATOR",
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
        "http://localhost:5000/api/auth/register",
        formData
      );

      setMessage(res.data.message);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "OPERATOR",
      });

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
  <div className="clinical-register-root">
      

      <div className="clinical-grid"></div>
      <div className="clinical-bg-accent accent-tl"></div>
      <div className="clinical-bg-accent accent-br"></div>

      <div className="register-card">
        <div className="register-icon-box">
          <HeartPulse size={34} />
        </div>

        <div className="register-header">
          <h2 className="register-title">Create Account</h2>
          <p className="register-subtitle">Register new credentials with MediRoute</p>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              className="clinical-input"
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              className="clinical-input"
              type="email"
              name="email"
              placeholder="Email ID"
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

          <div className="input-group">
            <ShieldCheck size={18} className="input-icon" />
            <select
              className="clinical-select"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="OPERATOR">Operator</option>
              <option value="DRIVER">Driver</option>
              <option value="HOSPITAL_ADMIN">Hospital Admin</option>
            </select>
          </div>

          <button type="submit" className="register-button">
            Register Account <UserPlus size={18} />
          </button>
        </form>

        <div className="redirect-link">
          <p>
            Already have a account? <Link to="/login">Login <LogIn size={14} style={{ marginLeft: '2px' }} /></Link>
          </p>
        </div>
      </div>
    </div>
);
};

export default Register;