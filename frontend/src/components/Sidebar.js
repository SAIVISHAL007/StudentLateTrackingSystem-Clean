import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  FiUserCheck, 
  FiClock, 
  FiTrendingUp, 
  FiSettings, 
  FiUsers, 
  FiZap,
  FiActivity,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const SidebarComponent = ({ currentPage, onPageChange, isMobile: isMobileProp }) => {
  const role = useMemo(() => {
    let roleValue = 'faculty';
    try {
      const authRaw = localStorage.getItem('facultyAuth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed.role) roleValue = parsed.role;
      }
    } catch {}
    return roleValue;
  }, []);

  const [isOpen, setIsOpen] = useState(!isMobileProp);

  useEffect(() => {
    if (!isMobileProp) setIsOpen(true);
  }, [isMobileProp]);

  useEffect(() => {
    const handleSidebarToggle = (event) => {
      if (isMobileProp) {
        setIsOpen(event.detail.shouldOpen !== undefined ? event.detail.shouldOpen : !isOpen);
      }
    };
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, [isOpen, isMobileProp]);

  const baseItems = useMemo(() => [
    {
      id: "mark-late",
      icon: <FiUserCheck size={19} />,
      title: "Mark Late",
      description: "Mark student late arrival",
      color: "#f97316",
      activeBg: "#fff7ed"
    },
    {
      id: "late-management",
      icon: <FiClock size={19} />,
      title: "Late Management",
      description: "Today's list & history",
      color: "#d97706",
      activeBg: "#fffbeb"
    },
    {
      id: "analytics",
      icon: <FiTrendingUp size={19} />,
      title: "Analytics",
      description: "Real-time insights",
      color: "#0d9488",
      activeBg: "#f0fdfa"
    },
    {
      id: "student-profile",
      icon: <FiUsers size={19} />,
      title: "Student Profile",
      description: "Search student records",
      color: "#10b981",
      activeBg: "#ecfdf5"
    },
    {
      id: "ai-insights",
      icon: <FiActivity size={19} />,
      title: "AI Insights",
      description: "ML risk predictions",
      color: "#0d9488",
      activeBg: "#f0fdfa"
    },
    {
      id: "admin",
      icon: <FiSettings size={19} />,
      title: "Admin Control",
      description: "System management",
      color: "#ef4444",
      activeBg: "#fef2f2"
    }
  ], []);

  const adminItems = useMemo(() => [
    {
      id: "student-management",
      icon: <FiUsers size={19} />,
      title: "Student Data",
      description: "Add & manage students",
      color: "#0d9488",
      activeBg: "#f0fdfa"
    },
    {
      id: 'faculty-directory',
      icon: <FiUsers size={19} />,
      title: 'Faculty Directory',
      description: 'Manage faculty accounts',
      color: "#d97706",
      activeBg: "#fffbeb"
    }
  ], []);

  const menuItems = useMemo(() => {
    return role === 'admin' || role === 'superadmin'
      ? [...baseItems.slice(0, -1), ...adminItems, baseItems[baseItems.length - 1]]
      : baseItems;
  }, [role, baseItems, adminItems]);

  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => {
      const newOpen = !prev;
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: newOpen } }));
      return newOpen;
    });
  }, []);

  const handleMenuItemClick = useCallback((pageId) => {
    onPageChange(pageId);
    if (isMobileProp) {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: false } }));
    }
  }, [isMobileProp, onPageChange]);

  /* ========== ELEGANT LIGHT SIDEBAR ========== */
  const sidebarStyle = {
    background: "linear-gradient(180deg, #f1f5f8 0%, #e2e8f0 100%)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    overflow: "hidden",
    boxShadow: "3px 0 20px rgba(0,0,0,0.05), 1px 0 0 #cbd5e1",
    borderRight: "1px solid #cbd5e1",
    ...(isMobileProp ? {
      width: "270px",
      maxWidth: "85vw",
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "transform",
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      pointerEvents: isOpen ? "auto" : "none",
      zIndex: 2000
    } : {
      width: isOpen ? "260px" : "72px",
      transition: "width 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "width"
    })
  };

  return (
    <div className="professional-sidebar" style={sidebarStyle}>
      
      {/* ===== HEADER WITH COLLEGE LOGO ===== */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: isOpen ? "0.875rem" : "0",
        justifyContent: isOpen ? "flex-start" : "center",
        padding: isOpen ? "1.25rem 1.125rem 1.125rem" : "1.25rem 0.75rem 1.125rem",
        borderBottom: "1px solid #cbd5e1",
        background: "rgba(15, 23, 42, 0.02)",
        flexShrink: 0,
        overflow: "hidden",
        transition: "all 0.3s ease",
        minHeight: "86px" 
      }}>
        {/* College Logo — prominent branding size */}
        <div style={{
          width: isOpen ? "62px" : "46px",
          height: isOpen ? "62px" : "46px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #ffffff, #fef7ed)",
          borderRadius: "15px",
          border: "2px solid #fed7aa",
          boxShadow: "0 3px 12px rgba(249,115,22,0.12), 0 0 0 3px rgba(249,115,22,0.05)",
          overflow: "hidden",
          transition: "all 0.3s ease"
        }}>
          <img
            src="/logo.png"
            alt="ANITS Logo"
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "4px"
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #f97316, #f59e0b)';
              e.target.parentElement.innerHTML = '<span style="color:white;font-size:1.5rem;">🎓</span>';
            }}
          />
        </div>

        {isOpen && (
          <div style={{ animation: "fadeIn 0.25s ease-out", overflow: "hidden", minWidth: 0 }}>
            <div style={{
              fontSize: "1.05rem",
              fontWeight: "800",
              color: "#1a1a1a",
              letterSpacing: "-0.3px",
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: "nowrap"
            }}>
              Late Tracker
            </div>
            <div style={{
              fontSize: "0.67rem",
              color: "#f97316",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              marginTop: "2px"
            }}>
              ANITS · Portal
            </div>
          </div>
        )}
      </div>

      {/* ===== MENU ITEMS ===== */}
      <div style={{
        flex: 1,
        padding: "0.875rem 0.625rem",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain"
      }}>
        {menuItems.map((item, index) => {
          const isActive = currentPage === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
              title={!isOpen ? item.title : ''}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
                padding: isOpen ? "0.8rem 1rem" : "0.75rem",
                marginBottom: "0.25rem",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                background: isActive ? item.activeBg : "transparent",
                border: `1.5px solid ${isActive ? item.color + '30' : 'transparent'}`,
                justifyContent: isOpen ? "flex-start" : "center",
                animation: "slideIn 0.28s ease-out backwards",
                animationDelay: `${index * 0.04}s`,
                boxShadow: isActive ? `0 2px 8px ${item.color}15` : "none"
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.transform = "translateX(3px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {/* Active left bar indicator */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  left: "-0.625rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3.5px",
                  height: "55%",
                  background: `linear-gradient(180deg, ${item.color}, ${item.color}99)`,
                  borderRadius: "0 3px 3px 0",
                  boxShadow: `0 0 8px ${item.color}55`
                }} />
              )}

              {/* Icon */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? item.color : "#8c8578",
                flexShrink: 0,
                width: "21px",
                transition: "all 0.2s ease"
              }}>
                {item.icon}
              </div>

              {/* Labels */}
              {isOpen && (
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? "700" : "600",
                    color: isActive ? "#1a1a1a" : "#5a544d",
                    letterSpacing: "0.1px",
                    whiteSpace: "nowrap",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "color 0.2s ease"
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: "0.7rem",
                    color: isActive ? "#8c8578" : "#b0a99f",
                    fontWeight: "500",
                    marginTop: "1px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {item.description}
                  </div>
                </div>
              )}

              {/* Active dot for collapsed state */}
              {isActive && !isOpen && (
                <div style={{
                  position: "absolute",
                  top: "7px",
                  right: "7px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}88`
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ===== COLLAPSE TOGGLE (desktop) ===== */}
      {!isMobileProp && (
        <div style={{
          padding: "0.625rem",
          display: "flex",
          justifyContent: isOpen ? "flex-end" : "center",
          borderTop: "1px solid #cbd5e1"
        }}>
          <button
            onClick={toggleSidebar}
            style={{
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.5)",
              border: "1px solid #cbd5e1",
              borderRadius: "9px",
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#94a3b8";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            {isOpen ? <FiChevronLeft size={15} /> : <FiChevronRight size={15} />}
          </button>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div style={{
        padding: "0.75rem 0.875rem",
        borderTop: "1px solid #cbd5e1",
        textAlign: "center",
        background: "rgba(15, 23, 42, 0.02)",
        flexShrink: 0
      }}>
        {isOpen ? (
          <div style={{ animation: "fadeIn 0.25s ease-out" }}>
            <p style={{
              margin: "0 0 2px",
              fontWeight: "700",
              color: "#f97316",
              fontSize: "0.7rem",
              fontFamily: "'Space Grotesk', sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.6px"
            }}>© 2026 ANITS</p>
            <p style={{ margin: 0, color: "#b0a99f", fontSize: "0.62rem", fontWeight: "500" }}>
              v4.0.0-beta.0
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FiZap size={14} color="rgba(249,115,22,0.35)" />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(SidebarComponent);
