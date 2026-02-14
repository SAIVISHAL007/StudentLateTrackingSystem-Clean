import React, { useState, useEffect } from "react";
import { FiUser, FiClock, FiLogOut, FiMenu, FiMoon, FiSun } from 'react-icons/fi';
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
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
        </div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            height: isMobile ? "64px" : "96px",
            padding: isMobile ? "0.25rem 0.5rem" : "0.35rem 0.85rem",
            borderRadius: "14px",
            background: "rgba(102, 126, 234, 0.06)",
            boxShadow: "0 0 24px rgba(102, 126, 234, 0.2)",
            maxWidth: "100%"
          }}>
            <img
              src="/brandingHeader.png"
              alt="ANITS Header"
              style={{
                height: "100%",
                width: "auto",
                objectFit: "contain",
                maxWidth: "100%",
                filter: "drop-shadow(0 3px 10px rgba(102, 126, 234, 0.2))"
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "flex-end" }}>
          <button
            onClick={toggleDarkMode}
            className="dark-mode-toggle"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          {user ? (
            <>
              <div className="user-info-badge" style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                padding: isMobile ? "0.5rem 0.75rem" : "0.625rem 1rem",
                background: "rgba(102, 126, 234, 0.08)",
                borderRadius: "8px",
                border: "1px solid rgba(102, 126, 234, 0.15)"
              }}>
                <span style={{
                  color: "#1e40af",
                  fontSize: isMobile ? "0.7rem" : "0.875rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}>
                  <FiUser size={isMobile ? 14 : 16} />
                  {isMobile ? getUserDisplayName().split(' ')[0] : getUserDisplayName()}
                </span>
                {!isMobile && (
                  <span style={{
                    color: "#3b82f6",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}>
                    <FiClock size={12} />
                    {getLoginDuration()}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="logout-button"
                style={{
                  padding: isMobile ? "8px 12px" : "0.625rem 1.25rem",
                  fontSize: isMobile ? "inherit" : "0.875rem"
                }}
              >
                {isMobile ? <FiLogOut size={20} /> : (
                  <>
                    <FiLogOut size={16} />
                    Logout
                  </>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
