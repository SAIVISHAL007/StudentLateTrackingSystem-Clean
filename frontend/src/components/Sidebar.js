import React, { useState } from "react";

function Sidebar({ currentPage, onPageChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      icon: "🕐",
      title: "Mark Student Late",
      description: "Record late arrivals"
    },
    {
      id: "late-today",
      icon: "📋",
      title: "Late Students Today",
      description: "View today's late students"
    },
    {
      id: "records",
      icon: "📊",
      title: "Late Records",
      description: "Weekly, monthly & semester reports"
    },
      {
        id: "analytics",
        icon: "📈",
        title: "Live Analytics",
        description: "Real-time insights & leaderboards"
      },
    {
      id: "admin",
      icon: "⚙️",
      title: "Admin Management",
      description: "Semester promotion & data management"
    }
  ];

  const adminItems = [
    {
      id: 'faculty-directory',
      icon: '👥',
      title: 'Faculty Directory',
      description: 'View & manage faculty accounts'
    }
  ];

  const menuItems = role === 'admin' || role === 'superadmin'
    ? [...baseItems.slice(0, -1), ...adminItems, baseItems[baseItems.length - 1]]
    : baseItems;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Dispatch custom event to notify App component about sidebar state change
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { collapsed: !isCollapsed } }));
  };

  return (
    <div style={{
      position: "fixed",
      left: 0,
      top: 0,
      height: "100vh",
      width: isCollapsed ? "80px" : "300px",
      background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
      color: "white",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      boxShadow: "4px 0 30px rgba(0,0,0,0.3)",
      borderRight: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      {/* Header */}
      <div style={{
        padding: "1.5rem",
        borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: isCollapsed ? "center" : "space-between",
        background: "rgba(0, 0, 0, 0.2)"
      }}>
        {!isCollapsed && (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
              }}>
                📚
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: "1.3rem",
                fontWeight: "800",
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
              paddingLeft: "48px"
            }}>
              Navigation
            </p>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            fontSize: "1.25rem",
            cursor: "pointer",
            padding: "0.6rem",
            borderRadius: "10px",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
            e.target.style.transform = "scale(1)";
          }}
        >
          {isCollapsed ? "☰" : "✕"}
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
            onClick={() => onPageChange(item.id)}
            style={{
              padding: isCollapsed ? "1.25rem 0" : "1.25rem 1rem",
              margin: "0.5rem 0",
              borderRadius: "14px",
              cursor: "pointer",
              background: currentPage === item.id 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "rgba(255, 255, 255, 0.05)",
              border: currentPage === item.id
                ? "2px solid rgba(255, 255, 255, 0.2)"
                : "2px solid transparent",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              gap: isCollapsed ? 0 : "1rem",
              justifyContent: isCollapsed ? "center" : "flex-start",
              boxShadow: currentPage === item.id 
                ? "0 8px 20px rgba(102, 126, 234, 0.3)"
                : "none",
              animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
              position: "relative",
              overflow: "hidden"
            }}
            onMouseOver={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "translateX(8px)";
              } else {
                e.currentTarget.style.transform = "translateX(4px) scale(1.02)";
              }
            }}
            onMouseOut={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.transform = "translateX(0)";
              } else {
                e.currentTarget.style.transform = "translateX(0) scale(1)";
              }
            }}
          >
            <div style={{
              fontSize: "1.75rem",
              filter: currentPage === item.id ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none",
              transition: "all 0.3s ease"
            }}>
              {item.icon}
            </div>
            {!isCollapsed && (
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
            {currentPage === item.id && !isCollapsed && (
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
        {!isCollapsed && (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <p style={{ margin: "0 0 0.25rem 0" }}>© 2025 ANITS</p>
            <p style={{ margin: 0, color: "#64748b" }}>v2.0.0</p>
          </div>
        )}
        {isCollapsed && (
          <div style={{ fontSize: "1rem" }}>⚡</div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;