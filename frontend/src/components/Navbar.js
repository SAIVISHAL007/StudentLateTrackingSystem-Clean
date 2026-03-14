import React, { useCallback, useState, useEffect } from "react";
import { FiUser, FiClock, FiLogOut, FiMenu, FiShield, FiWifiOff } from 'react-icons/fi';
import { getCurrentUser, logout, getUserDisplayName, getLoginDuration } from "../utils/auth";
import { useMediaQuery } from '../hooks/useMediaQuery';

// eslint-disable-next-line no-unused-vars
import { useDarkMode } from '../context/DarkModeContext';

const NavbarComponent = ({ onLogout }) => {
  const user = getCurrentUser();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      if (onLogout) onLogout();
    }
  }, [onLogout]);

  const toggleSidebar = useCallback(() => {
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: true } }));
  }, []);

  const roleBadge = user?.role ? {
    superadmin: { label: "Super Admin", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
    admin:      { label: "Admin",       color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
    faculty:    { label: "Faculty",     color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" }
  }[user.role] || { label: user.role, color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" } : null;

  return (
    <nav className="professional-navbar" style={{
      background: "rgba(255, 255, 255, 0.98)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid #e8e5df",
      borderRadius: isMobile ? "14px" : "16px",
      padding: isMobile ? "0.375rem 0.75rem" : "0.5rem 1.25rem",
      minHeight: isMobile ? "68px" : "88px",
      marginBottom: isMobile ? "0.875rem" : "1.25rem",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "auto minmax(0, 1fr) auto" : "auto 1fr auto",
        alignItems: "center",
        gap: isMobile ? "0.5rem" : "1rem",
        width: "100%"
      }}>

        {/* Left: Mobile hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#f97316",
                cursor: "pointer",
                padding: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "42px",
                minHeight: "42px",
                borderRadius: "10px",
                transition: "all 0.2s ease"
              }}
              onMouseDown={(e) => { e.currentTarget.style.background = "#ffedd5"; }}
              onMouseUp={(e) => { e.currentTarget.style.background = "#fff7ed"; }}
              onTouchStart={(e) => { e.currentTarget.style.background = "#ffedd5"; }}
              onTouchEnd={(e) => { e.currentTarget.style.background = "#fff7ed"; }}
              title="Toggle sidebar"
            >
              <FiMenu size={21} />
            </button>
          )}
        </div>

        {/* Center: COLLEGE BRANDING HEADER — prominently sized */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minWidth: 0,
          overflow: "hidden"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: isMobile ? "58px" : "80px",
            padding: "0.2rem 0.5rem",
            maxWidth: "100%"
          }}>
            <img
              src="/brandingHeader.png"
              alt="ANITS College Header"
              loading="lazy"
              decoding="async"
              style={{
                height: "100%",
                width: "auto",
                objectFit: "contain",
                maxWidth: "100%"
                /* Original logo colors — no filter */
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const span = document.createElement('span');
                span.textContent = 'ANITS Late Tracker';
                span.style.cssText = `color:#f97316;font-weight:800;font-family:'Space Grotesk',sans-serif;font-size:${isMobile ? '0.95rem' : '1.2rem'};letter-spacing:-0.3px;`;
                e.target.parentNode.appendChild(span);
              }}
            />
          </div>
        </div>

        {/* Right: User controls */}
        <div style={{
          display: "flex",
          gap: isMobile ? "0.35rem" : "0.625rem",
          alignItems: "center",
          justifyContent: "flex-end"
        }}>

          {/* Offline badge */}
          {!isOnline && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "0" : "0.35rem",
              padding: isMobile ? "0.35rem" : "0.35rem 0.7rem",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "0.78rem",
              fontWeight: "600"
            }} title="No internet — offline mode">
              <FiWifiOff size={14} />
              {!isMobile && <span>Offline</span>}
            </div>
          )}

          {user && (
            <>
              {/* Desktop: full user badge */}
              {!isMobile && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  padding: "0.5rem 0.9rem",
                  background: "linear-gradient(145deg, #fafaf8, #fff7ed)",
                  borderRadius: "11px",
                  border: "1px solid #ebe9e4",
                  minWidth: 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                }}>
                  <span style={{
                    color: "#111827",
                    fontSize: "0.825rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    whiteSpace: "nowrap"
                  }}>
                    <FiUser size={13} color="#f97316" />
                    {getUserDisplayName()}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      color: "#6b7280",
                      fontSize: "0.7rem",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}>
                      <FiClock size={10} />
                      {getLoginDuration()}
                    </span>
                    {roleBadge && (
                      <span style={{
                        fontSize: "0.62rem",
                        fontWeight: "700",
                        color: roleBadge.color,
                        background: roleBadge.bg,
                        border: `1px solid ${roleBadge.border}`,
                        padding: "2px 7px",
                        borderRadius: "99px",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        letterSpacing: "0.4px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap"
                      }}>
                        <FiShield size={8} />
                        {roleBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile: compact user badge */}
              {isMobile && (
                <div style={{
                  padding: "0.4rem 0.55rem",
                  background: "#fff7ed",
                  borderRadius: "9px",
                  border: "1px solid #fed7aa",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}>
                  <FiUser size={14} color="#f97316" />
                  <span style={{
                    color: "#111827",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    maxWidth: "65px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {getUserDisplayName().split(' ')[0]}
                  </span>
                </div>
              )}

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="logout-button"
                style={{
                  padding: isMobile ? "0.5rem 0.6rem" : "0.5rem 1rem",
                  fontSize: isMobile ? "0.82rem" : "0.82rem",
                  minHeight: "40px"
                }}
                title="Logout"
              >
                <FiLogOut size={isMobile ? 17 : 14} />
                {!isMobile && <span>Logout</span>}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(NavbarComponent);
