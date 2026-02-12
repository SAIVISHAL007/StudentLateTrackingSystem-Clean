import React, { useState, useEffect } from "react";
import { FiBookOpen, FiUser, FiClock, FiLogOut, FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import { getCurrentUser, logout, getUserDisplayName, getLoginDuration } from "../utils/auth";
import { useDarkMode } from '../context/DarkModeContext';

function Navbar({ onLogout }) {
  const user = getCurrentUser();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      if (onLogout) onLogout();
    }
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: true } }));
  };

  return (
    <nav className="professional-navbar">
      <div className="flex-between">
        <div style={{ display: "flex", alignItems: "center", gap: "1.125rem" }}>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                cursor: "pointer",
                fontSize: "1.5rem",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "48px",
                minHeight: "48px",
                borderRadius: "10px",
                transition: "all 0.2s ease"
              }}
              onMouseDown={(e) => e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)"}
              onMouseUp={(e) => e.currentTarget.style.background = "none"}
              onTouchStart={(e) => e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)"}
              onTouchEnd={(e) => e.currentTarget.style.background = "none"}
            >
              <FiMenu size={26} />
            </button>
          )}
          <div className="navbar-brand-logo">
            <FiBookOpen size={26} />
          </div>
          {!isMobile && (
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
          )}
        </div>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <button
            onClick={toggleDarkMode}
            className="dark-mode-toggle"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          {user ? (
            <>
              {!isMobile && (
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
              )}
              <button
                onClick={handleLogout}
                className="logout-button"
                style={{
                  padding: isMobile ? "10px 14px" : "auto"
                }}
              >
                {isMobile ? <FiLogOut size={20} /> : (
                  <>
                    <FiLogOut size={18} />
                    Logout
                  </>
                )}
              </button>
            </>
          ) : (
            !isMobile && (
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
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
