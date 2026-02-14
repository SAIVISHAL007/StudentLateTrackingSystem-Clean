import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { toast } from "./Toast";
import { FiBarChart2, FiRefreshCw, FiClock, FiDollarSign, FiBriefcase, FiAlertTriangle, FiTrendingUp, FiAward, FiArrowUp, FiArrowDown, FiMinus } from "react-icons/fi";

function Analytics() {
  const [todayCount, setTodayCount] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState({ mostLate: [], leastLate: [], mostImproved: [] });
  const [financialData, setFinancialData] = useState({
    totalCollected: 0,
    projectedRevenue: 0,
    pendingFines: 0,
    paymentRate: 0,
    avgFinePerStudent: 0
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetch, setLastFetch] = useState(new Date());

  const fetchAnalytics = useCallback(async (showToast = false) => {
    try {
      const [todayRes, leaderboardRes, financialRes] = await Promise.all([
        API.get("/students/late-today"),
        API.get("/students/analytics/leaderboard").catch((err) => {
          console.warn("Leaderboard fetch failed:", err.message);
          return { data: { mostLate: [], leastLate: [], mostImproved: [] } };
        }),
        API.get("/students/analytics/financial").catch((err) => {
          console.warn("Financial data fetch failed:", err.message);
          return {
            data: {
              totalCollected: 0,
              projectedRevenue: 0,
              pendingFines: 0,
              paymentRate: 0,
              avgFinePerStudent: 0
            }
          };
        })
      ]);

      const newCount = todayRes.data.totalCount || 0;
      setPreviousCount(todayCount);
      setTodayCount(newCount);
      setLeaderboard(leaderboardRes.data);
      setFinancialData(financialRes.data);

      // Calculate department breakdown from late today data
      try {
        const lateStudents = todayRes.data.students || [];
        const deptBreakdown = calculateDepartmentStats(lateStudents);
        setDepartmentStats(deptBreakdown);
      } catch (err) {
        console.warn("Department stats calculation failed:", err.message);
        setDepartmentStats([]);
      }

      setLastFetch(new Date());
      setLoading(false);
      
      if (showToast && !loading) {
        toast.success('Analytics refreshed successfully');
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch analytics';
      toast.error(errorMsg);
      setLoading(false);
    }
  }, [todayCount, loading]);

  useEffect(() => {
    fetchAnalytics(false);
    
    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => fetchAnalytics(false), 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchAnalytics]);

  const calculateDepartmentStats = (students) => {
    const deptMap = {};
    students.forEach(s => {
      const dept = s.branch || 'Unknown';
      if (!deptMap[dept]) {
        deptMap[dept] = { name: dept, total: 0, late: 0, fines: 0 };
      }
      deptMap[dept].total++;
      if (s.lateDays > 0) deptMap[dept].late++;
      deptMap[dept].fines += s.fines || 0;
    });
    return Object.values(deptMap).sort((a, b) => b.late - a.late);
  };

  const getTrendIndicator = () => {
    const diff = todayCount - previousCount;
    if (diff === 0) return <span style={{ color: '#64748b', display: "flex", alignItems: "center", gap: "0.4rem" }}><FiMinus /> No change</span>;
    if (diff > 0) return <span style={{ color: '#dc2626', display: "flex", alignItems: "center", gap: "0.4rem" }}><FiArrowUp /> +{diff} from last refresh</span>;
    return <span style={{ color: '#10b981', display: "flex", alignItems: "center", gap: "0.4rem" }}><FiArrowDown /> {diff} from last refresh</span>;
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px",
        fontSize: "1.2rem",
        color: "#64748b"
      }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "0"
      }}>
        <div>
          <h2 style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "2.5rem",
            fontWeight: "800",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <FiBarChart2 size={32} color="#667eea" /> Live Analytics
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Real-time insights and performance metrics
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "10px 16px",
            background: "white",
            borderRadius: "10px",
            border: "2px solid #e2e8f0",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={() => fetchAnalytics(true)}
            className="pro-btn pro-btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <FiRefreshCw size={16} /> Refresh Now
          </button>
        </div>
      </div>

      {/* Today's Counter - Big Hero Card */}
      <div style={{
        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
        padding: "2.5rem 2rem",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(220, 38, 38, 0.3)",
        color: "white",
        textAlign: "center",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden",
        animation: "pulse 3s ease-in-out infinite",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          opacity: 0.1
        }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "center" }}>
            <FiClock size={80} color="white" style={{ opacity: 0.9 }} />
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "1rem", opacity: 0.9 }}>
            Students Late Today
          </div>
          <div style={{ fontSize: "5rem", fontWeight: "800", lineHeight: "1", textShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: todayCount !== previousCount ? 'pulse 0.5s ease-in-out' : 'none' }}>
            {todayCount}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.9 }}>
            {getTrendIndicator()}
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", opacity: 0.7 }}>
            Last updated: {lastFetch.toLocaleTimeString()}
          </div>
          <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", opacity: 0.8, animation: "float 2s ease-in-out infinite" }}>
            Scroll down for more analytics
          </div>
        </div>
      </div>

      {/* Financial Analytics */}
      <div style={{
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        padding: "2rem",
        borderRadius: "20px",
        border: "2px solid #bae6fd",
        marginBottom: "2rem",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#0c4a6e",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <FiDollarSign size={24} /> Financial Analytics
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem"
        }}>
          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e0f2fe",
            transition: "all 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(16,185,129,0.15)'; e.currentTarget.style.borderColor = '#10b981'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e0f2fe'; }}
          >
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiDollarSign size={16} /> Total Collected
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#10b981" }}>
              ₹{(financialData?.totalCollected || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e0f2fe",
            transition: "all 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(220,38,38,0.15)'; e.currentTarget.style.borderColor = '#dc2626'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e0f2fe'; }}
          >
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiClock size={16} /> Pending Fines
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#dc2626" }}>
              ₹{(financialData?.pendingFines || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e0f2fe"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500", marginBottom: "0.5rem" }}>
              Projected Revenue
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#667eea" }}>
              ₹{(financialData?.projectedRevenue || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e0f2fe"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500", marginBottom: "0.5rem" }}>
              Payment Rate
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#f59e0b" }}>
              {financialData.paymentRate}%
            </div>
          </div>

          <div style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e0f2fe"
          }}>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500", marginBottom: "0.5rem" }}>
              Avg Fine/Student
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#8b5cf6" }}>
              ₹{financialData.avgFinePerStudent}
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      {departmentStats.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)",
          padding: "2rem",
          borderRadius: "20px",
          border: "2px solid #fb923c",
          marginBottom: "2rem"
        }}>
          <h3 style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#9a3412",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <FiBriefcase size={24} /> Department Breakdown
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem"
          }}>
            {departmentStats.map((dept) => (
              <div key={dept.name} style={{
                background: "white",
                padding: "1.25rem",
                borderRadius: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              >
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.75rem" }}>
                  {dept.name}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Total Students:</span>
                    <span style={{ fontWeight: "700", color: "#0ea5e9" }}>{dept.total}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Late Students:</span>
                    <span style={{ fontWeight: "700", color: "#dc2626" }}>{dept.late}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Total Fines:</span>
                    <span style={{ fontWeight: "700", color: "#f59e0b" }}>₹{dept.fines}</span>
                  </div>
                  <div style={{ marginTop: "0.5rem", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${dept.total > 0 ? (dept.late / dept.total * 100) : 0}%`,
                      background: "linear-gradient(90deg, #dc2626, #f59e0b)",
                      transition: "width 0.5s ease"
                    }}></div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: "0.25rem" }}>
                    {dept.total > 0 ? ((dept.late / dept.total * 100).toFixed(1)) : 0}% late rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "2rem"
      }}>
        {/* Most Late */}
        <div style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          padding: "1.5rem",
          borderRadius: "20px",
          border: "2px solid #fbbf24"
        }}>
          <h3 style={{
            fontSize: "1.3rem",
            fontWeight: "700",
            color: "#92400e",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <FiAlertTriangle size={20} /> Most Late Students
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leaderboard.mostLate.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#92400e", fontSize: "0.9rem", background: "rgba(255,255,255,0.5)", borderRadius: "12px" }}>
                No data available yet. Mark students late to see analytics.
              </div>
            ) : (
            leaderboard.mostLate.slice(0, 5).map((student, index) => (
              <div key={student.rollNo} style={{
                background: "white",
                padding: "1rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: index === 0 ? "#dc2626" : index === 1 ? "#f59e0b" : "#64748b",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "1.1rem"
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {student.rollNo} • Y{student.year} {student.branch}
                  </div>
                </div>
                <div style={{
                  padding: "0.4rem 0.8rem",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.9rem"
                }}>
                  {student.lateDays} days
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Most Improved */}
        <div style={{
          background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          padding: "1.5rem",
          borderRadius: "20px",
          border: "2px solid #34d399"
        }}>
          <h3 style={{
            fontSize: "1.3rem",
            fontWeight: "700",
            color: "#065f46",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <FiTrendingUp size={20} /> Most Improved
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leaderboard.mostImproved.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#065f46", fontSize: "0.9rem", background: "rgba(255,255,255,0.5)", borderRadius: "12px" }}>
                📈 No improvement data yet. Students will appear here as they reduce late days.
              </div>
            ) : (
            leaderboard.mostImproved.slice(0, 5).map((student, index) => (
              <div key={student.rollNo} style={{
                background: "white",
                padding: "1rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#10b981",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "1.1rem"
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {student.rollNo} • Y{student.year} {student.branch}
                  </div>
                </div>
                <div style={{
                  padding: "0.4rem 0.8rem",
                  background: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.9rem"
                }}>
                  -{student.improvement} days
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Least Late */}
        <div style={{
          background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
          padding: "1.5rem",
          borderRadius: "20px",
          border: "2px solid #a5b4fc"
        }}>
          <h3 style={{
            fontSize: "1.3rem",
            fontWeight: "700",
            color: "#3730a3",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <FiAward size={24} style={{ color: "#fbbf24", marginBottom: "0.5rem" }} /> Best Performers
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leaderboard.leastLate.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#3730a3", fontSize: "0.9rem", background: "rgba(255,255,255,0.5)", borderRadius: "12px" }}>
                <FiAward /> No students yet. Best performers will appear here.
              </div>
            ) : (
            leaderboard.leastLate.slice(0, 5).map((student, index) => (
              <div key={student.rollNo} style={{
                background: "white",
                padding: "1rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: index === 0 ? "#fbbf24" : "#667eea",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "1.1rem"
                }}>
                  {index === 0 ? <FiAward size={20} /> : index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.95rem" }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {student.rollNo} • Y{student.year} {student.branch}
                  </div>
                </div>
                <div style={{
                  padding: "0.4rem 0.8rem",
                  background: "#e0e7ff",
                  color: "#3730a3",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.9rem"
                }}>
                  {student.lateDays} days
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
