import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  FiUserCheck, 
  FiClock, 
  FiTrendingUp, 
  FiSettings, 
  FiUsers, 
  FiMenu, 
  FiX,
  FiZap,
  FiActivity
} from 'react-icons/fi';

// PERFORMANCE: Memoize to prevent unnecessary re-renders from parent
const SidebarComponent = ({ currentPage, onPageChange, isMobile: isMobileProp }) => {
  // Get role once
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

  // Update isOpen when isMobile changes (desktop/mobile switch)
  useEffect(() => {
    if (!isMobileProp) {
      setIsOpen(true); // Always open on desktop
    }
  }, [isMobileProp]);

  // Handle sidebar toggle via custom events
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      if (isMobileProp) {
        setIsOpen(event.detail.shouldOpen !== undefined ? event.detail.shouldOpen : !isOpen);
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, [isOpen, isMobileProp]);

  // PERFORMANCE: Memoize menu items to prevent array recreation
  const baseItems = useMemo(() => [
    {
      id: "mark-late",
      icon: <FiUserCheck size={24} />,
      title: "Mark Student Late",
      description: "Enhanced student selection with filters"
    },
    {
      id: "late-management",
      icon: <FiClock size={24} />,
      title: "Late Management",
      description: "Today's late students & records management"
    },
    {
      id: "analytics",
      icon: <FiTrendingUp size={24} />,
      title: "Live Analytics",
      description: "Real-time insights & leaderboards"
    },
    {
      id: "student-profile",
      icon: <FiUsers size={24} />,
      title: "Student Profile Search",
      description: "Search & view student details"
    },
    {
      id: "ai-insights",
      icon: <FiActivity size={24} />,
      title: " AI Insights",
      description: "ML-powered predictions & pattern analysis"
    },
    {
      id: "admin",
      icon: <FiSettings size={24} />,
      title: "Admin Management",
      description: "Semester promotion & data management"
    }
  ], []);

  const adminItems = useMemo(() => [
    {
      id: "student-management",
      icon: <FiUsers size={24} />,
      title: "Student Master Data",
      description: "Add & manage student records"
    },
    {
      id: 'faculty-directory',
      icon: <FiUsers size={24} />,
      title: 'Faculty Directory',
      description: 'View & manage faculty accounts'
    }
  ], []);

  // PERFORMANCE: Memoize menu items combination
  const menuItems = useMemo(() => {
    return role === 'admin' || role === 'superadmin'
      ? [...baseItems.slice(0, -1), ...adminItems, baseItems[baseItems.length - 1]]
      : baseItems;
  }, [role, baseItems, adminItems]);

  // PERFORMANCE: useCallback for stable function references
  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => {
      const newOpen = !prev;
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: newOpen } }));
      return newOpen;
    });
  }, []);

  const handleMenuItemClick = useCallback((pageId) => {
    onPageChange(pageId);
    // Auto-close sidebar on mobile after selecting an item
    if (isMobileProp) {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: false } }));
    }
  }, [isMobileProp, onPageChange]);

  // Use inline styles for PERFORMANCE on desktop (CSS-in-JS is optimized by React)
  // Only apply transform for mobile animations (GPU acceleration)
  const sidebarStyle = {
    background: "linear-gradient(180deg, #667eea 0%, #5568d3 100%)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    overflow: "hidden",
    ...(isMobileProp ? {
      // MOBILE: Transform-based slide animation
      width: "300px",
      maxWidth: "100vw",
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "transform",
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      pointerEvents: isOpen ? "auto" : "none",
      zIndex: 2000
    } : {
      // DESKTOP: Width-based collapse animation, always visible
      width: isOpen ? "300px" : "80px",
      transition: "width 0.3s ease",
      willChange: "width"
    })
  };

  return (
    <div className="professional-sidebar" style={sidebarStyle}>
      {/* Header */}
      <div style={{
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        gap: "0.75rem",
        position: "relative",
        padding: "1.5rem 1rem",
        borderBottom: "2px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{
          width: isOpen ? "80px" : "50px",
          height: isOpen ? "80px" : "50px",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "width, height"
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
              filter: "drop-shadow(0 2px 8px rgba(102, 126, 234, 0.4))"
            }}
          />
        </div>
        {isOpen && (
          <div style={{ 
            animation: "fadeIn 0.5s ease-out",
            textAlign: "center",
            width: "100%"
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: "1.2rem",
              fontWeight: "900",
              color: "#ffffff",
              letterSpacing: "-0.5px",
              marginBottom: "0.25rem"
            }}>
              Late Tracker
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: "0.75rem", 
              color: "#94a3b8",
              fontWeight: "500"
            }}>
              Navigation Menu
            </p>
          </div>
        )}
      </div>
      
      {/* Toggle Button - Desktop only */}
      {!isMobileProp && (
        <div style={{
          position: "absolute",
          bottom: "80px",
          left: "0",
          right: "0",
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
          zIndex: 10
        }}>
          <button
            onClick={toggleSidebar}
            style={{
              width: isOpen ? "auto" : "40px",
              height: "40px",
              padding: isOpen ? "0.5rem 1rem" : "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              willChange: "background, transform"
            }}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            {isOpen && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* Menu Items */}
      <div style={{
        flex: 1,
        padding: "1.5rem 0.75rem",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain"
      }}>
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleMenuItemClick(item.id)}
            className={`sidebar-menu-item ${currentPage === item.id ? 'active' : ''}`}
            title={!isOpen ? item.title : ''}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: isOpen ? "1rem 1.25rem" : "0.75rem",
              marginBottom: "0.5rem",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              willChange: "background, transform",
              position: "relative",
              background: currentPage === item.id ? "rgba(255, 255, 255, 0.25)" : "transparent",
              justifyContent: isOpen ? "flex-start" : "center",
              animation: `slideIn 0.3s ease-out backwards`,
              animationDelay: `${index * 0.05}s`
            }}
            onMouseEnter={(e) => {
              if (!isMobileProp) {
                e.currentTarget.style.background = currentPage === item.id 
                  ? "rgba(255, 255, 255, 0.3)" 
                  : "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "translateX(4px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobileProp) {
                e.currentTarget.style.background = currentPage === item.id 
                  ? "rgba(255, 255, 255, 0.25)" 
                  : "transparent";
                e.currentTarget.style.transform = "none";
              }
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentPage === item.id ? "white" : "rgba(255, 255, 255, 0.8)",
              flexShrink: 0,
              fontSize: "1.5rem"
            }}>
              {item.icon}
            </div>
            {isOpen && (
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  color: currentPage === item.id ? "white" : "#e2e8f0",
                  marginBottom: "0.25rem",
                  letterSpacing: "0.3px"
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: "0.8rem",
                  color: currentPage === item.id ? "rgba(255, 255, 255, 0.9)" : "#94a3b8",
                  fontWeight: "500",
                  lineHeight: "1.4"
                }}>
                  {item.description}
                </div>
              </div>
            )}
            {currentPage === item.id && isOpen && (
              <div style={{
                position: "absolute",
                right: "1rem",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                animation: "pulse 2s ease-in-out infinite"
              }} />
            )}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div style={{
        padding: "1rem",
        borderTop: "2px solid rgba(255, 255, 255, 0.1)",
        background: "rgba(0, 0, 0, 0.2)",
        fontSize: "0.75rem",
        color: "#94a3b8",
        textAlign: "center",
        fontWeight: "500"
      }}>
        {isOpen && (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <p style={{ margin: "0 0 0.25rem 0", fontWeight: "600", color: "white" }}>© 2026 ANITS</p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.7rem" }}>v3.1.0 Production</p>
          </div>
        )}
        {!isOpen && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <FiZap size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

// PERFORMANCE: Memoize component to prevent re-renders from parent
export default React.memo(SidebarComponent);
