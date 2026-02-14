import React, { useState, useEffect } from "react";
import PrefetchedStudentForm from "./components/PrefetchedStudentForm";
import LateList from "./components/LateList";
import Record from "./components/Record";
import Analytics from "./components/Analytics";
import AIInsights from "./components/AIInsights";
import AdminManagement from "./components/AdminManagement";
import StudentManagement from "./components/StudentManagement";
import StudentProfile from "./components/StudentProfile";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import FacultyRegister from "./components/FacultyRegister";
import FacultyDirectory from "./components/FacultyDirectory";
import { isAuthenticated } from "./utils/auth";
import { useDarkMode } from "./context/DarkModeContext";

function App() {
  // Get last page from localStorage, default to "mark-late"
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('lastPage') || "mark-late";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
    // Save current page to localStorage
    localStorage.setItem('lastPage', pageId);
  };

  const handleLogin = (username) => {
    setAuthenticated(true);
    console.log(`Faculty ${username} logged in successfully`);
    console.log('JWT Token:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing');
    console.log('Auth Data:', localStorage.getItem('facultyAuth'));
  };

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.setItem('lastPage', "mark-late"); // Reset to default page on logout
    setCurrentPage("mark-late");
    console.log("User logged out");
  };

  // Check authentication status on app load
  useEffect(() => {
    // Check if we have the new JWT token system
    const hasJWT = localStorage.getItem('jwt_token');
    const oldAuth = sessionStorage.getItem('facultyAuth');
    
    // If old session storage exists but no JWT, clear it (migration)
    if (oldAuth && !hasJWT) {
      console.log('Clearing old authentication data...');
      sessionStorage.removeItem('facultyAuth');
      setAuthenticated(false);
    } else {
      setAuthenticated(isAuthenticated());
    }
  }, []);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(!event.detail.shouldOpen);
    };

    const handleNavigate = (event) => {
      const { page } = event.detail || {};
      if (page) {
        setCurrentPage(page);
        localStorage.setItem('lastPage', page);
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    window.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "mark-late":
        return (
          <div>
            <PrefetchedStudentForm />
          </div>
        );

      case "late-today":
        return (
          <div>
            <div style={{
              textAlign: "center",
              marginBottom: "3rem"
            }}>
              <h1 style={{
                color: "#343a40",
                fontSize: "2.5rem",
                fontWeight: "700",
                marginBottom: "0.5rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                Late Students Today
              </h1>
              <p style={{
                color: "#6c757d",
                fontSize: "1.1rem",
                margin: "0"
              }}>
                View and manage today's late arrivals
              </p>
            </div>
            <LateList />
          </div>
        );

      case "records":
        return (
          <div>
            <div style={{
              textAlign: "center",
              marginBottom: "3rem"
            }}>
              <h1 style={{
                color: "#343a40",
                fontSize: "2.5rem",
                fontWeight: "700",
                marginBottom: "0.5rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                Attendance Records
              </h1>
              <p style={{
                color: "#6c757d",
                fontSize: "1.1rem",
                margin: "0"
              }}>
                Analyze attendance patterns and generate reports
              </p>
            </div>
            <Record />
          </div>
        );

      case "analytics":
        return <Analytics />;
      case "student-profile":
        return <StudentProfile />;
      case "ai-insights":
        return <AIInsights />;
      case "student-management":
        return (
          <div>
            <StudentManagement />
          </div>
        );
      case "register-faculty":
        return <FacultyRegister onNavigate={setCurrentPage} />;
      case "faculty-directory":
        return <FacultyDirectory onNavigate={setCurrentPage} />;
      case "admin":
        return (
          <div>
            <div style={{
              textAlign: "center",
              marginBottom: "3rem"
            }}>
              <h1 style={{
                color: "#dc3545",
                fontSize: "2.5rem",
                fontWeight: "700",
                marginBottom: "0.5rem",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                ⚙️ Admin Management
              </h1>
              <p style={{
                color: "#6c757d",
                fontSize: "1.1rem",
                margin: "0"
              }}>
                Semester promotion, data management & system operations
              </p>
            </div>
            <AdminManagement />
          </div>
        );

      default:
        return <PrefetchedStudentForm />;
    }
  };

  // Show login screen if not authenticated
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: isDarkMode ? "#0f172a" : "#f8f9fa",
      display: "flex",
      position: "relative"
    }}>
      {/* Mobile Sidebar Overlay Backdrop */}
      {!sidebarCollapsed && isMobile && (
        <div
          onClick={() => window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { shouldOpen: false } }))}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1500,
            animation: "fadeIn 0.3s ease-out"
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      
      {/* Main Content */}
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? "70px" : "280px"),
        flex: 1,
        transition: "margin-left 0.3s ease",
        width: "100%"
      }}>
        <Navbar onLogout={handleLogout} />
        
        <div style={{
          padding: isMobile ? "1rem" : "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%"
        }}>
          {renderCurrentPage()}

          <footer style={{
            textAlign: "center",
            marginTop: isMobile ? "2rem" : "4rem",
            padding: isMobile ? "1rem" : "2rem",
            color: isDarkMode ? "#94a3b8" : "#6c757d",
            fontSize: "0.9rem"
          }}>
            <p style={{ margin: "0" }}>
              Prototype project built by C.S.V - CSE(AI&ML) dept
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;