import React, { useState, useEffect, useCallback } from "react";
import { FiSettings } from "react-icons/fi";
import PrefetchedStudentForm from "./components/PrefetchedStudentForm";
import CombinedLateView from "./components/CombinedLateView";
import Analytics from "./components/Analytics";
import AIInsights from "./components/AIInsights";
import AdminManagement from "./components/AdminManagement";
import StudentManagement from "./components/StudentManagement";
import StudentProfile from "./components/StudentProfile";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import FacultyDirectory from "./components/FacultyDirectory";
import StudentPortal from "./components/StudentPortal";
import { isAuthenticated } from "./utils/auth";
import { useDarkMode } from "./context/DarkModeContext";
import { useMediaQuery } from "./hooks/useMediaQuery";

function App() {
  // Get last page from localStorage, default to "mark-late"
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('lastPage') || "mark-late";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  // PERFORMANCE: Use custom useMediaQuery hook instead of resize listener
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isDarkMode } = useDarkMode();

  // PERFORMANCE: useCallback for stable function reference
  const handlePageChange = useCallback((pageId) => {
    setCurrentPage(pageId);
    // Save current page to localStorage
    localStorage.setItem('lastPage', pageId);
  }, []);

  const handleLogin = useCallback((username) => {
    setAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthenticated(false);
    localStorage.setItem('lastPage', "mark-late"); // Reset to default page on logout
    setCurrentPage("mark-late");
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    // Check if we have the new JWT token system
    const hasJWT = localStorage.getItem('jwt_token');
    const oldAuth = sessionStorage.getItem('facultyAuth');
    
    // If old session storage exists but no JWT, clear it (migration)
    if (oldAuth && !hasJWT) {
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

      case "late-management":
        return <CombinedLateView />;

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
      case "faculty-directory":
        return <FacultyDirectory onNavigate={setCurrentPage} />;
      case "student-portal":
        return <StudentPortal />;
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
                <FiSettings style={{ marginRight: '0.5rem', display: 'inline' }} /> Management
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
      {/* Mobile Sidebar Overlay Backdrop - ONLY show if sidebar is open */}
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
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} isMobile={isMobile} />
      
      {/* Main Content */}
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? "80px" : "300px"),
        flex: 1,
        transition: "margin-left 0.3s ease",
        width: isMobile ? "100%" : "calc(100% - " + (sidebarCollapsed ? "80px" : "300px") + ")",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        <Navbar onLogout={handleLogout} />
        
        <div style={{
          padding: isMobile ? "1rem" : "2rem",
          maxWidth: "100%",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
          overflow: "auto"
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