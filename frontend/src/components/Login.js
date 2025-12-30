import React, { useState } from "react";
import API from "../services/api";

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
      
      setError(`❌ ${errorMessage}`);
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: 0.1
      }}>
        <div style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "white",
          animation: "float 6s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "white",
          animation: "float 8s ease-in-out infinite"
        }} />
      </div>

      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        padding: "3rem",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        width: "100%",
        maxWidth: "480px",
        animation: "scaleIn 0.5s ease-out",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo/Header Section */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 1.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
            boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
            animation: "float 3s ease-in-out infinite"
          }}>
            🎓
          </div>
          <h1 style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "2.25rem",
            fontWeight: "800",
            marginBottom: "0.5rem",
            letterSpacing: "-0.5px"
          }}>
            Faculty Login
          </h1>
          <p style={{
            color: "#64748b",
            fontSize: "1.05rem",
            margin: "0",
            fontWeight: "500"
          }}>
            ANITS Student Late Tracking System
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" style={{ width: "100%", display: "block" }}>
          <div style={{ marginBottom: "1.75rem", width: "100%", display: "block", boxSizing: "border-box" }}>
            <label style={{
              display: "block",
              marginBottom: "0.75rem",
              color: "#334155",
              fontWeight: "600",
              fontSize: "0.95rem",
              letterSpacing: "0.3px"
            }}>
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
              style={{
                width: "100%",
                minWidth: "100%",
                maxWidth: "100%",
                padding: "14px 18px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                outline: "none",
                background: "white",
                boxSizing: "border-box",
                display: "block",
                fontFamily: "inherit",
                color: "#2d3748"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "1.75rem", width: "100%", display: "block", boxSizing: "border-box" }}>
            <label style={{
              display: "block",
              marginBottom: "0.75rem",
              color: "#334155",
              fontWeight: "600",
              fontSize: "0.95rem",
              letterSpacing: "0.3px"
            }}>
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
              style={{
                width: "100%",
                minWidth: "100%",
                maxWidth: "100%",
                padding: "14px 18px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                outline: "none",
                background: "white",
                boxSizing: "border-box",
                display: "block",
                fontFamily: "inherit",
                color: "#2d3748"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "12px",
              border: "2px solid #fca5a5",
              marginBottom: "1.75rem",
              fontSize: "0.95rem",
              fontWeight: "500",
              animation: "slideInRight 0.4s ease-out"
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: loading
                ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "1.05rem",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: loading
                ? "0 4px 15px rgba(100, 116, 139, 0.3)"
                : "0 4px 15px rgba(102, 126, 234, 0.4)",
              letterSpacing: "0.5px",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
              }
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span className="spinner" style={{
                  width: "20px",
                  height: "20px",
                  border: "3px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  display: "inline-block"
                }} />
                Logging in...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                🔑 Login to Dashboard
              </span>
            )}
          </button>

          {/* Auxiliary Info */}
          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div style={{
              background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
              border: "1px solid #bae6fd",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: ".85rem",
              color: "#0c4a6e",
              lineHeight: 1.6,
              fontWeight: 500
            }}>
              New faculty accounts and password resets are handled only by the <strong>Admin Office / Superadmin</strong>.<br />
              If you need access or forgot your password, contact the system administrator.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;