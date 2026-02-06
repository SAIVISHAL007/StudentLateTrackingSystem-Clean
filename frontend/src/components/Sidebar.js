import React, { useState, useEffect } from "react";
import { 
  FiUserCheck, 
  FiClock, 
  FiBarChart2, 
  FiTrendingUp, 
  FiSettings, 
  FiUsers, 
  FiMenu, 
  FiX,
  FiBookOpen,
  FiZap,
  FiActivity
} from 'react-icons/fi';

function Sidebar({ currentPage, onPageChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true); // Always open on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleSidebarToggle = (event) => {
      if (isMobile) {
        setIsOpen(event.detail.shouldOpen !== undefined ? event.detail.shouldOpen : !isOpen);
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, [isOpen, isMobile]);
  let role = 'faculty';
  try {
    const authRaw = localStorage.getItem('facultyAuth');
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      if (parsed.role) role = parsed.role;
    }
  } catch {}

  const baseItems = [
    {
      id: "mark-late",
      icon: <FiUserCheck size={24} />,
      title: "Mark Student Late",
      description: "Enhanced student selection with filters"
    },
    {
      id: "late-today",
      icon: <FiClock size={24} />,
      title: "Late Students Today",
      description: "View today's late students"
    },
    {
      id: "records",
      icon: <FiBarChart2 size={24} />,
      title: "Late Records",
      description: "Weekly, monthly & semester reports"
    },
    {
      id: "analytics",
      icon: <FiTrendingUp size={24} />,
      title: "Live Analytics",
      description: "Real-time insights & leaderboards"
    },
    {
      id: "ai-insights",
      icon: <FiActivity size={24} />,
      title: "🤖 AI Insights",
      description: "ML-powered predictions & pattern analysis"
    },
    {
      id: "admin",
      icon: <FiSettings size={24} />,
      title: "Admin Management",
      description: "Semester promotion & data management"
    }
  ];

  const adminItems = [
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
  ];

  const menuItems = role === 'admin' || role === 'superadmin'
    ? [...baseItems.slice(0, -1), ...adminItems, baseItems[baseItems.length - 1]]
    : baseItems;

  const toggleSidebar = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: newOpen } }));
  };

  const handleMenuItemClick = (pageId) => {
    onPageChange(pageId);
    // Auto-close sidebar on mobile after selecting an item
    if (isMobile) {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: false } }));
    }
  };

  return (
    <div className="professional-sidebar" style={{
      width: isOpen ? "300px" : "80px",
      ...(isMobile ? {
        position: "fixed",
        left: isOpen ? "0" : "-300px",
        opacity: isOpen ? "1" : "0",
        pointerEvents: isOpen ? "auto" : "none",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 2000
      } : {})
    }}>
      {/* Header */}
      <div className="sidebar-header" style={{
        justifyContent: isOpen ? "space-between" : "center",
        display: "flex",
        alignItems: "center"
      }}>
        {isOpen && (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              marginBottom: "0.5rem"
            }}>
              <div className="navbar-brand-logo" style={{
                width: "42px",
                height: "42px",
                fontSize: "1.25rem"
              }}>
                <FiBookOpen size={22} />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: "1.35rem",
                fontWeight: "900",
                color: "#ffffff",
                letterSpacing: "-0.5px"
              }}>
                Late Tracker
              </h3>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: "0.8rem", 
              color: "#94a3b8",
              fontWeight: "500",
              paddingLeft: "50px"
            }}>
              Navigation
            </p>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
        >
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <div style={{
        flex: 1,
        padding: "1.5rem 0.75rem",
        overflowY: "auto",
        overflowX: "hidden"
      }}>
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleMenuItemClick(item.id)}
            className={`sidebar-menu-item ${currentPage === item.id ? 'active' : ''}`}
            style={{
              justifyContent: isOpen ? "flex-start" : "center",
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className="icon-wrapper icon-lg" style={{
              filter: currentPage === item.id ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none"
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
            <p style={{ margin: "0 0 0.25rem 0", fontWeight: "600" }}>© 2026 ANITS</p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.7rem" }}>v2.0.0 Professional</p>
          </div>
        )}
        {!isOpen && (
          <div className="icon-wrapper">
            <FiZap size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
