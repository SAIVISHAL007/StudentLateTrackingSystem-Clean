import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { enqueueLateMark } from "../utils/offlineQueue";
import { toast } from "./Toast";

function PrefetchedStudentForm() {
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [marking, setMarking] = useState(false);

  const years = [1, 2, 3, 4];
  const branches = ["CSE", "CSM", "CSD", "CSC", "ECE", "EEE", "MECH", "CIVIL", "IT"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build params dynamically based on what's selected
      const params = { year };
      if (branch) params.branch = branch;
      if (semester) params.semester = semester;
      
      const response = await API.get("/students/filter", { params });
      setStudents(response.data.students || []);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [year, branch, semester]);

  // Fetch students when filters change - show live results as user selects
  useEffect(() => {
    if (year) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudent(null);
    }
  }, [year, fetchStudents]);

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
        toast.success(`✅ ${selectedStudent.name} marked as late`);
        setShowConfirmation(false);
        setSelectedStudent(null);
      } catch (error) {
        // If offline, queue it
        if (error.message === "Network Error" || !navigator.onLine) {
          enqueueLateMark(payload);
          toast.warning(`📱 Queued: ${selectedStudent.name} (will sync when online)`);
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
      padding: "2rem",
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
        borderRadius: "0.5rem"
      }}>
        <span style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#d97706"
        }}>🚀 BETA</span>
        <div>
          <p style={{ margin: 0, fontWeight: "600", color: "#b45309" }}>
            Working in Development
          </p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#9a3412" }}>
            Enhanced student selection with cascading filters
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {/* Year Dropdown */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
            📅 Year
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
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
            🏢 Branch
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

        {/* Semester Dropdown */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
            📚 Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
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
            <option value="">Select Semester</option>
            {semesters.map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading students...</p>
        </div>
      ) : students.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          {students.map(student => (
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
                <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#1f2937" }}>
                  {student.rollNo}
                </p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#6b7280" }}>
                  {student.name}
                </p>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "#6b7280",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e5e7eb"
              }}>
                <span>Branch: {student.branch}</span>
                <span>Sem: {student.semester}</span>
              </div>
              <div style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginTop: "0.25rem"
              }}>
                <span>Year: {student.year} | Sec: {student.section || "A"}</span>
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
            {!branch ? "Try selecting a branch" : !semester ? "Try selecting a semester" : "No matching students"}
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
            👆 Start by selecting a Year to see students
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
            padding: "2rem",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)"
          }}>
            <h2 style={{ marginTop: 0, color: "#1f2937" }}>Confirm Mark Late</h2>
            
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
    </div>
  );
}

export default PrefetchedStudentForm;
