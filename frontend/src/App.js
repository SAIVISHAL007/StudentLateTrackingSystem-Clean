import React, { useState, useEffect } from "react";
import StudentForm from "./components/StudentForm";
import LateList from "./components/LateList";
import Record from "./components/Record";
import Analytics from "./components/Analytics";
import AdminManagement from "./components/AdminManagement";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import FacultyRegister from "./components/FacultyRegister";
import FacultyDirectory from "./components/FacultyDirectory";
import Toast from "./components/Toast";
import { isAuthenticated } from "./utils/auth";

function App() {
  const [currentPage, setCurrentPage] = useState("mark-late");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };

  const handleLogin = (username) => {
    setAuthenticated(true);
    console.log(`✅ Faculty ${username} logged in successfully`);
    console.log('JWT Token:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing');
    console.log('Auth Data:', localStorage.getItem('facultyAuth'));
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setCurrentPage("mark-late"); // Reset to default page
    console.log("👋 User logged out");
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
      setSidebarCollapsed(event.detail.collapsed);
    };

    const handleNavigate = (event) => {
      const { page } = event.detail || {};
      if (page) setCurrentPage(page);
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
                🎓 Student Late Attendance Tracking
              </h1>
              <p style={{
                color: "#6c757d",
                fontSize: "1.1rem",
                margin: "0"
              }}>
                Mark students as late and track attendance
              </p>
            </div>
            <StudentForm />
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
                📋 Late Students Today
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
                📊 Attendance Records
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
        return <StudentForm />;
    }
  };

  // Show login screen if not authenticated
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Toast />
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex"
      }}>
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      
      {/* Main Content */}
      <div style={{
        marginLeft: sidebarCollapsed ? "70px" : "280px", // Account for sidebar width
        flex: 1,
        transition: "margin-left 0.3s ease"
      }}>
        <Navbar onLogout={handleLogout} />
        
        <div style={{
          padding: "2rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {renderCurrentPage()}

          <footer style={{
            textAlign: "center",
            marginTop: "4rem",
            padding: "2rem",
            color: "#6c757d",
            fontSize: "0.9rem"
          }}>
            <p style={{ margin: "0" }}>
              🚀 Prototype project built by Chelluri Sai Vishal
            </p>
          </footer>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;