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
 justifyContent: "center",
 display: "flex",
 alignItems: "center",
 flexDirection: "column",
 gap: "0.75rem",
 position: "relative"
 }}>
 <div style={{
 width: isOpen ? "80px" : "50px",
 height: isOpen ? "80px" : "50px",
 transition: "all 0.3s ease",
 display: "flex",
 alignItems: "center",
 justifyContent: "center"
 }}>
 <img 
 src="/logo.png" 
 alt="ANITS Logo" 
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
 
 {/* Toggle Button - Positioned at bottom of sidebar */}
 {!isMobile && (
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
 className="sidebar-toggle-btn"
 style={{
 width: isOpen ? "auto" : "40px",
 height: "40px",
 padding: isOpen ? "0.5rem 1rem" : "0.5rem",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 gap: "0.5rem"
 }}
 >
 {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
 {isOpen && <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>Collapse</span>}
 </button>
 </div>
 )}

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
 title={!isOpen ? item.title : ''}
 style={{
 justifyContent: isOpen ? "flex-start" : "center",
 animationDelay: `${index * 0.1}s`,
 padding: isOpen ? "1rem 1.25rem" : "0.75rem"
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
 <p style={{ margin: 0, color: "#64748b", fontSize: "0.7rem" }}>v3.1.0 Production</p>
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
