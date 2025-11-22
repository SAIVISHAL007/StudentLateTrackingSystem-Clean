import React from "react";
import { getCurrentUser, logout, getUserDisplayName, getLoginDuration } from "../utils/auth";

function Navbar({ onLogout }) {
  const user = getCurrentUser();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      if (onLogout) onLogout();
    }
  };

  return (
    <nav style={{
      background: "rgba(255, 255, 255, 0.98)",
      backdropFilter: "blur(20px)",
      padding: "1.25rem 2rem",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      marginBottom: "2rem",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      borderRadius: "16px",
      animation: "slideInRight 0.5s ease-out"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        maxWidth: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "50px",
            height: "50px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
            animation: "float 3s ease-in-out infinite"
          }}>
            📚
          </div>
          <div>
            <h2 style={{ 
              margin: 0,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "1.5rem",
              fontWeight: "800",
              letterSpacing: "-0.5px"
            }}>
              Student Late Tracker
            </h2>
            <p style={{ 
              margin: 0, 
              color: "#64748b", 
              fontSize: "0.8rem",
              fontWeight: "500"
            }}>
              Real-time Attendance Management
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          {user ? (
            <>
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "flex-end",
                padding: "0.75rem 1.25rem",
                background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
                borderRadius: "12px",
                border: "2px solid #bfdbfe"
              }}>
                <span style={{ 
                  color: "#1e40af", 
                  fontSize: "0.95rem", 
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span style={{ fontSize: "1.25rem" }}>👨‍🏫</span>
                  {getUserDisplayName()}
                </span>
                <span style={{ 
                  color: "#3b82f6", 
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  marginTop: "0.25rem"
                }}>
                  ⏱️ {getLoginDuration()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-danger"
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  fontWeight: "700",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  letterSpacing: "0.3px"
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.3)";
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🚪</span>
                Logout
              </button>
            </>
          ) : (
            <span style={{ 
              color: "#64748b", 
              fontSize: "0.95rem",
              fontWeight: "500",
              padding: "0.75rem 1.25rem",
              background: "#f8fafc",
              borderRadius: "12px"
            }}>
              Track attendance and manage late arrivals
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;