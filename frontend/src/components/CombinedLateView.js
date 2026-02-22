import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FiList,
  FiClipboard,
  FiDownload,
  FiFileText,
  FiCalendar,
  FiXCircle,
  FiAlertCircle,
  FiCircle,
  FiUser,
  FiRotateCcw,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiCheck,
  FiSearch,
  FiDollarSign,
} from "react-icons/fi";
import API from "../services/api";
import { formatDate, isToday } from "../utils/dateUtils";
import {
  downloadTextReport,
  formatStudentDataForExport,
  formatLateRecordsForExport,
  getTimestamp,
} from "../utils/exportUtils";
import { exportTodayLateToExcel, exportLateRecordsToExcel } from "../utils/excelExport";
import { toast } from "./Toast";

function CombinedLateView() {
  // ============ TAB STATE ============
  const [activeTab, setActiveTab] = useState("today"); // "today" | "records"

  // ============ SHARED FILTER STATE ============
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [loading, setLoading] = useState(false);

  // ============ TAB-SPECIFIC STATE: "TODAY" ============
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [undoingStudent, setUndoingStudent] = useState(null);
  const [todayError, setTodayError] = useState(null);

  // ============ TAB-SPECIFIC STATE: "RECORDS" ============
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [recordData, setRecordData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordError, setRecordError] = useState(null);
  const ITEMS_PER_PAGE = 30;

  // ============ FETCH - TODAY'S LATE STUDENTS ============
  useEffect(() => {
    if (activeTab === "today") {
      fetchLateStudents();
    }
  }, [activeTab]);

  const fetchLateStudents = async () => {
    setLoading(true);
    setTodayError(null);
    try {
      const res = await API.get("/students/late-today", { timeout: 15000 });
      const studentsData = res.data.students || res.data;
      setStudents(studentsData);
    } catch (err) {
      console.error("Error loading late students:", err);
      let errorMessage = "Failed to load today's late students";
      if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please refresh the page.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setTodayError(errorMessage);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // ============ FETCH - LATE RECORDS ============
  useEffect(() => {
    if (activeTab === "records") {
      fetchRecords(selectedPeriod);
      setSelectedYear("all");
      setSelectedBranch("all");
      setSelectedSection("all");
      setCurrentPage(1);
    }
  }, [selectedPeriod, activeTab]);

  const fetchRecords = async (period) => {
    setLoading(true);
    setRecordError(null);
    try {
      const res = await API.get(`/students/records/${period}`);
      setRecordData(res.data);
    } catch (err) {
      console.error("Error fetching records:", err);
      setRecordData(null);
      setRecordError("Failed to load records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============ HELPER: GET TODAY'S LATE INFO ============
  const getTodayLateInfo = (lateLogs) => {
    if (!lateLogs || lateLogs.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLog = lateLogs.find((log) => {
      const logDate = new Date(log.date);
      return logDate >= today && logDate < tomorrow;
    });

    if (!todayLog) return null;

    const minutesSinceMarking = (Date.now() - new Date(todayLog.date).getTime()) / 60000;
    const canUndo = minutesSinceMarking < 10;

    return {
      ...todayLog,
      minutesSinceMarking: Math.floor(minutesSinceMarking),
      canUndo,
    };
  };

  // ============ UNDO LATE MARKING ============
  const handleUndoLate = async (rollNo) => {
    if (
      !window.confirm(
        `Are you sure you want to undo the late marking for ${rollNo}? This action will remove today's late entry.`
      )
    ) {
      return;
    }

    setUndoingStudent(rollNo);
    try {
      const res = await API.delete(`/students/undo-late/${rollNo}`);
      toast.success(res.data.message || "Late marking undone successfully");

      const refreshRes = await API.get("/students/late-today", {
        timeout: 15000,
        params: { _t: Date.now() },
      });
      const studentsData = refreshRes.data.students || refreshRes.data;
      setStudents(studentsData);
    } catch (err) {
      console.error("Error undoing late marking:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to undo late marking";
      toast.error(errorMsg);
    } finally {
      setUndoingStudent(null);
    }
  };

  // ============ TOGGLE EXPANDED STUDENT ============
  const toggleExpanded = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // ============ DATE HELPERS ============
  const toDayKey = (date) => {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return day.toISOString().slice(0, 10);
  };

  const aggregateLogsByDay = (lateLogs) => {
    const map = new Map();
    (lateLogs || []).forEach((log) => {
      const key = toDayKey(log.date);
      if (!map.has(key)) {
        map.set(key, { date: new Date(log.date), count: 0 });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (new Date(log.date) > entry.date) {
        entry.date = new Date(log.date);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getLateDatesForToday = (lateLogs) => {
    return aggregateLogsByDay(lateLogs).filter((log) => isToday(log.date));
  };

  const getRecentLateDates = (lateLogs, limit = 5) => {
    return aggregateLogsByDay(lateLogs).slice(0, limit);
  };

  // ============ PERIOD HELPERS ============
  const getPeriodTitle = (period) => {
    switch (period) {
      case "weekly":
        return "Weekly Records";
      case "monthly":
        return "Monthly Records";
      case "semester":
        return "Semester Records";
      default:
        return "Records";
    }
  };

  const getYearLabel = (year) => {
    const labels = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
    return labels[year] || `Year ${year}`;
  };

  // ============ EXPORT HANDLERS - TODAY ============
  const handleExportExcelToday = () => {
    if (filteredStudentsToday.length === 0) {
      toast.error("No data to export");
      return;
    }

    const filters = {
      year: selectedYear !== "all" ? `Year ${selectedYear}` : "All Years",
      branch: selectedBranch !== "all" ? selectedBranch : "All Branches",
      section: selectedSection !== "all" ? `Section ${selectedSection}` : "All Sections",
    };

    const success = exportTodayLateToExcel(filteredStudentsToday, filters);

    if (success) {
      toast.success(
        `Export successful!\n\nExported: ${filteredStudentsToday.length} students\nFilters: ${filters.year}, ${filters.branch}, ${filters.section}`
      );
    } else {
      toast.error("Export failed. Please try again.");
    }
  };

  const handleExportReportToday = () => {
    if (filteredStudentsToday.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatStudentDataForExport(filteredStudentsToday);
    const timestamp = getTimestamp();
    const title = `Late Students Report - ${new Date().toDateString()}`;
    const success = downloadTextReport(exportData, `late_students_report_${timestamp}`, title);

    if (success) {
      toast.success("Report export successful!");
    } else {
      toast.error("Export failed. Please try again.");
    }
  };

  // ============ EXPORT HANDLERS - RECORDS ============
  const handleExportExcelRecords = () => {
    if (paginatedStudents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const filters = {
      period: getPeriodTitle(selectedPeriod),
      year: selectedYear !== "all" ? `Year ${selectedYear}` : "All Years",
      branch: selectedBranch !== "all" ? selectedBranch : "All Branches",
      section: selectedSection !== "all" ? `Section ${selectedSection}` : "All Sections",
    };

    const success = exportLateRecordsToExcel(filteredStudents, filters);

    if (success) {
      toast.success(
        `Export successful!\n\nExported: ${filteredStudents.length} students\nFilters: ${filters.period}, ${filters.year}, ${filters.branch}, ${filters.section}`
      );
    } else {
      toast.error("Export failed. Please try again.");
    }
  };

  const handleExportReportRecords = () => {
    if (paginatedStudents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatLateRecordsForExport(filteredStudents);
    const timestamp = getTimestamp();
    const title = `Student Late Records - ${getPeriodTitle(selectedPeriod)} - ${new Date().toDateString()}`;
    const success = downloadTextReport(exportData, `late_records_report_${timestamp}`, title);

    if (success) {
      toast.success("Report export successful!");
    } else {
      toast.error("Export failed. Please try again.");
    }
  };

  // ============ FILTER LOGIC - TODAY ============
  const filteredStudentsToday = useMemo(() => {
    const list = Array.isArray(students) ? students : [];

    return list.filter((student) => {
      const matchesSearch =
        searchTerm === "" ||
        student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesYear = selectedYear === "all" || student.year?.toString() === selectedYear;

      const matchesBranch =
        selectedBranch === "all" ||
        student.branch?.toUpperCase() === selectedBranch.toUpperCase();

      const matchesSection =
        selectedSection === "all" ||
        student.section?.toUpperCase() === selectedSection.toUpperCase();

      return matchesSearch && matchesYear && matchesBranch && matchesSection;
    });
  }, [students, searchTerm, selectedYear, selectedBranch, selectedSection]);

  // ============ FILTER LOGIC - RECORDS ============
  const getFilteredStudents = useCallback((studentsData) => {
    if (!Array.isArray(studentsData)) return [];
    return studentsData.filter((student) => {
      const matchesYear = selectedYear === "all" || student.year?.toString() === selectedYear;
      const matchesBranch =
        selectedBranch === "all" ||
        student.branch?.toUpperCase() === selectedBranch.toUpperCase();
      const matchesSection =
        selectedSection === "all" ||
        student.section?.toUpperCase() === selectedSection.toUpperCase();
      return matchesYear && matchesBranch && matchesSection;
    });
  }, [selectedYear, selectedBranch, selectedSection]);

  const { filteredStudents, paginatedStudents, totalPages } = useMemo(() => {
    const filtered = getFilteredStudents(recordData?.students || []);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginated = filtered.slice(start, end);
    return { filteredStudents: filtered, paginatedStudents: paginated, totalPages };
  }, [recordData?.students, currentPage, getFilteredStudents]);

  // ============ UI HELPERS ============
  const getYearOptions = () => [
    { value: "all", label: "All Years", icon: "All" },
    { value: "1", label: getYearLabel(1), icon: "1" },
    { value: "2", label: getYearLabel(2), icon: "2" },
    { value: "3", label: getYearLabel(3), icon: "3" },
    { value: "4", label: getYearLabel(4), icon: "4" },
  ];

  // ============ RENDER ============
  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        padding: "2.5rem",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        animation: "scaleIn 0.5s ease-out",
      }}
    >
      {/* ============ TAB NAVIGATION ============ */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2.5rem",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("today");
            setSearchTerm("");
          }}
          style={{
            padding: "12px 24px",
            border: "none",
            borderBottom: activeTab === "today" ? "3px solid #667eea" : "none",
            background: activeTab === "today" ? "transparent" : "transparent",
            color: activeTab === "today" ? "#667eea" : "#94a3b8",
            cursor: "pointer",
            fontSize: "1.05rem",
            fontWeight: activeTab === "today" ? "700" : "600",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseOver={(e) => {
            if (activeTab !== "today") {
              e.target.style.color = "#667eea";
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== "today") {
              e.target.style.color = "#94a3b8";
            }
          }}
        >
          <FiClipboard /> Late Students Today
        </button>
        <button
          onClick={() => setActiveTab("records")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderBottom: activeTab === "records" ? "3px solid #667eea" : "none",
            background: activeTab === "records" ? "transparent" : "transparent",
            color: activeTab === "records" ? "#667eea" : "#94a3b8",
            cursor: "pointer",
            fontSize: "1.05rem",
            fontWeight: activeTab === "records" ? "700" : "600",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onMouseOver={(e) => {
            if (activeTab !== "records") {
              e.target.style.color = "#667eea";
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== "records") {
              e.target.style.color = "#94a3b8";
            }
          }}
        >
          <FiList /> Late Records
        </button>
      </div>

      {/* ============ TAB CONTENT: TODAY ============ */}
      {activeTab === "today" && (
        <div>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              marginBottom: "2rem",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                <FiClipboard color="#ffffff" size={28} />
              </div>
              <h2
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "1.75rem",
                  fontWeight: "800",
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Late Students Today
              </h2>
            </div>

            {/* Export Buttons */}
            {students.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginLeft: "auto" }}>
                <button
                  onClick={handleExportExcelToday}
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
                    gap: "0.5rem",
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
                  <FiDownload /> Export Excel
                </button>
                <button
                  onClick={handleExportReportToday}
                  style={{
                    padding: "10px 18px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  <FiFileText /> TXT Table
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          {students.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "2rem",
                flexWrap: "wrap",
                alignItems: "center",
                animation: "fadeIn 0.6s ease-out",
              }}
            >
              <div style={{ flex: 1, minWidth: "250px" }}>
                <input
                  type="text"
                  placeholder=" Search by roll number or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    background: "white",
                    boxSizing: "border-box",
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
              </div>

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
                    fontWeight: "500",
                  }}
                >
                  <option value="all"> All Years</option>
                  <option value="1"> 1st Year</option>
                  <option value="2"> 2nd Year</option>
                  <option value="3"> 3rd Year</option>
                  <option value="4"> 4th Year</option>
                </select>
              </div>

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
                    fontWeight: "500",
                  }}
                >
                  <option value="all"> All Branches</option>
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
                    fontWeight: "500",
                  }}
                >
                  <option value="all"> All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div
                style={{
                  padding: "12px 20px",
                  background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#1e40af",
                  border: "2px solid #bfdbfe",
                }}
              >
                {filteredStudentsToday.length === students.length
                  ? `${students.length} students`
                  : `${filteredStudentsToday.length} of ${students.length} students`}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                borderRadius: "20px",
                border: "2px dashed #d1d5db",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem", animation: "spin 2s linear infinite" }}>
                <FiLoader />
              </div>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  margin: "0",
                }}
              >
                Loading late students...
              </p>
            </div>
          ) : todayError ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                borderRadius: "20px",
                border: "2px solid #fca5a5",
                animation: "scaleIn 0.5s ease-out",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>
                <FiXCircle color="#991b1b" />
              </div>
              <p
                style={{
                  color: "#991b1b",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  margin: "0",
                }}
              >
                {todayError}
              </p>
            </div>
          ) : students.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                borderRadius: "20px",
                border: "2px dashed #6ee7b7",
                animation: "scaleIn 0.5s ease-out",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "1.5rem", animation: "float 3s ease-in-out infinite" }}>
                <FiCheck />
              </div>
              <p
                style={{
                  color: "#065f46",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  margin: "0 0 0.5rem 0",
                }}
              >
                No students were late today!
              </p>
              <p
                style={{
                  color: "#047857",
                  fontSize: "1rem",
                  fontWeight: "500",
                  margin: "0",
                }}
              >
                Great attendance record!
              </p>
            </div>
          ) : filteredStudentsToday.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                borderRadius: "20px",
                border: "2px dashed #fbbf24",
                animation: "scaleIn 0.5s ease-out",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>[SEARCH]</div>
              <p
                style={{
                  color: "#78350f",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  margin: "0 0 0.75rem 0",
                }}
              >
                No students match your search criteria
              </p>
              <p
                style={{
                  color: "#92400e",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  margin: "0",
                }}
              >
                Try adjusting your filters or search term
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredStudentsToday.map((s, index) => (
                <li
                  key={s._id}
                  style={{
                    marginBottom: "1.25rem",
                    padding: "2rem",
                    border: "2px solid rgba(102, 126, 234, 0.1)",
                    borderRadius: "20px",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.3s ease",
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                    position: "relative",
                    overflow: "hidden",
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleExpanded(s._id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "700",
                          color: "#1e293b",
                          marginBottom: "0.5rem",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {s.rollNo} - {s.name}
                      </div>
                      {(s.branch || s.section || s.year) && (
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#64748b",
                            marginBottom: "0.75rem",
                            fontWeight: "500",
                          }}
                        >
                          {s.branch && ` ${s.branch}`}
                          {s.branch && s.section && " • "}
                          {s.section && ` Section ${s.section}`}
                          {s.year && ` • Year ${s.year}`}
                          {s.semester && ` • Sem ${s.semester}`}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 16px",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background:
                              s.lateDays > 10
                                ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                                : s.lateDays > 7
                                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            boxShadow:
                              s.lateDays > 10
                                ? "0 4px 12px rgba(220, 38, 38, 0.3)"
                                : s.lateDays > 7
                                  ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                                  : "0 4px 12px rgba(16, 185, 129, 0.3)",
                          }}
                        >
                          {s.lateDays}/10 late days
                        </span>

                        {s.status === "approaching_limit" && (
                          <span
                            style={{
                              padding: "6px 16px",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                              color: "#78350f",
                              boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)",
                            }}
                          >
                            Approaching Limit
                          </span>
                        )}

                        {s.status === "grace_period" && (
                          <span
                            style={{
                              padding: "6px 16px",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                              color: "white",
                              boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                            }}
                          >
                            Grace Period ({s.gracePeriodUsed}/4)
                          </span>
                        )}

                        {s.status === "fined" && (
                          <span
                            style={{
                              padding: "6px 16px",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                              color: "white",
                              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                            }}
                          >
                            Being Fined
                          </span>
                        )}

                        {s.fines > 0 && (
                          <span
                            style={{
                              padding: "6px 16px",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              color: "white",
                              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            ₹{s.fines} Total Fines
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      style={{
                        background:
                          expandedStudent === s._id
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
                        boxShadow:
                          expandedStudent === s._id
                            ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                            : "none",
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
                    <div
                      style={{
                        marginTop: "2rem",
                        paddingTop: "2rem",
                        borderTop: "2px solid rgba(102, 126, 234, 0.15)",
                        animation: "fadeIn 0.4s ease-out",
                      }}
                    >
                      {(() => {
                        const todayInfo = getTodayLateInfo(s.lateLogs);
                        if (todayInfo) {
                          return (
                            <div
                              style={{
                                marginBottom: "2rem",
                                padding: "1.25rem",
                                background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
                                borderRadius: "16px",
                                border: "2px solid #c7d2fe",
                                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
                              }}
                            >
                              <h4
                                style={{
                                  margin: "0 0 1rem 0",
                                  fontSize: "1rem",
                                  color: "#4338ca",
                                  fontWeight: "700",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <FiUser />
                                Authorization Details
                              </h4>
                              <div style={{ fontSize: "0.9rem", color: "#4338ca", lineHeight: "1.8" }}>
                                <div>
                                  <strong>Marked by:</strong> {todayInfo.markedByName || "Unknown"}
                                </div>
                                {todayInfo.markedByEmail && (
                                  <div>
                                    <strong>Email:</strong> {todayInfo.markedByEmail}
                                  </div>
                                )}
                                <div>
                                  <strong>Marked at:</strong>{" "}
                                  {new Date(todayInfo.date).toLocaleString()}
                                </div>
                                <div>
                                  <strong>Time elapsed:</strong> {todayInfo.minutesSinceMarking}{" "}
                                  minutes ago
                                </div>
                              </div>

                              {todayInfo.canUndo && (
                                <button
                                  onClick={() => handleUndoLate(s.rollNo)}
                                  disabled={undoingStudent === s.rollNo}
                                  style={{
                                    marginTop: "1rem",
                                    padding: "10px 20px",
                                    background:
                                      undoingStudent === s.rollNo
                                        ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                                        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "12px",
                                    cursor: undoingStudent === s.rollNo ? "not-allowed" : "pointer",
                                    fontSize: "0.9rem",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseOver={(e) => {
                                    if (undoingStudent !== s.rollNo) {
                                      e.currentTarget.style.transform = "translateY(-2px)";
                                      e.currentTarget.style.boxShadow =
                                        "0 6px 16px rgba(245, 158, 11, 0.4)";
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    if (undoingStudent !== s.rollNo) {
                                      e.currentTarget.style.transform = "translateY(0)";
                                      e.currentTarget.style.boxShadow =
                                        "0 4px 12px rgba(245, 158, 11, 0.3)";
                                    }
                                  }}
                                >
                                  <FiRotateCcw />
                                  {undoingStudent === s.rollNo
                                    ? "Undoing..."
                                    : `Undo Late Marking (${10 - todayInfo.minutesSinceMarking} min left)`}
                                </button>
                              )}

                              {!todayInfo.canUndo && (
                                <div
                                  style={{
                                    marginTop: "1rem",
                                    padding: "0.75rem",
                                    background: "#fee2e2",
                                    borderRadius: "8px",
                                    color: "#991b1b",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                  }}
                                >
                                  ⏱ Edit window expired. Late marking cannot be undone after 10
                                  minutes.
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          fontSize: "1.1rem",
                          color: "#334155",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "1.5rem" }}>
                          <FiCalendar />
                        </span>
                        Today's Late Entries:
                      </h4>
                      {getLateDatesForToday(s.lateLogs).length > 0 ? (
                        <ul
                          style={{
                            margin: "0 0 2rem 0",
                            padding: "1.25rem",
                            background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                            borderRadius: "16px",
                            border: "2px solid #fca5a5",
                            listStyle: "none",
                            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)",
                          }}
                        >
                          {getLateDatesForToday(s.lateLogs).map((log, index) => (
                            <li
                              key={index}
                              style={{
                                color: "#991b1b",
                                fontWeight: "600",
                                padding: "0.5rem 0",
                                fontSize: "0.95rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              {formatDate(log.date)} (Today
                              {log.count > 1 ? ` x${log.count}` : ""})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p
                          style={{
                            margin: "0 0 2rem 0",
                            padding: "1.25rem",
                            background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                            borderRadius: "16px",
                            color: "#6b7280",
                            fontSize: "0.95rem",
                            fontStyle: "italic",
                            fontWeight: "500",
                            border: "2px solid #d1d5db",
                          }}
                        >
                          No entries for today
                        </p>
                      )}

                      <h4
                        style={{
                          margin: "0 0 1rem 0",
                          fontSize: "1.1rem",
                          color: "#334155",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "1.5rem" }}>
                          <FiList />
                        </span>
                        Recent Late History:
                      </h4>
                      <ul
                        style={{
                          margin: "0 0 1.5rem 0",
                          padding: "1.25rem",
                          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                          borderRadius: "16px",
                          listStyle: "none",
                          maxHeight: "200px",
                          overflowY: "auto",
                          border: "2px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        {getRecentLateDates(s.lateLogs).map((log, index) => (
                          <li
                            key={index}
                            style={{
                              color: isToday(log.date) ? "#991b1b" : "#64748b",
                              fontSize: "0.9rem",
                              padding: "0.5rem 0",
                              fontWeight: isToday(log.date) ? "600" : "500",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>
                              {isToday(log.date) ? (
                                <FiAlertCircle color="#dc2626" />
                              ) : (
                                <FiCircle color="#64748b" />
                              )}
                            </span>
                            {formatDate(log.date)}
                            {log.count > 1 && (
                              <span
                                style={{
                                  marginLeft: "0.5rem",
                                  padding: "2px 6px",
                                  borderRadius: "999px",
                                  background: "#e2e8f0",
                                  color: "#334155",
                                  fontSize: "0.75rem",
                                  fontWeight: "700",
                                }}
                              >
                                x{log.count}
                              </span>
                            )}
                            {isToday(log.date) && (
                              <span
                                style={{
                                  color: "#dc2626",
                                  fontWeight: "700",
                                  marginLeft: "0.5rem",
                                }}
                              >
                                (Today)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {s.fines > 0 && (
                        <div
                          style={{
                            marginTop: "1.5rem",
                            padding: "1.25rem",
                            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            border: "2px solid #fbbf24",
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)",
                          }}
                        >
                          <FiDollarSign style={{ fontSize: "2rem" }} />
                          <strong
                            style={{
                              color: "#78350f",
                              fontSize: "1.2rem",
                              fontWeight: "700",
                            }}
                          >
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
        </div>
      )}

      {/* ============ TAB CONTENT: RECORDS ============ */}
      {activeTab === "records" && (
        <div>
          {/* Header */}
          <div
            style={{
              marginBottom: "2.5rem",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                <FiList style={{ fontSize: "2.5rem", color: "white" }} />
              </div>
              <div>
                <h2
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: "2rem",
                    fontWeight: "800",
                    margin: "0 0 0.25rem 0",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Student Late Records
                </h2>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "1.05rem",
                    fontWeight: "500",
                    margin: "0",
                  }}
                >
                  View late tracking records by time period and filters
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            {recordData && recordData.students && recordData.students.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginLeft: "auto" }}>
                <button
                  onClick={handleExportExcelRecords}
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
                    gap: "0.5rem",
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
                  <FiDownload /> Export Excel
                </button>
                <button
                  onClick={handleExportReportRecords}
                  style={{
                    padding: "10px 18px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  <FiFileText /> Export TXT
                </button>
              </div>
            )}
          </div>

          {/* Period Selection Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1.25rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { key: "weekly", label: <>Weekly</>, desc: "Last 7 days" },
              { key: "monthly", label: <>Monthly</>, desc: "Current month" },
              { key: "semester", label: <>Semester</>, desc: "Current semester" },
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                style={{
                  padding: "16px 28px",
                  border: "2px solid transparent",
                  borderRadius: "16px",
                  background:
                    selectedPeriod === period.key
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(102, 126, 234, 0.08)",
                  color: selectedPeriod === period.key ? "white" : "#667eea",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                  minWidth: "150px",
                  boxShadow:
                    selectedPeriod === period.key
                      ? "0 8px 20px rgba(102, 126, 234, 0.35)"
                      : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseOver={(e) => {
                  if (selectedPeriod !== period.key) {
                    e.target.style.background = "rgba(102, 126, 234, 0.15)";
                    e.target.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedPeriod !== period.key) {
                    e.target.style.background = "rgba(102, 126, 234, 0.08)";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                <div style={{ fontSize: "1.1rem" }}>{period.label}</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    opacity: selectedPeriod === period.key ? "0.9" : "0.7",
                    fontWeight: "500",
                  }}
                >
                  {period.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Year Filter Selection */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                color: "#495057",
                fontWeight: "500",
                alignSelf: "center",
                marginRight: "0.5rem",
              }}
            >
              Filter by Year:
            </span>
            {getYearOptions().map((yearOption) => (
              <button
                key={yearOption.value}
                onClick={() => setSelectedYear(yearOption.value)}
                style={{
                  padding: "6px 12px",
                  border:
                    selectedYear === yearOption.value ? "2px solid #28a745" : "1px solid #dee2e6",
                  borderRadius: "20px",
                  backgroundColor: selectedYear === yearOption.value ? "#28a745" : "#ffffff",
                  color: selectedYear === yearOption.value ? "white" : "#495057",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                {yearOption.label}
              </button>
            ))}
          </div>

          {/* Branch and Section Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  color: "#495057",
                  fontWeight: "500",
                }}
              >
                Branch:
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">All Branches</option>
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

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label
                style={{
                  fontSize: "0.9rem",
                  color: "#495057",
                  fontWeight: "500",
                }}
              >
                Section:
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{
                  padding: "6px 12px",
                  border: "2px solid #dee2e6",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "600",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
              }}
            >
              {filteredStudents.length} students
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                borderRadius: "20px",
                border: "2px dashed #d1d5db",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "1.5rem",
                  animation: "spin 2s linear infinite",
                }}
              >
                <FiLoader />
              </div>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  margin: "0",
                }}
              >
                Loading records...
              </p>
            </div>
          ) : recordError ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                borderRadius: "20px",
                border: "2px solid #fca5a5",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>
                <FiXCircle color="#991b1b" />
              </div>
              <p
                style={{
                  color: "#991b1b",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  margin: "0",
                }}
              >
                {recordError}
              </p>
            </div>
          ) : !recordData || !recordData.students || recordData.students.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                borderRadius: "20px",
                border: "2px dashed #6ee7b7",
              }}
            >
              <div
                style={{
                  fontSize: "4rem",
                  marginBottom: "1.5rem",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                <FiCheck />
              </div>
              <p
                style={{
                  color: "#065f46",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  margin: "0 0 0.5rem 0",
                }}
              >
                No late records found!
              </p>
              <p
                style={{
                  color: "#047857",
                  fontSize: "1rem",
                  fontWeight: "500",
                  margin: "0",
                }}
              >
                Students are maintaining great attendance.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                borderRadius: "20px",
                border: "2px dashed #fbbf24",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}><FiSearch /></div>
              <p
                style={{
                  color: "#78350f",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  margin: "0 0 0.75rem 0",
                }}
              >
                No students match your filters
              </p>
              <p
                style={{
                  color: "#92400e",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  margin: "0",
                }}
              >
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div>
              {/* Student Records */}
              <div style={{ marginBottom: "2rem" }}>
                {paginatedStudents.map((student) => (
                  <div
                    key={student._id}
                    style={{
                      padding: "1rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      border: "1px solid #dee2e6",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#343a40",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {student.rollNo} - {student.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            backgroundColor:
                              student.lateDays > 10
                                ? "#dc3545"
                                : student.lateDays > 7
                                  ? "#fd7e14"
                                  : "#28a745",
                            color: "white",
                          }}
                        >
                          {student.lateDays}/10 late days
                        </span>

                        {student.status === "approaching_limit" && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              backgroundColor: "#ffc107",
                              color: "#212529",
                            }}
                          >
                            Approaching
                          </span>
                        )}

                        {student.status === "grace_period" && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              backgroundColor: "#fd7e14",
                              color: "white",
                            }}
                          >
                            Grace ({student.gracePeriodUsed}/4)
                          </span>
                        )}

                        {student.status === "fined" && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              backgroundColor: "#dc3545",
                              color: "white",
                            }}
                          >
                            Fined
                          </span>
                        )}

                        {student.fines > 0 && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              backgroundColor: "#e74c3c",
                              color: "white",
                            }}
                          >
                            ₹{student.fines}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#6c757d",
                        textAlign: "right",
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                        Latest Info:
                      </div>
                      {student.lateLogs &&
                        student.lateLogs.slice(-2).map((log, index) => (
                          <div key={index} style={{ fontSize: "0.75rem", lineHeight: "1.4" }}>
                            <div>{formatDate(log.date)}</div>
                            {log.markedByName && (
                              <div
                                style={{
                                  color: "#495057",
                                  fontSize: "0.7rem",
                                  fontStyle: "italic",
                                }}
                              >
                                By: {log.markedByName}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "2rem",
                    paddingTop: "2rem",
                    borderTop: "2px solid #e2e8f0",
                  }}
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: "10px 16px",
                      background:
                        currentPage === 1
                          ? "#e2e8f0"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: currentPage === 1 ? "#94a3b8" : "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  <span
                    style={{
                      padding: "8px 16px",
                      background: "#f3f4f6",
                      borderRadius: "8px",
                      fontWeight: "600",
                      color: "#1e293b",
                      minWidth: "120px",
                      textAlign: "center",
                    }}
                  >
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "10px 16px",
                      background:
                        currentPage === totalPages
                          ? "#e2e8f0"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: currentPage === totalPages ? "#94a3b8" : "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}

              <div
                style={{
                  marginTop: "1rem",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "500",
                }}
              >
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of{" "}
                {filteredStudents.length} students
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CombinedLateView;
