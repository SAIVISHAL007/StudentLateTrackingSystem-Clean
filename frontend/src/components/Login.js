import React, { useState } from "react";
import { FiAlertTriangle, FiLogIn, FiAward } from "react-icons/fi";
import API from "../services/api";
import "./Login.css";

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!credentials.email.trim() || !credentials.password.trim()) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      // Call the new backend API
      const response = await API.post("/auth/login", {
        email: credentials.email,
        password: credentials.password
      });

      // Store JWT token and faculty info
      localStorage.setItem("jwt_token", response.data.token);
      localStorage.setItem("facultyAuth", JSON.stringify({
        ...response.data.faculty,
        loginTime: new Date().toISOString(),
        isAuthenticated: true
      }));

      setLoading(false);
      onLogin(response.data.faculty.name);
    } catch (err) {
      console.error("Login error:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Connection timeout. Please check if backend is running on port 5000.";
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Make sure backend is running: cd backend && npm start";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  return (
    <div className="login-container">
      {/* Floating Particle Background */}
      <div className="login-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      <div className="login-box">
        {/* Logo/Header Section */}
        <div className="login-header">
          <div className="login-logo no-select">
            <FiAward size={48} />
          </div>
          <h1 className="login-title no-select">
            Faculty Login
          </h1>
          <p className="login-subtitle no-select">
            ANITS Student Late Tracking System
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="login-form">
          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>
            <input
              type="text"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder="faculty@anits.edu.in"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              <FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <span className="flex-center">
                <span className="button-spinner" />
                Logging in...
              </span>
            ) : (
              <span className="flex-center">
                <FiLogIn size={20} style={{ marginRight: '8px' }} />
                Login to Dashboard
              </span>
            )}
          </button>

          {/* Auxiliary Info */}
          <div className="info-box">
            New faculty accounts and password resets are handled only by the <strong>Admin Office / Superadmin</strong>.<br />
            If you need access or forgot your password, contact the system administrator.
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
