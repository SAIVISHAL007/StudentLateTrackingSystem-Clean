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
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)',
          transition: 'all 0.25s',
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.3)';
        }}
      >
        <FiUsers size={18} />
        Late Students Today
      </button>

      {/* Student Portal Button */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'student-portal' } }))}
        style={{
          position: 'absolute',
          top: '5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)',
          transition: 'all 0.25s',
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 148, 136, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(13, 148, 136, 0.3)';
        }}
      >
        <FiLogIn size={18} />
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

      {/* Flowing Wave — bottom decoration */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '180px',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        <svg 
          viewBox="0 0 1440 180" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            bottom: 0,
            width: '200%',
            height: '100%',
            animation: 'waveSlide 18s linear infinite'
          }}
          preserveAspectRatio="none"
        >
          <path d="M0,120 C240,60 480,180 720,120 C960,60 1200,180 1440,120 C1680,60 1920,180 2160,120 C2400,60 2640,180 2880,120 L2880,180 L0,180 Z" fill="rgba(249,115,22,0.06)" />
          <path d="M0,140 C200,90 400,170 720,130 C1040,90 1240,170 1440,140 C1640,110 1840,175 2160,130 C2480,85 2680,170 2880,140 L2880,180 L0,180 Z" fill="rgba(13,148,136,0.04)" />
        </svg>
        <style>{`
          @keyframes waveSlide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      <div className="login-box">
        {/* Logo/Header Section */}
        <div className="login-header">
          <div className="login-logo no-select">
            <img 
              src="/logo.png" 
              alt="ANITS Logo" 
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "6px"
                /* NO filter — show real logo colors */
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
