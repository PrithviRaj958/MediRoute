import "../Register.css";
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

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
  <div className="register-container">
    <div className="register-card">
      <h2>Create Account</h2>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="OPERATOR">Operator</option>
          <option value="DRIVER">Driver</option>
          <option value="HOSPITAL_ADMIN">Hospital Admin</option>
        </select>

        <button type="submit">Register</button>
      </form>
      <div className="redirect-link">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
    </div>
  </div>
);
};

export default Register;