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
import { useMediaQuery } from "./hooks/useMediaQuery";
import { flushQueue, getQueue } from "./utils/offlineQueue";
import API from "./services/api";
import { toast } from "./components/Toast";

function App() {
  // Get last page from localStorage, default to "mark-late"
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('lastPage') || "mark-late";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // PERFORMANCE: Use custom useMediaQuery hook instead of resize listener
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Sync sidebar state with mobile/desktop
  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
    else setSidebarCollapsed(false);
  }, [isMobile]);

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

  // OFFLINE QUEUE: Sync queued late marks when connection is restored
  useEffect(() => {
    // Try to flush queue on app load if device is online
    const syncQueueOnStartup = async () => {
      if (navigator.onLine && getQueue().length > 0) {
        try {
          const result = await flushQueue(API);
          if (result.flushed > 0) {
            toast.success(`Synced ${result.flushed} queued late mark(s)`);
          }
          if (result.failures.length > 0) {
            toast.error(`Failed to sync ${result.failures.length} record(s)`);
          }
        } catch (err) {
          console.error('Error flushing queue on startup:', err);
        }
      }
    };

    syncQueueOnStartup();

    // Listen for when device comes back online
    const handleOnline = async () => {
      console.log('🌐 Connection restored - syncing offline queue...');
      try {
        const result = await flushQueue(API);
        if (result.flushed > 0) {
          toast.success(`✅ Synced ${result.flushed} queued late mark(s)`);
        }
        if (result.failures.length > 0) {
          toast.warning(`⚠️ Failed to sync ${result.failures.length} record(s)`);
        }
      } catch (err) {
        console.error('Error syncing queue:', err);
        toast.error('Failed to sync offline queue');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
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
            marginBottom: "2rem"
          }}>
            <h1 style={{
              background: "linear-gradient(135deg, #f97316, #0d9488)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "2.2rem",
              fontWeight: "900",
              marginBottom: "0.375rem",
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              <FiSettings style={{ marginRight: '0.5rem', display: 'inline', WebkitTextFillColor: '#f97316' }} /> Management
            </h1>
            <p style={{
              color: "#6b7280",
              fontSize: "0.9rem",
              margin: "0"
            }}>
              Semester promotion, data management &amp; system operations
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
      backgroundColor: "#f5f5f0",
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
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(2px)",
            zIndex: 1500,
            animation: "fadeIn 0.25s ease-out"
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} isMobile={isMobile} />
      
      {/* Main Content */}
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarCollapsed ? "72px" : "260px"),
        flex: 1,
        transition: "margin-left 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        width: isMobile ? "100%" : "calc(100% - " + (sidebarCollapsed ? "72px" : "260px") + ")",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f0"
      }}>
        <Navbar onLogout={handleLogout} />
        
        <div style={{
          padding: isMobile ? "1rem" : "2rem",
          maxWidth: "100%",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch", /* smooth momentum scroll on iOS */
        }}>
          {renderCurrentPage()}

          <footer style={{
            textAlign: "center",
            marginTop: isMobile ? "2rem" : "3rem",
            padding: isMobile ? "1rem" : "1.5rem",
            color: "#9ca3af",
            fontSize: "0.75rem",
            fontWeight: "500",
            borderTop: "1px solid #e8e5df"
          }}>
            <p style={{ margin: "0" }}>
              Prototype built by C.S.V · CSE(AI&ML) Dept · ANITS
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;