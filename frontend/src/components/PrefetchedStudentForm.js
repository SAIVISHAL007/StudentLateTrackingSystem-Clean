import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { enqueueLateMark } from "../utils/offlineQueue";
import { toast } from "./Toast";
import { FiCalendar, FiBriefcase, FiBookOpen, FiZap, FiX, FiTrendingUp, FiBell, FiSearch } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PrefetchedStudentForm() {
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [marking, setMarking] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsStudent, setStatsStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const years = [1, 2, 3, 4];
  const branches = ["CSE", "CSM", "CSD", "CSC", "ECE", "EEE", "MECH", "CIVIL", "IT"];
  const sections = ["A", "B", "C", "D", "E", "F"];

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build params dynamically based on what's selected
      const params = { year };
      if (branch) params.branch = branch;
      if (section) params.section = section;
      
      const response = await API.get("/students/filter", { params });
      const fetched = response.data.students || [];
      
      // Late counts are already included in the response (lateDays field)
      setStudents(fetched);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [year, branch, section]);

  // Fetch students when filters change - show live results as user selects
  useEffect(() => {
    if (year) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudent(null);
    }
  }, [year, fetchStudents]);

  // Fetch detailed stats for a specific student
  const fetchStudentStats = useCallback(async (rollNo) => {
    try {
      setStatsLoading(true);
      const response = await API.get(`/students/student/${rollNo}`);
      const records = response.data.lateLogs || [];
      
      // Calculate statistics
      const totalCount = records.length;
      const now = new Date();
      
      const thisMonth = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      }).length;
      
      const thisWeek = records.filter(r => {
        const recordDate = new Date(r.date);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo && recordDate <= now;
      }).length;
      
      // Group by date for chart
      const chartData = {};
      records.forEach(r => {
        const date = new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        chartData[date] = (chartData[date] || 0) + 1;
      });
      
      const lineData = Object.entries(chartData).slice(-10).map(([date, count]) => ({
        date,
        count
      }));
      
      setStudentStats({
        rollNo,
        totalCount,
        thisMonth,
        thisWeek,
        records: records.sort((a, b) => new Date(b.date) - new Date(a.date)),
        lineData
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
      toast.error("Failed to fetch student statistics");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowConfirmation(true);
  };

  const handleMarkLate = async () => {
    if (!selectedStudent) return;

    try {
      setMarking(true);
      
      const payload = {
        rollNo: selectedStudent.rollNo,
        name: selectedStudent.name,
        year: selectedStudent.year,
        semester: selectedStudent.semester,
        branch: selectedStudent.branch,
        section: selectedStudent.section || "A"
      };

      // Try to mark online first
      try {
        await API.post("/students/mark-late", payload);
        setStudents((prev) => prev.map((student) => {
          if (student.rollNo !== selectedStudent.rollNo) return student;
          return { ...student, lateDays: (student.lateDays || 0) + 1 };
        }));
        toast.success(
          `Student marked late: ${selectedStudent.name} (${selectedStudent.rollNo}) - Year ${selectedStudent.year}, ${selectedStudent.branch}-${selectedStudent.section || 'A'}`
        );
        setShowConfirmation(false);
        setSelectedStudent(null);
      } catch (error) {
        if (error.response?.status === 400) {
          toast.warning(error.response.data?.message || "Student already marked late today");
          setShowConfirmation(false);
          setSelectedStudent(null);
        } else if (error.message === "Network Error" || !navigator.onLine) {
          // If offline, queue it
          enqueueLateMark(payload);
          toast.warning(
            `Queued for sync: ${selectedStudent.name} (${selectedStudent.rollNo}) - Will update when online`
          );
          setShowConfirmation(false);
          setSelectedStudent(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error marking late:", error);
      toast.error("Failed to mark as late");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div style={{
      padding: window.innerWidth <= 768 ? "1rem" : "2rem",
      maxWidth: "900px",
      margin: "0 auto"
    }}>
      {/* BETA Badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "2rem",
        padding: "1rem",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        border: "2px solid #fbbf24",
        borderRadius: "0.5rem",
        flexDirection: window.innerWidth <= 768 ? "column" : "row",
        textAlign: window.innerWidth <= 768 ? "center" : "left"
      }}>
        <div style={{
          fontSize: window.innerWidth <= 768 ? "1.25rem" : "1.5rem",
          fontWeight: "bold",
          color: "#d97706",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <FiZap size={window.innerWidth <= 768 ? 20 : 24} /> BETA
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: "600", color: "#b45309", fontSize: window.innerWidth <= 768 ? "0.9rem" : "1rem" }}>
            Working in Development
          </p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: window.innerWidth <= 768 ? "0.8rem" : "0.9rem", color: "#9a3412" }}>
            Enhanced student selection with cascading filters
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "repeat(3, 1fr)",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {/* Year Dropdown */}
        <div>
          <label style={{ display: "flex", marginBottom: "0.5rem", fontWeight: "600", alignItems: "center", gap: "0.5rem" }}>
            <FiCalendar size={16} /> Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "2px solid #e5e7eb",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "border-color 0.2s"
            }}
          >
            <option value="">Select Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}{'st,nd,rd,th'.split(',')[y - 1]} Year</option>
            ))}
          </select>
        </div>

        {/* Branch Dropdown */}
        <div>
          <label style={{ display: "flex", marginBottom: "0.5rem", fontWeight: "600", alignItems: "center", gap: "0.5rem" }}>
            <FiBriefcase size={16} /> Branch
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "2px solid #e5e7eb",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "border-color 0.2s"
            }}
          >
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Section Dropdown */}
        <div>
          <label style={{ display: "flex", marginBottom: "0.5rem", fontWeight: "600", alignItems: "center", gap: "0.5rem" }}>
            <FiBookOpen size={16} /> Section
          </label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "2px solid #e5e7eb",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "border-color 0.2s"
            }}
          >
            <option value="">Select Section</option>
            {sections.map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", marginBottom: "0.5rem", fontWeight: "600", alignItems: "center", gap: "0.5rem" }}>
          <FiSearch size={16} /> Search Students
        </label>
        <input
          type="text"
          placeholder={year ? "Search by name or roll number..." : "Select a year to enable search"}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={!year}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "2px solid #e5e7eb",
            fontSize: "1rem",
            transition: "border-color 0.2s",
            backgroundColor: !year ? "#f3f4f6" : "#ffffff",
            cursor: !year ? "not-allowed" : "text"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
        />
        {searchQuery && (
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
            Showing results for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Students List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading students...</p>
        </div>
      ) : students.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth <= 480 
            ? "1fr" 
            : window.innerWidth <= 768 
            ? "repeat(2, 1fr)" 
            : "repeat(auto-fill, minmax(250px, 1fr))",
          gap: window.innerWidth <= 768 ? "0.75rem" : "1rem",
          marginBottom: "2rem"
        }}>
          {students
            .filter(student => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return (
                student.name.toLowerCase().includes(query) ||
                student.rollNo.toLowerCase().includes(query)
              );
            })
            .map(student => (
            <div
              key={student._id}
              onClick={() => handleStudentSelect(student)}
              style={{
                padding: "1.5rem",
                border: "2px solid #e5e7eb",
                borderRadius: "0.75rem",
                cursor: "pointer",
                transition: "all 0.3s",
                backgroundColor: selectedStudent?._id === student._id ? "#dbeafe" : "#ffffff",
                borderColor: selectedStudent?._id === student._id ? "#3b82f6" : "#e5e7eb",
                boxShadow: selectedStudent?._id === student._id
                  ? "0 4px 12px rgba(59, 130, 246, 0.2)"
                  : "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={(e) => {
                if (selectedStudent?._id !== student._id) {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.borderColor = "#3b82f6";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStudent?._id !== student._id) {
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <p style={{ margin: 0, fontSize: window.innerWidth <= 768 ? "1.1rem" : "1.25rem", fontWeight: "700", color: "#1f2937" }}>
                  {student.rollNo}
                </p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: window.innerWidth <= 768 ? "1rem" : "0.9rem", color: "#6b7280" }}>
                  {student.name}
                </p>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: window.innerWidth <= 768 ? "0.95rem" : "0.85rem",
                color: "#6b7280",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e5e7eb"
              }}>
                <div>
                  <span>Branch: {student.branch}</span>
                  <span style={{ marginLeft: "1rem" }}>Sem: {student.semester}</span>
                </div>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.75rem"
              }}>
                <span style={{
                  fontSize: window.innerWidth <= 768 ? "0.85rem" : "0.75rem",
                  color: "#9ca3af"
                }}>
                  Year: {student.year} | Sec: {student.section || "A"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatsStudent(student);
                    setShowStatsModal(true);
                    fetchStudentStats(student.rollNo);
                  }}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: (student.lateDays || 0) > 0 ? "#fca5a5" : "#d1d5db",
                    color: (student.lateDays || 0) > 0 ? "#7f1d1d" : "#4b5563",
                    cursor: "pointer",
                    fontSize: window.innerWidth <= 768 ? "0.85rem" : "0.75rem",
                    fontWeight: "600",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                  onMouseEnter={(e) => {
                    if ((student.lateDays || 0) > 0) {
                      e.currentTarget.style.backgroundColor = "#f87171";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if ((student.lateDays || 0) > 0) {
                      e.currentTarget.style.backgroundColor = "#fca5a5";
                    }
                  }}
                >
                  <FiBell size={12} /> Late: {student.lateDays || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : year ? (
        <div style={{
          textAlign: "center",
          padding: "3rem 2rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "0.75rem",
          marginBottom: "2rem"
        }}>
          <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
            No students found for selected filters
          </p>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginTop: "0.5rem" }}>
            {!branch ? "Try selecting a branch" : !section ? "Try selecting a section" : "No matching students"}
          </p>
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "3rem 2rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "0.75rem",
          marginBottom: "2rem"
        }}>
          <p style={{ fontSize: "1.1rem", color: "#9ca3af" }}>
            Start by selecting a Year to see students
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && selectedStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: window.innerWidth <= 768 ? "1.5rem" : "2rem",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)"
          }}>
            <h2 style={{ marginTop: 0, color: "#1f2937", fontSize: window.innerWidth <= 768 ? "1.25rem" : "1.5rem" }}>Confirm Mark Late</h2>
            
            <div style={{
              backgroundColor: "#f9fafb",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#6b7280" }}>
                  Roll No
                </p>
                <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#1f2937" }}>
                  {selectedStudent.rollNo}
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#6b7280" }}>
                  Name
                </p>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "#374151" }}>
                  {selectedStudent.name}
                </p>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                fontSize: "0.9rem"
              }}>
                <div>
                  <p style={{ margin: "0 0 0.25rem 0", color: "#6b7280" }}>Year</p>
                  <p style={{ margin: 0, fontWeight: "600" }}>{selectedStudent.year}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.25rem 0", color: "#6b7280" }}>Branch</p>
                  <p style={{ margin: 0, fontWeight: "600" }}>{selectedStudent.branch}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.25rem 0", color: "#6b7280" }}>Semester</p>
                  <p style={{ margin: 0, fontWeight: "600" }}>{selectedStudent.semester}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 0.25rem 0", color: "#6b7280" }}>Section</p>
                  <p style={{ margin: 0, fontWeight: "600" }}>{selectedStudent.section || "A"}</p>
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedStudent(null);
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "2px solid #e5e7eb",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkLate}
                disabled={marking}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "white",
                  cursor: marking ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  opacity: marking ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!marking) e.currentTarget.style.backgroundColor = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  if (!marking) e.currentTarget.style.backgroundColor = "#ef4444";
                }}
              >
                {marking ? "Marking..." : "Mark Late"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Statistics Modal */}
      {showStatsModal && statsStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            padding: window.innerWidth <= 768 ? "1rem" : "2rem",
            maxWidth: "900px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)"
          }}>
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: window.innerWidth <= 768 ? "1rem" : "2rem",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "1rem"
            }}>
              <div>
                <h2 style={{ margin: "0 0 0.5rem 0", color: "#1f2937", fontSize: window.innerWidth <= 768 ? "1.1rem" : "1.5rem" }}>
                  {statsStudent.rollNo} - {statsStudent.name}
                </h2>
                <p style={{ margin: 0, fontSize: window.innerWidth <= 768 ? "0.8rem" : "0.9rem", color: "#6b7280" }}>
                  Late Attendance Statistics
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setStatsStudent(null);
                  setStudentStats(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280"
                }}
              >
                <FiX />
              </button>
            </div>

            {/* Loading State */}
            {statsLoading ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "4rem 2rem",
                color: "#6b7280"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid #e5e7eb",
                  borderTop: "4px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "1rem"
                }} />
                <p style={{ margin: 0, fontSize: "1rem" }}>Loading statistics...</p>
              </div>
            ) : studentStats ? (
              <>
                {/* Key Statistics Cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: window.innerWidth <= 768 ? "1rem" : "2rem"
                }}>
                  <div style={{
                    backgroundColor: "#fef2f2",
                    border: "2px solid #fecaca",
                    borderRadius: "0.75rem",
                    padding: window.innerWidth <= 768 ? "1rem" : "1.5rem",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280", fontSize: window.innerWidth <= 768 ? "0.8rem" : "0.9rem" }}>
                      Total Late Count
                    </p>
                    <p style={{ margin: 0, fontSize: window.innerWidth <= 768 ? "2rem" : "2.5rem", fontWeight: "700", color: "#dc2626" }}>
                      {studentStats.totalCount}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: "#fef3c7",
                    border: "2px solid #fde047",
                    borderRadius: "0.75rem",
                    padding: window.innerWidth <= 768 ? "1rem" : "1.5rem",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280", fontSize: window.innerWidth <= 768 ? "0.8rem" : "0.9rem" }}>
                      This Month
                    </p>
                    <p style={{ margin: 0, fontSize: window.innerWidth <= 768 ? "2rem" : "2.5rem", fontWeight: "700", color: "#f59e0b" }}>
                      {studentStats.thisMonth}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: "#dbeafe",
                    border: "2px solid #93c5fd",
                    borderRadius: "0.75rem",
                    padding: window.innerWidth <= 768 ? "1rem" : "1.5rem",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: "0 0 0.5rem 0", color: "#6b7280", fontSize: window.innerWidth <= 768 ? "0.8rem" : "0.9rem" }}>
                      This Week
                    </p>
                    <p style={{ margin: 0, fontSize: window.innerWidth <= 768 ? "2rem" : "2.5rem", fontWeight: "700", color: "#3b82f6" }}>
                      {studentStats.thisWeek}
                    </p>
                  </div>
                </div>

                {/* Charts */}
                {studentStats.lineData && studentStats.lineData.length > 0 && (
                  <div style={{
                    marginBottom: window.innerWidth <= 768 ? "1rem" : "2rem"
                  }}>
                    <h3 style={{ 
                      color: "#1f2937", 
                      marginBottom: "1rem", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem",
                      fontSize: window.innerWidth <= 768 ? "1rem" : "1.25rem"
                    }}>
                      <FiTrendingUp size={window.innerWidth <= 768 ? 16 : 20} /> Late Records Trend
                    </h3>
                    <div style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.75rem",
                      padding: window.innerWidth <= 768 ? "0.5rem" : "1rem",
                      border: "1px solid #e5e7eb",
                      height: window.innerWidth <= 768 ? "250px" : "300px"
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={studentStats.lineData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#dc2626" 
                            strokeWidth={2}
                            dot={{ fill: '#dc2626', r: 4 }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={true}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Recent Records Table */}
                {studentStats.records && studentStats.records.length > 0 && (
                  <div style={{
                    marginBottom: "1rem"
                  }}>
                    <h3 style={{ 
                      color: "#1f2937", 
                      marginBottom: "1rem",
                      fontSize: window.innerWidth <= 768 ? "1rem" : "1.25rem"
                    }}>
                      Recent Late Records (Last 5)
                    </h3>
                    <div style={{
                      overflowX: "auto",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.75rem",
                      border: "1px solid #e5e7eb"
                    }}>
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: window.innerWidth <= 768 ? "0.8rem" : "0.9rem"
                      }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                            <th style={{ padding: window.innerWidth <= 768 ? "0.75rem" : "1rem", textAlign: "left", color: "#6b7280", fontWeight: "600" }}>
                              Date
                            </th>
                            <th style={{ padding: window.innerWidth <= 768 ? "0.75rem" : "1rem", textAlign: "left", color: "#6b7280", fontWeight: "600" }}>
                              Marked By
                            </th>
                            <th style={{ padding: window.innerWidth <= 768 ? "0.75rem" : "1rem", textAlign: "left", color: "#6b7280", fontWeight: "600" }}>
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentStats.records.slice(0, 5).map((record, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td style={{ padding: window.innerWidth <= 768 ? "0.75rem" : "1rem", color: "#374151" }}>
                                {new Date(record.date).toLocaleDateString('en-IN')}
                              </td>
                              <td style={{ padding: window.innerWidth <= 768 ? "0.75rem" : "1rem", color: "#374151" }}>
                                {record.markedBy ? typeof record.markedBy === 'object' ? record.markedBy.name : record.markedBy : "System"}
                              </td>
                              <td style={{ padding: window.innerWidth <= 768 ? "0.75rem" : "1rem", color: "#374151" }}>
                                {new Date(record.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {studentStats.records && studentStats.records.length === 0 && (
                  <div style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.75rem"
                  }}>
                    <p style={{ margin: 0 }}>✓ No late records for this student</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                color: "#6b7280"
              }}>
                <p style={{ margin: 0 }}>No data available</p>
              </div>
            )}
          </div>
          
          {/* Add CSS animation for spinner */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default PrefetchedStudentForm;
