import { useEffect, useState } from "react";
import API from "../services/api";
import { formatDate, isToday } from "../utils/dateUtils";
import { exportToExcel } from "../utils/advancedExport";
import { useToast } from "./ToastProvider";
import BarcodeScanner from "./BarcodeScanner";

function LateList() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    const fetchLateStudents = async () => {
      try {
        console.log('🔄 Fetching late students for today...');
        const res = await API.get("/students/late-today", { timeout: 15000 });
        
        console.log('📡 API Response:', res.data);
        
        // Handle both old and new response formats
        const studentsData = res.data.students || res.data;
        
        console.log(`📋 Processing ${studentsData.length} students late today`);
        console.log('� Students data:', studentsData);
        
        setStudents(studentsData);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Error loading late students:', err);
        console.error('❌ Error details:', err.response?.data);
        
        let errorMessage = "Failed to load today's late students";
        if (err.code === 'ECONNABORTED') {
          errorMessage = "⏱️ Request timed out. Please refresh the page.";
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = `Network Error: ${err.message}`;
        }
        
        setError(errorMessage);
        setStudents([]); // Set empty array on error
        setLoading(false);
      }
    };

    fetchLateStudents();
  }, []);

  const toggleExpanded = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const getLateDatesForToday = (lateLogs) => {
    return lateLogs.filter(log => isToday(log.date));
  };

  const getRecentLateDates = (lateLogs, limit = 5) => {
    return lateLogs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  const handleBarcodeDetected = (barcode) => {
    setSearchTerm(barcode);
    setShowBarcodeScanner(false);
    toast.showToast(`Barcode scanned: ${barcode}`, "success");
  };

  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      toast.showToast("No data to export", "warning");
      return;
    }
    
    try {
      const exportData = filteredStudents.map(student => ({
        rollNo: student.rollNo,
        name: student.name,
        year: student.year,
        branch: student.branch || 'N/A',
        section: student.section || 'N/A',
        lateDays: student.lateDays,
        status: student.status,
        fines: student.fines || 0,
        email: student.email,
        lateLogs: student.lateLogs
      }));
      
      const options = {
        title: `Late Students - ${new Date().toDateString()}`,
        filters: {
          year: selectedYear !== "all" ? `Year ${selectedYear}` : "All Years",
          branch: selectedBranch !== "all" ? selectedBranch : "All Branches",
          section: selectedSection !== "all" ? `Section ${selectedSection}` : "All Sections"
        }
      };
      
      const filename = `late_students_today_${new Date().toISOString().split('T')[0]}`;
      exportToExcel(exportData, filename, options);
      
      toast.showToast(`Excel exported successfully! (${filteredStudents.length} students)`, "success");
    } catch (error) {
      console.error('Export error:', error);
      toast.showToast("Export failed. Please try again.", "error");
    }
  };

  // Filter students based on search term, year, branch, and section
  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Year filter
    const matchesYear = selectedYear === "all" || 
      student.year?.toString() === selectedYear;
    
    // Branch filter
    const matchesBranch = selectedBranch === "all" || 
      student.branch?.toUpperCase() === selectedBranch.toUpperCase();
    
    // Section filter
    const matchesSection = selectedSection === "all" || 
      student.section?.toUpperCase() === selectedSection.toUpperCase();
    
    return matchesSearch && matchesYear && matchesBranch && matchesSection;
  });

  return (
    <div style={{
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      backdropFilter: "blur(20px)",
      padding: "2.5rem",
      borderRadius: "24px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      animation: "scaleIn 0.5s ease-out"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "60px",
            height: "60px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
            animation: "float 3s ease-in-out infinite"
          }}>
            📋
          </div>
          <h2 style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "1.75rem",
            fontWeight: "800",
            margin: 0,
            letterSpacing: "-0.5px"
          }}>
            Late Students Today
          </h2>
        </div>
        
        {/* Export Buttons */}
        {students.length > 0 && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleExportExcel}
              style={{
                padding: "10px 18px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.3)";
              }}
            >
              📊 Export Excel
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      {students.length > 0 && (
        <div style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          alignItems: "center",
          animation: "fadeIn 0.6s ease-out"
        }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: "250px", display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="🔍 Search by roll number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "0.95rem",
                outline: "none",
                transition: "all 0.3s ease",
                background: "white",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={() => setShowBarcodeScanner(true)}
              style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(245, 158, 11, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(245, 158, 11, 0.3)";
              }}
            >
              📷 Scan
            </button>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "0.95rem",
                backgroundColor: "white",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s ease",
                fontWeight: "500"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="all">🎓 All Years</option>
              <option value="1">🟢 1st Year</option>
              <option value="2">🟡 2nd Year</option>
              <option value="3">🟠 3rd Year</option>
              <option value="4">🔴 4th Year</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "0.95rem",
                backgroundColor: "white",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s ease",
                fontWeight: "500"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="all">🏢 All Branches</option>
              <option value="CSE">CSE</option>
              <option value="CSM">CSM</option>
              <option value="CSD">CSD</option>
              <option value="CSC">CSC</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="IT">IT</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "0.95rem",
                backgroundColor: "white",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s ease",
                fontWeight: "500"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 4px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="all">📋 All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Results Counter */}
          <div style={{
            padding: "12px 20px",
            background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
            borderRadius: "12px",
            fontSize: "0.9rem",
            fontWeight: "600",
            color: "#1e40af",
            border: "2px solid #bfdbfe"
          }}>
            {filteredStudents.length === students.length 
              ? `${students.length} students`
              : `${filteredStudents.length} of ${students.length} students`
            }
          </div>
        </div>
      )}
      
      {loading ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
          borderRadius: "20px",
          border: "2px dashed #d1d5db",
          animation: "pulse 2s ease-in-out infinite"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem", animation: "spin 2s linear infinite" }}>⏳</div>
          <p style={{
            color: "#6b7280",
            fontSize: "1.2rem",
            fontWeight: "600",
            margin: "0"
          }}>
            Loading late students...
          </p>
        </div>
      ) : error ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          borderRadius: "20px",
          border: "2px solid #fca5a5",
          animation: "scaleIn 0.5s ease-out"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>❌</div>
          <p style={{
            color: "#991b1b",
            fontSize: "1.2rem",
            fontWeight: "600",
            margin: "0"
          }}>
            {error}
          </p>
        </div>
      ) : students.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          borderRadius: "20px",
          border: "2px dashed #6ee7b7",
          animation: "scaleIn 0.5s ease-out"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem", animation: "float 3s ease-in-out infinite" }}>🎉</div>
          <p style={{
            color: "#065f46",
            fontSize: "1.5rem",
            fontWeight: "700",
            margin: "0 0 0.5rem 0"
          }}>
            No students were late today!
          </p>
          <p style={{
            color: "#047857",
            fontSize: "1rem",
            fontWeight: "500",
            margin: "0"
          }}>
            Great attendance record! 🌟
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: "20px",
          border: "2px dashed #fbbf24",
          animation: "scaleIn 0.5s ease-out"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🔍</div>
          <p style={{
            color: "#78350f",
            fontSize: "1.2rem",
            fontWeight: "600",
            margin: "0 0 0.75rem 0"
          }}>
            No students match your search criteria
          </p>
          <p style={{
            color: "#92400e",
            fontSize: "0.95rem",
            fontWeight: "500",
            margin: "0"
          }}>
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredStudents.map((s, index) => (
            <li key={s._id} style={{
              marginBottom: "1.25rem",
              padding: "2rem",
              border: "2px solid rgba(102, 126, 234, 0.1)",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
              transition: "all 0.3s ease",
              animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
              position: "relative",
              overflow: "hidden"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(102, 126, 234, 0.15)";
              e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "rgba(102, 126, 234, 0.1)";
            }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer"
              }} onClick={() => toggleExpanded(s._id)}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.3px"
                  }}>
                    {s.rollNo} - {s.name}
                  </div>
                  {(s.branch || s.section || s.year) && (
                    <div style={{
                      fontSize: "0.9rem",
                      color: "#64748b",
                      marginBottom: "0.75rem",
                      fontWeight: "500"
                    }}>
                      {s.branch && `🏢 ${s.branch}`}
                      {s.branch && s.section && ' • '}
                      {s.section && `📋 Section ${s.section}`}
                      {s.year && ` • 🎓 Year ${s.year}`}
                      {s.semester && ` • 📚 Sem ${s.semester}`}
                    </div>
                  )}
                  <div style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}>
                    <span style={{
                      padding: "6px 16px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      background: s.lateDays > 10 
                        ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" 
                        : s.lateDays > 7 
                        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" 
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      boxShadow: s.lateDays > 10 
                        ? "0 4px 12px rgba(220, 38, 38, 0.3)" 
                        : s.lateDays > 7 
                        ? "0 4px 12px rgba(245, 158, 11, 0.3)" 
                        : "0 4px 12px rgba(16, 185, 129, 0.3)"
                    }}>
                      {s.lateDays}/10 late days
                    </span>
                    
                    {/* Status indicators */}
                    {s.status === 'approaching_limit' && (
                      <span style={{
                        padding: "6px 16px",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                        color: "#78350f",
                        boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)"
                      }}>
                        ⚠️ Approaching Limit
                      </span>
                    )}
                    
                    {s.status === 'grace_period' && (
                      <span style={{
                        padding: "6px 16px",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)"
                      }}>
                        🔶 Grace Period ({s.gracePeriodUsed}/4)
                      </span>
                    )}
                    
                    {s.status === 'fined' && (
                      <span style={{
                        padding: "6px 16px",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                      }}>
                        💸 Being Fined
                      </span>
                    )}
                    
                    {s.fines > 0 && (
                      <span style={{
                        padding: "6px 16px",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
                      }}>
                        ₹{s.fines} Total Fines
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  style={{
                    background: expandedStudent === s._id 
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      : "rgba(102, 126, 234, 0.1)",
                    color: expandedStudent === s._id ? "white" : "#667eea",
                    border: "2px solid #667eea",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: expandedStudent === s._id 
                      ? "0 4px 12px rgba(102, 126, 234, 0.3)" 
                      : "none"
                  }}
                  onMouseOver={(e) => {
                    if (expandedStudent !== s._id) {
                      e.target.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                      e.target.style.color = "white";
                      e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (expandedStudent !== s._id) {
                      e.target.style.background = "rgba(102, 126, 234, 0.1)";
                      e.target.style.color = "#667eea";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{expandedStudent === s._id ? "▼" : "▶"}</span>
                  View Details
                </button>
              </div>

              {expandedStudent === s._id && (
                <div style={{ 
                  marginTop: "2rem", 
                  paddingTop: "2rem", 
                  borderTop: "2px solid rgba(102, 126, 234, 0.15)",
                  animation: "fadeIn 0.4s ease-out"
                }}>
                  <h4 style={{
                    margin: "0 0 1rem 0",
                    fontSize: "1.1rem",
                    color: "#334155",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>📅</span>
                    Today's Late Entries:
                  </h4>
                  {getLateDatesForToday(s.lateLogs).length > 0 ? (
                    <ul style={{
                      margin: "0 0 2rem 0",
                      padding: "1.25rem",
                      background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                      borderRadius: "16px",
                      border: "2px solid #fca5a5",
                      listStyle: "none",
                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)"
                    }}>
                      {getLateDatesForToday(s.lateLogs).map((log, index) => (
                        <li key={index} style={{
                          color: "#991b1b",
                          fontWeight: "600",
                          padding: "0.5rem 0",
                          fontSize: "0.95rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}>
                          <span style={{ fontSize: "1.2rem" }}>🔴</span>
                          {formatDate(log.date)} (Today)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{
                      margin: "0 0 2rem 0",
                      padding: "1.25rem",
                      background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                      borderRadius: "16px",
                      color: "#6b7280",
                      fontSize: "0.95rem",
                      fontStyle: "italic",
                      fontWeight: "500",
                      border: "2px solid #d1d5db"
                    }}>
                      No entries for today
                    </p>
                  )}

                  <h4 style={{
                    margin: "0 0 1rem 0",
                    fontSize: "1.1rem",
                    color: "#334155",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>📝</span>
                    Recent Late History:
                  </h4>
                  <ul style={{
                    margin: "0 0 1.5rem 0",
                    padding: "1.25rem",
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: "16px",
                    listStyle: "none",
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "2px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }}>
                    {getRecentLateDates(s.lateLogs).map((log, index) => (
                      <li key={index} style={{
                        color: isToday(log.date) ? "#991b1b" : "#64748b",
                        fontSize: "0.9rem",
                        padding: "0.5rem 0",
                        fontWeight: isToday(log.date) ? "600" : "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <span style={{ fontSize: "1.1rem" }}>{isToday(log.date) ? "🔴" : "⭕"}</span>
                        {formatDate(log.date)}
                        {isToday(log.date) && <span style={{ color: "#dc2626", fontWeight: "700" }}>(Today)</span>}
                      </li>
                    ))}
                  </ul>
                  
                  {s.fines > 0 && (
                    <div style={{ 
                      marginTop: "1.5rem", 
                      padding: "1.25rem", 
                      background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                      border: "2px solid #fbbf24",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)"
                    }}>
                      <span style={{ fontSize: "2rem" }}>💰</span>
                      <strong style={{ color: "#78350f", fontSize: "1.2rem", fontWeight: "700" }}>
                        Total Fines: ₹{s.fines}
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
}

export default LateList;
