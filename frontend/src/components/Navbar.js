import React from "react";
import { FiBookOpen, FiUser, FiClock, FiLogOut } from 'react-icons/fi';
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
    <nav className="professional-navbar">
      <div className="flex-between">
        <div style={{ display: "flex", alignItems: "center", gap: "1.125rem" }}>
          <div className="navbar-brand-logo">
            <FiBookOpen size={26} />
          </div>
          <div>
            <h2 className="navbar-title">
              Student Late Tracker
            </h2>
            <p style={{ 
              margin: 0, 
              color: "#64748b", 
              fontSize: "0.85rem",
              fontWeight: "600",
              letterSpacing: "0.3px"
            }}>
              Real-time Attendance Management
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          {user ? (
            <>
              <div className="user-info-badge">
                <span style={{ 
                  color: "#1e40af", 
                  fontSize: "0.975rem", 
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem"
                }}>
                  <FiUser size={18} />
                  {getUserDisplayName()}
                </span>
                <span style={{ 
                  color: "#3b82f6", 
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  marginTop: "0.375rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <FiClock size={14} />
                  {getLoginDuration()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="logout-button"
              >
                <FiLogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <span style={{ 
              color: "#64748b", 
              fontSize: "0.95rem",
              fontWeight: "500",
              padding: "0.875rem 1.5rem",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0"
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
