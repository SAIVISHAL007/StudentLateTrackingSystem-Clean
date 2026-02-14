import { useEffect, useState } from "react";
import { FiList, FiDownload, FiFileText, FiCalendar, FiBarChart2, FiUser } from "react-icons/fi";
import API from "../services/api";
import { formatDate } from "../utils/dateUtils";
import { downloadTextReport, formatLateRecordsForExport, getTimestamp } from "../utils/exportUtils";
import { exportLateRecordsToExcel } from "../utils/excelExport";
import { toast } from "./Toast";

function Record() {
 const [selectedPeriod, setSelectedPeriod] = useState("weekly");
 const [selectedYear, setSelectedYear] = useState("all");
 const [selectedBranch, setSelectedBranch] = useState("all");
 const [selectedSection, setSelectedSection] = useState("all");
 const [recordData, setRecordData] = useState(null);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 fetchRecords(selectedPeriod);
 setSelectedYear("all"); // Reset year filter when period changes
 setSelectedBranch("all");
 setSelectedSection("all");
 }, [selectedPeriod]);

 const fetchRecords = async (period) => {
 setLoading(true);
 try {
 const res = await API.get(`/students/records/${period}`);
 setRecordData(res.data);
 } catch (err) {
 console.error(' Error fetching records:', err);
 console.error('Response data:', err.response?.data);
 setRecordData(null);
 } finally {
 setLoading(false);
 }
 };

 const getPeriodTitle = (period) => {
 switch (period) {
 case "weekly": return "Weekly Records";
 case "monthly": return "Monthly Records";
 case "semester": return "Semester Records";
 default: return "Records";
 }
 };

 const groupStudentsByYear = (students) => {
 const grouped = {
 1: [], 2: [], 3: [], 4: []
 };
 
 students.forEach(student => {
 if (grouped[student.year]) {
 grouped[student.year].push(student);
 }
 });

 // Sort by late count in period (descending)
 Object.keys(grouped).forEach(year => {
 grouped[year].sort((a, b) => b.lateCountInPeriod - a.lateCountInPeriod);
 });

 return grouped;
 };

 const getYearLabel = (year) => {
 const labels = {
 1: "1st Year Students",
 2: "2nd Year Students", 
 3: "3rd Year Students",
 4: "4th Year Students"
 };
 return labels[year] || `Year ${year}`;
 };

 const getFilteredStudents = (students) => {
 if (!Array.isArray(students)) return [];
 return students.filter(student => {
 const matchesYear = selectedYear === "all" || student.year?.toString() === selectedYear;
 const matchesBranch = selectedBranch === "all" || student.branch?.toUpperCase() === selectedBranch.toUpperCase();
 const matchesSection = selectedSection === "all" || student.section?.toUpperCase() === selectedSection.toUpperCase();
 return matchesYear && matchesBranch && matchesSection;
 });
 };

 const getYearOptions = () => [
 { value: "all", label: "All Years"},
 { value: "1", label: "1st Year", icon: "" },
 { value: "2", label: "2nd Year", icon: "" },
 { value: "3", label: "3rd Year", icon: "" },
 { value: "4", label: "4th Year", icon: "" }
 ];

 const handleExportExcel = () => {
 if (!recordData || !recordData.students || recordData.students.length === 0) {
 toast.error('❌ No data to export');
 return;
 }
 
 const filteredStudents = getFilteredStudents(recordData.students);
 
 if (filteredStudents.length === 0) {
 toast.error('❌ No students match your filters');
 return;
 }
 
 const filters = {
 year: selectedYear !== "all" ? `Year ${selectedYear}` : "All Years",
 branch: selectedBranch !== "all" ? selectedBranch : "All Branches",
 section: selectedSection !== "all" ? `Section ${selectedSection}` : "All Sections"
 };
 
 const periodInfo = {
 period: getPeriodTitle(selectedPeriod),
 startDate: recordData.startDate,
 endDate: recordData.endDate
 };
 
 const filename = `late_records_${selectedPeriod}`;
 const success = exportLateRecordsToExcel(filteredStudents, filename, filters, periodInfo);
 
 if (success) {
 toast.success(`✅ Excel export successful!\n\nExported: ${filteredStudents.length} students\nPeriod: ${periodInfo.period}\nFilters: ${filters.year}, ${filters.branch}, ${filters.section}`);
 } else {
 toast.error('❌ Export failed. Please try again.');
 }
 };

 const handleExportReport = () => {
 if (!recordData || !recordData.students || recordData.students.length === 0) {
 alert(" No data to export");
 return;
 }
 
 const filteredStudents = getFilteredStudents(recordData.students);
 const exportData = formatLateRecordsForExport(filteredStudents, selectedPeriod);
 const timestamp = getTimestamp();
 const yearFilter = selectedYear === "all" ? "All Years" : `Year ${selectedYear}`;
 const title = `Late Records Report - ${getPeriodTitle(selectedPeriod)} (${yearFilter})`;
 const success = downloadTextReport(exportData, `late_records_report_${selectedPeriod}_${timestamp}`, title);
 
 if (success) {
 alert("Report export successful!");
 } else {
 alert(" Export failed. Please try again.");
 }
 };

 const renderYearSection = (year, students) => {
 if (students.length === 0) return null;

 return (
 <div key={year} style={{
 marginBottom: "2rem",
 backgroundColor: "#ffffff",
 borderRadius: "12px",
 padding: "1.5rem",
 boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
 border: "1px solid #e9ecef"
 }}>
 <h3 style={{
 color: "#495057",
 fontSize: "1.3rem",
 fontWeight: "600",
 marginBottom: "1.5rem",
 display: "flex",
 alignItems: "center",
 gap: "0.5rem"
 }}>
 {year === "1" && ""} 
 {year === "2" && ""} 
 {year === "3" && ""} 
 {year === "4" && ""} 
 {getYearLabel(year)} ({students.length} students)
 </h3>

 <div style={{
 display: "grid",
 gap: "1rem"
 }}>
 {students.map(student => (
 <div key={student._id} style={{
 padding: "1rem",
 backgroundColor: "#f8f9fa",
 borderRadius: "8px",
 border: "1px solid #dee2e6",
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center"
 }}>
 <div>
 <div style={{
 fontSize: "1rem",
 fontWeight: "600",
 color: "#343a40",
 marginBottom: "0.5rem"
 }}>
 {student.rollNo} - {student.name}
 </div>
 <div style={{
 display: "flex",
 gap: "1rem",
 alignItems: "center",
 flexWrap: "wrap"
 }}>
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: student.lateDays > 10 ? "#dc3545" : student.lateDays > 7 ? "#fd7e14" : "#28a745",
 color: "white"
 }}>
 {student.lateDays}/10 late days
 </span>
 
 {/* Status indicators */}
 {student.status === 'approaching_limit' && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#ffc107",
 color: "#212529"
 }}>
 Approaching
 </span>
 )}
 
 {student.status === 'grace_period' && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#fd7e14",
 color: "white"
 }}>
 Grace ({student.gracePeriodUsed}/4)
 </span>
 )}
 
 {student.status === 'fined' && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#dc3545",
 color: "white"
 }}>
 Fined
 </span>
 )}
 
 {student.fines > 0 && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#e74c3c",
 color: "white"
 }}>
 ₹{student.fines}
 </span>
 )}
 </div>
 </div>
 <div style={{
 fontSize: "0.8rem",
 color: "#6c757d",
 textAlign: "right"
 }}>
 <div>Latest dates:</div>
 {student.lateLogs.slice(-2).map((log, index) => (
 <div key={index} style={{ fontSize: "0.75rem" }}>
 {formatDate(log.date)}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 };

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
 {/* Header Section */}
 <div style={{
 marginBottom: "2.5rem",
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 flexWrap: "wrap",
 gap: "1.5rem"
 }}>
 <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
 <div style={{
 width: "70px",
 height: "70px",
 background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
 borderRadius: "18px",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 fontSize: "2.5rem",
 boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
 animation: "float 3s ease-in-out infinite"
 }}>
 <FiList style={{ fontSize: "2.5rem", color: "white" }} />
 </div>
 <div>
 <h2 style={{
 background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
 WebkitBackgroundClip: "text",
 WebkitTextFillColor: "transparent",
 backgroundClip: "text",
 fontSize: "2rem",
 fontWeight: "800",
 margin: "0 0 0.25rem 0",
 letterSpacing: "-0.5px"
 }}>
 Student Late Records
 </h2>
 <p style={{
 color: "#64748b",
 fontSize: "1.05rem",
 fontWeight: "500",
 margin: "0"
 }}>
 View late tracking records by time period and filters
 </p>
 </div>
 </div>
 
 {/* Export Buttons */}
 {recordData && recordData.students && recordData.students.length > 0 && (
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
 <FiDownload /> Export Excel
 </button>
 <button
 onClick={handleExportReport}
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
 gap: "0.5rem"
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
 <div style={{
 display: "flex",
 justifyContent: "center",
 gap: "1.25rem",
 marginBottom: "2rem",
 flexWrap: "wrap"
 }}>
 {[
 { key: "weekly", label: <><FiCalendar /> Weekly</>, desc: "Last 7 days" },
 { key: "monthly", label: <><FiBarChart2 /> Monthly</>, desc: "Current month" },
 { key: "semester", label: <><FiUser /> Semester</>, desc: "Current semester" }
 ].map(period => (
 <button
 key={period.key}
 onClick={() => setSelectedPeriod(period.key)}
 style={{
 padding: "16px 28px",
 border: "2px solid transparent",
 borderRadius: "16px",
 background: selectedPeriod === period.key 
 ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
 : "rgba(102, 126, 234, 0.08)",
 color: selectedPeriod === period.key ? "white" : "#667eea",
 cursor: "pointer",
 fontSize: "0.95rem",
 fontWeight: "600",
 transition: "all 0.3s ease",
 textAlign: "center",
 minWidth: "150px",
 boxShadow: selectedPeriod === period.key 
 ? "0 8px 20px rgba(102, 126, 234, 0.35)"
 : "none"
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
 <div style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{period.label}</div>
 <div style={{
 fontSize: "0.75rem",
 opacity: selectedPeriod === period.key ? "0.9" : "0.7",
 fontWeight: "500"
 }}>
 {period.desc}
 </div>
 </button>
 ))}
 </div>

 {/* Year Filter Selection */}
 <div style={{
 display: "flex",
 justifyContent: "center",
 gap: "0.5rem",
 marginBottom: "1rem",
 flexWrap: "wrap"
 }}>
 <span style={{
 fontSize: "0.9rem",
 color: "#495057",
 fontWeight: "500",
 alignSelf: "center",
 marginRight: "0.5rem"
 }}>
 Filter by Year:
 </span>
 {getYearOptions().map(yearOption => (
 <button
 key={yearOption.value}
 onClick={() => setSelectedYear(yearOption.value)}
 style={{
 padding: "6px 12px",
 border: selectedYear === yearOption.value ? "2px solid #28a745" : "1px solid #dee2e6",
 borderRadius: "20px",
 backgroundColor: selectedYear === yearOption.value ? "#28a745" : "#ffffff",
 color: selectedYear === yearOption.value ? "white" : "#495057",
 cursor: "pointer",
 fontSize: "0.8rem",
 fontWeight: "500",
 transition: "all 0.2s ease",
 display: "flex",
 alignItems: "center",
 gap: "0.3rem"
 }}
 >
 <span>{yearOption.icon}</span>
 {yearOption.label}
 </button>
 ))}
 </div>

 {/* Branch and Section Filters */}
 <div style={{
 display: "flex",
 justifyContent: "center",
 gap: "1rem",
 marginBottom: "2rem",
 flexWrap: "wrap",
 alignItems: "center"
 }}>
 {/* Branch Filter */}
 <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
 <label style={{
 fontSize: "0.9rem",
 color: "#495057",
 fontWeight: "500"
 }}>
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
 outline: "none"
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

 {/* Section Filter */}
 <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
 <label style={{
 fontSize: "0.9rem",
 color: "#495057",
 fontWeight: "500"
 }}>
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
 outline: "none"
 }}
 >
 <option value="all">All Sections</option>
 <option value="A">Section A</option>
 <option value="B">Section B</option>
 <option value="C">Section C</option>
 <option value="D">Section D</option>
 </select>
 </div>

 {/* Clear Filters Button */}
 {(selectedYear !== "all" || selectedBranch !== "all" || selectedSection !== "all") && (
 <button
 onClick={() => {
 setSelectedYear("all");
 setSelectedBranch("all");
 setSelectedSection("all");
 }}
 style={{
 padding: "6px 12px",
 border: "none",
 borderRadius: "8px",
 backgroundColor: "#dc3545",
 color: "white",
 cursor: "pointer",
 fontSize: "0.8rem",
 fontWeight: "500",
 transition: "background-color 0.2s"
 }}
 onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
 onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
 >
 Clear Filters
 </button>
 )}
 </div>

 {/* Loading State */}
 {loading && (
 <div style={{
 textAlign: "center",
 padding: "3rem",
 color: "#6c757d"
 }}>
 <div style={{ fontSize: "2rem", marginBottom: "1rem" }}></div>
 <p>Loading records...</p>
 </div>
 )}

 {/* Records Display */}
 {!loading && recordData && (
 <>
 {/* Summary Header */}
 <div style={{
 background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
 padding: "2rem",
 borderRadius: "20px",
 marginBottom: "2.5rem",
 border: "2px solid #bfdbfe",
 boxShadow: "0 8px 20px rgba(102, 126, 234, 0.1)"
 }}>
 <h3 style={{
 color: "#1e40af",
 fontSize: "1.5rem",
 fontWeight: "700",
 marginBottom: "1.25rem",
 display: "flex",
 alignItems: "center",
 gap: "0.5rem"
 }}>
 {getPeriodTitle(selectedPeriod)} 
 {selectedYear !== "all" && (
 <span style={{ 
 fontSize: "1.1rem", 
 color: "#3b82f6",
 fontWeight: "600"
 }}>
 {" "}- {getYearOptions().find(y => y.value === selectedYear)?.icon} {getYearOptions().find(y => y.value === selectedYear)?.label}
 </span>
 )}
 </h3>
 <div style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
 gap: "1.25rem",
 fontSize: "0.95rem"
 }}>
 <div style={{
 padding: "1rem",
 background: "rgba(255, 255, 255, 0.7)",
 borderRadius: "12px",
 fontWeight: "500",
 color: "#1e3a8a"
 }}>
 <div style={{ fontSize: "0.85rem", opacity: "0.8", marginBottom: "0.25rem" }}>Period</div>
 <div style={{ fontWeight: "700" }}>{formatDate(recordData.startDate)} - {formatDate(recordData.endDate)}</div>
 </div>
 <div style={{
 padding: "1rem",
 background: "rgba(255, 255, 255, 0.7)",
 borderRadius: "12px",
 fontWeight: "500",
 color: "#1e3a8a"
 }}>
 <div style={{ fontSize: "0.85rem", opacity: "0.8", marginBottom: "0.25rem" }}>Students</div>
 <div style={{ fontWeight: "700" }}>{getFilteredStudents(recordData.students).length}</div>
 </div>
 <div style={{
 padding: "1rem",
 background: "rgba(255, 255, 255, 0.7)",
 borderRadius: "12px",
 fontWeight: "500",
 color: "#1e3a8a"
 }}>
 <div style={{ fontSize: "0.85rem", opacity: "0.8", marginBottom: "0.25rem" }}>Late Instances</div>
 <div style={{ fontWeight: "700" }}>{getFilteredStudents(recordData.students).reduce((sum, s) => sum + s.lateCountInPeriod, 0)}</div>
 </div>
 </div>
 </div>

 {/* Students Display */}
 {(() => {
 const filteredStudents = getFilteredStudents(recordData.students);
 
 if (filteredStudents.length === 0) {
 return (
 <div style={{
 textAlign: "center",
 padding: "3rem",
 backgroundColor: "#f8f9fa",
 borderRadius: "8px",
 border: "2px dashed #dee2e6"
 }}>
 <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
 {selectedYear === "all" ? "" : getYearOptions().find(y => y.value === selectedYear)?.icon}
 </div>
 <h3 style={{ color: "#28a745", margin: "0 0 0.5rem 0" }}>
 {selectedYear === "all" ? "Excellent Attendance!" : "No Late Records Found!"}
 </h3>
 <p style={{ color: "#6c757d", margin: "0" }}>
 {selectedYear === "all" 
 ? `No students were late during this ${selectedPeriod.replace('ly', '')} period.`
 : `No ${getYearOptions().find(y => y.value === selectedYear)?.label} students were late during this ${selectedPeriod.replace('ly', '')} period.`
 }
 </p>
 </div>
 );
 }

 // If showing all years, group by year
 if (selectedYear === "all") {
 const groupedStudents = groupStudentsByYear(filteredStudents);
 return (
 <div>
 {Object.entries(groupedStudents)
 .map(([year, students]) => renderYearSection(year, students))}
 </div>
 );
 } else {
 // Show specific year students in a simple list
 return (
 <div style={{
 backgroundColor: "#ffffff",
 borderRadius: "12px",
 padding: "1.5rem",
 boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
 border: "1px solid #e9ecef"
 }}>
 <h3 style={{
 color: "#495057",
 fontSize: "1.3rem",
 fontWeight: "600",
 marginBottom: "1.5rem",
 display: "flex",
 alignItems: "center",
 gap: "0.5rem"
 }}>
 {getYearOptions().find(y => y.value === selectedYear)?.icon} 
 {getYearOptions().find(y => y.value === selectedYear)?.label} ({filteredStudents.length} students)
 </h3>

 <div style={{
 display: "grid",
 gap: "1rem"
 }}>
 {filteredStudents.map(student => (
 <div key={student._id} style={{
 padding: "1rem",
 backgroundColor: "#f8f9fa",
 borderRadius: "8px",
 border: "1px solid #dee2e6",
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center"
 }}>
 <div>
 <div style={{
 fontSize: "1rem",
 fontWeight: "600",
 color: "#343a40",
 marginBottom: "0.25rem"
 }}>
 {student.rollNo} - {student.name}
 </div>
 {(student.branch || student.section) && (
 <div style={{
 fontSize: "0.75rem",
 color: "#6c757d",
 marginBottom: "0.5rem"
 }}>
 {student.branch && ` ${student.branch}`}
 {student.branch && student.section && ' • '}
 {student.section && ` Sec ${student.section}`}
 </div>
 )}
 <div style={{
 display: "flex",
 gap: "1rem",
 alignItems: "center",
 flexWrap: "wrap"
 }}>
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: student.lateDays > 10 ? "#dc3545" : student.lateDays > 7 ? "#fd7e14" : "#28a745",
 color: "white"
 }}>
 {student.lateDays}/10 late days
 </span>
 
 {/* Status indicators */}
 {student.status === 'approaching_limit' && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#ffc107",
 color: "#212529"
 }}>
 Approaching
 </span>
 )}
 
 {student.status === 'grace_period' && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#fd7e14",
 color: "white"
 }}>
 Grace ({student.gracePeriodUsed}/4)
 </span>
 )}
 
 {student.status === 'fined' && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#dc3545",
 color: "white"
 }}>
 Fined
 </span>
 )}
 
 {student.fines > 0 && (
 <span style={{
 padding: "3px 8px",
 borderRadius: "12px",
 fontSize: "0.75rem",
 fontWeight: "500",
 backgroundColor: "#e74c3c",
 color: "white"
 }}>
 ₹{student.fines}
 </span>
 )}
 </div>
 </div>
 <div style={{
 fontSize: "0.8rem",
 color: "#6c757d",
 textAlign: "right"
 }}>
 <div>Latest dates:</div>
 {student.lateLogs.slice(-2).map((log, index) => (
 <div key={index} style={{ fontSize: "0.75rem" }}>
 {formatDate(log.date)}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 }
 })()}
 </>
 )}

 {/* Error State */}
 {!loading && !recordData && (
 <div style={{
 textAlign: "center",
 padding: "3rem",
 color: "#dc3545"
 }}>
 <div style={{ fontSize: "2rem", marginBottom: "1rem" }}></div>
 <p>Failed to load records. Please try again.</p>
 </div>
 )}
 </div>
 );
}

export default Record;