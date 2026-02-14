import React, { useState } from "react";
import { FiAlertTriangle, FiLogIn, FiUsers } from "react-icons/fi";
import API from "../services/api";
import StudentDashboard from "./StudentDashboard";
import "./Login.css";

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStudentDashboard, setShowStudentDashboard] = useState(false);

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
      {/* Student Dashboard Button */}
      <button
        onClick={() => setShowStudentDashboard(true)}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
          transition: 'all 0.3s',
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.35)';
        }}
      >
        <FiUsers size={20} />
        Late Students Today
      </button>

      {/* Student Portal Button */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'student-portal' } }))}
        style={{
          position: 'absolute',
          top: '5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
          transition: 'all 0.3s',
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.35)';
        }}
      >
        <FiLogIn size={20} />
        Student Portal
      </button>

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
            <img 
              src="/logo.png" 
              alt="ANITS Logo" 
              style={{
                width: "120px",
                height: "120px",
                objectFit: "contain",
                filter: "drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))"
              }}
            />
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

      {/* Student Dashboard Modal */}
      {showStudentDashboard && (
        <StudentDashboard onClose={() => setShowStudentDashboard(false)} />
      )}
    </div>
  );
}

export default Login;
