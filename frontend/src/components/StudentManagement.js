import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import API from "../services/api";
import { toast } from "./Toast";
import { getCurrentUser } from "../utils/auth";
import { FiUsers, FiPlus, FiX, FiEdit2, FiSave, FiTrash2, FiRefreshCw, FiSearch } from "react-icons/fi";

function StudentManagement() {
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || "faculty";
  
  // Check if user has admin access
  const hasAdminAccess = userRole === "admin" || userRole === "superadmin";
  
  // Section options
  const sections = ["A", "B", "C", "D", "E", "F"];
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortField, setSortField] = useState("rollNo");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // PERFORMANCE: Pagination state  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 100; // Load 100 students at a time
  
  // PERFORMANCE: Debounce timer
  const searchDebounceRef = useRef(null);
  const searchRafRef = useRef(null);
  
  const [formData, setFormData] = useState({
    rollNo: "",
    name: "",
    year: "1",
    semester: "1",
    branch: "CSE",
    section: "A"
  });

  // PERFORMANCE: Define fetchAllStudents before useEffect to avoid "used before defined" error
  const fetchAllStudents = useCallback(async () => {
    setLoading(true);
    try {
      // PERFORMANCE: Fetch with pagination and search
      const params = {
        page: currentPage,
        limit: pageSize
      };
      
      // Add search query if exists
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const res = await API.get("/students/all", { params });
      setStudents(res.data.students || []);
      setTotalCount(res.data.totalCount || 0);
      setHasMore(res.data.hasMore || false);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]); // Add searchQuery dependency

  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]); // Refetch when fetchAllStudents changes (which includes searchQuery changes)

  useEffect(() => {
    return () => {
      if (searchRafRef.current) {
        cancelAnimationFrame(searchRafRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If year changes, auto-adjust semester to first semester of that year
    if (name === "year") {
      const year = parseInt(value);
      const firstSemester = (year - 1) * 2 + 1;
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        semester: firstSemester.toString() // Auto-set to first semester of selected year
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // PERFORMANCE: Debounced search handler (500ms delay)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear existing timers
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (searchRafRef.current) {
      cancelAnimationFrame(searchRafRef.current);
    }

    // Debounce search query update by 500ms
    searchDebounceRef.current = setTimeout(() => {
      searchRafRef.current = requestAnimationFrame(() => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to page 1 when search query changes
      });
    }, 500);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedStudents = useMemo(() => {
    // Client-side sorting only (filtering is now server-side)
    const sorted = [...students].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toUpperCase();
        bVal = bVal.toUpperCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [students, sortField, sortDirection]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!formData.rollNo.trim() || !formData.name.trim()) {
      toast.error("Roll number and name are required");
      return;
    }
    
    // Validate year and semester relationship
    const year = parseInt(formData.year);
    const semester = parseInt(formData.semester);
    
    // Year 1 = Sem 1-2, Year 2 = Sem 3-4, Year 3 = Sem 5-6, Year 4 = Sem 7-8
    const minSemester = (year - 1) * 2 + 1;
    const maxSemester = year * 2;
    
    if (semester < minSemester || semester > maxSemester) {
      toast.error(`Invalid semester for Year ${year}. Must be between ${minSemester} and ${maxSemester}.`);
      return;
    }

    setLoading(true);
    try {
      if (editingStudent) {
        await API.put(`/students/student/${editingStudent.rollNo}`, {
          rollNo: formData.rollNo.toUpperCase().trim(),
          name: formData.name.trim(),
          year: year,
          semester: semester,
          branch: formData.branch.toUpperCase(),
          section: formData.section.toUpperCase()
        });
        toast.success("Student updated successfully");
      } else {
        // Add new student WITHOUT marking late
        await API.post("/students/mark-late", {
          rollNo: formData.rollNo.toUpperCase().trim(),
          name: formData.name.trim(),
          year: year,
          semester: semester,
          branch: formData.branch.toUpperCase(),
          section: formData.section.toUpperCase(),
          isLate: false  // Important: Only register, don't mark late
        });
        toast.success("Student added successfully");
      }

      setShowAddForm(false);
      setEditingStudent(null);
      setFormData({
        rollNo: "",
        name: "",
        year: "1",
        semester: "1",
        branch: "CSE",
        section: "A"
      });
      fetchAllStudents();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || `Failed to ${editingStudent ? 'update' : 'add'} student`;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      rollNo: student.rollNo,
      name: student.name,
      year: student.year.toString(),
      semester: student.semester.toString(),
      branch: student.branch,
      section: student.section
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setShowAddForm(false);
    setFormData({
      rollNo: "",
      name: "",
      year: "1",
      semester: "1",
      branch: "CSE",
      section: "A"
    });
  };

  const handleDeleteStudent = async (rollNo) => {
    if (!window.confirm(`Delete student ${rollNo}? This cannot be undone.`)) {
      return;
    }

    try {
      await API.delete(`/students/student/${rollNo}`);
      toast.success("Student deleted successfully");
      fetchAllStudents();
    } catch (err) {
      toast.error("Failed to delete student");
    }
  };

  // Access control check
  if (!hasAdminAccess) {
    return (
      <div style={{ padding: "2rem", minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", marginTop: "10rem" }}>
          <div style={{
            background: "white",
            padding: "3rem",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
            <h2 style={{ color: "#667eea", marginBottom: "1rem" }}>Access Restricted</h2>
            <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              This page is only accessible to Admins and Super Admins.
            </p>
            <p style={{ color: "#999", fontSize: "0.9rem" }}>
              Your role: <strong>{userRole}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon">
          <FiUsers size={28} />
        </div>
        <div>
          <h1 className="page-title">Student Master Data</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "0.95rem" }}>
            Add, edit, and manage student master data
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ position: "relative", maxWidth: "500px" }}>
          <FiSearch 
            style={{ 
              position: "absolute", 
              left: "1rem", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: searchQuery ? "#007bff" : "#6c757d",
              fontSize: "1.2rem"
            }} 
          />
          <input
            type="text"
            placeholder="Search by roll number, name, branch, or section..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pro-input"
            style={{
              paddingLeft: "3rem",
              fontSize: "1rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderColor: searchQuery ? "#007bff" : "#dee2e6",
              borderWidth: searchQuery ? "2px" : "1px"
            }}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setCurrentPage(1); // Reset to page 1 when clearing search
              }}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6c757d",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                fontSize: "1.2rem"
              }}
              title="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>
        {searchQuery && (
          <div style={{
            marginTop: "0.5rem",
            fontSize: "0.85rem",
            color: "#007bff",
            fontWeight: "500"
          }}>
            🔍 Searching for: "{searchQuery}"
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => {
            if (showAddForm) {
              handleCancelEdit();
            } else {
              setShowAddForm(true);
            }
          }}
          className={showAddForm ? "pro-btn pro-btn-danger" : "pro-btn pro-btn-success"}
        >
          {showAddForm ? (
            <><FiX size={18} style={{ marginRight: "8px" }} /> Cancel</>
          ) : (
            <><FiPlus size={18} style={{ marginRight: "8px" }} /> Add Student</>
          )}
        </button>
        <button
          onClick={fetchAllStudents}
          disabled={loading}
          className="pro-btn pro-btn-primary"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <FiRefreshCw size={18} style={{ marginRight: "8px" }} /> Refresh
        </button>
        <div style={{ marginLeft: "auto", fontSize: "1.1rem", fontWeight: "600", color: "#495057" }}>
          {searchQuery ? (
            <>Found: {totalCount} student{totalCount !== 1 ? 's' : ''}</>
          ) : (
            <>Total: {totalCount} student{totalCount !== 1 ? 's' : ''}</>
          )}
        </div>
      </div>

      {/* Add/Edit Student Form */}
      {showAddForm && (
        <form onSubmit={handleAddStudent} className="pro-card" style={{
          padding: "2rem",
          marginBottom: "2rem",
          border: editingStudent ? "3px solid #007bff" : "1px solid #dee2e6",
          background: editingStudent ? "#f0f8ff" : "white"
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: editingStudent ? "#007bff" : "#495057", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem" 
          }}>
            {editingStudent ? (
              <><FiEdit2 size={20} /> Edit Student: {editingStudent.rollNo}</>
            ) : (
              <><FiPlus size={20} /> Add New Student</>
            )}
          </h3>
          {editingStudent && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "#cfe2ff",
              border: "1px solid #9ec5fe",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              color: "#084298"
            }}>
              <strong>Editing mode:</strong> You are modifying student record {editingStudent.rollNo}. Changes will update the existing record.
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Roll Number *
              </label>
              <input
                type="text"
                name="rollNo"
                value={formData.rollNo}
                onChange={handleInputChange}
                placeholder="e.g., A23126552137"
                required
                className="pro-input"
              />
              {editingStudent && formData.rollNo !== editingStudent.rollNo && (
                <small style={{ color: "#dc3545", fontSize: "0.8rem", display: "block", marginTop: "0.25rem" }}>
                  ⚠️ Changing roll number - make sure this is correct!
                </small>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Student Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                required
                className="pro-input"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="pro-select"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Semester
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="pro-select"
              >
                {(() => {
                  const year = parseInt(formData.year);
                  const minSem = (year - 1) * 2 + 1;
                  const maxSem = year * 2;
                  const validSemesters = [];
                  for (let s = minSem; s <= maxSem; s++) {
                    validSemesters.push(s);
                  }
                  return validSemesters.map(s => (
                    <option key={s} value={s}>Sem {s}</option>
                  ));
                })()}
              </select>
              <small style={{ color: "#6c757d", fontSize: "0.8rem", display: "block", marginTop: "0.25rem" }}>
                Year {formData.year}: Sem {(parseInt(formData.year) - 1) * 2 + 1}-{parseInt(formData.year) * 2}
              </small>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Branch
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="pro-select"
              >
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
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Section
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="pro-select"
              >
                {sections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              className={editingStudent ? "pro-btn pro-btn-primary" : "pro-btn pro-btn-success"}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                editingStudent ? "Updating..." : "Adding..."
              ) : (
                <>
                  <FiSave size={18} style={{ marginRight: "8px" }} />
                  {editingStudent ? "Update Student" : "Add Student"}
                </>
              )}
            </button>
            {editingStudent && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="pro-btn pro-btn-secondary"
              >
                <FiX size={18} style={{ marginRight: "8px" }} /> Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Students Table */}
      {loading && students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6c757d" }}>
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          background: "#f8f9fa",
          borderRadius: "12px",
          border: "2px dashed #dee2e6"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>
            <FiUsers size={64} color="#6c757d" />
          </div>
          <h3 style={{ color: "#495057", margin: "0 0 0.5rem 0" }}>No Students Yet</h3>
          <p style={{ color: "#6c757d", margin: 0 }}>
            Click "Add Student" to add your first student record
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="pro-table">
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "700", color: "#495057", cursor: "pointer" }} onClick={() => handleSort("rollNo")}>
                  Roll No {sortField === "rollNo" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: "700", color: "#495057", cursor: "pointer" }} onClick={() => handleSort("name")}>
                  Name {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057", cursor: "pointer" }} onClick={() => handleSort("year")}>
                  Year {sortField === "year" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057" }}>Sem</th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057", cursor: "pointer" }} onClick={() => handleSort("branch")}>
                  Branch {sortField === "branch" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057", cursor: "pointer" }} onClick={() => handleSort("section")}>
                  Section {sortField === "section" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057" }}>Late Days</th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057" }}>Fines</th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: "700", color: "#495057" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr key={student.rollNo} style={{
                  borderTop: "1px solid #dee2e6",
                  background: index % 2 === 0 ? "white" : "#f8f9fa"
                }}>
                  <td style={{ padding: "1rem", fontWeight: "600", color: "#495057" }}>{student.rollNo}</td>
                  <td style={{ padding: "1rem", color: "#495057" }}>{student.name}</td>
                  <td style={{ padding: "1rem", textAlign: "center", color: "#495057" }}>{student.year}</td>
                  <td style={{ padding: "1rem", textAlign: "center", color: "#495057" }}>{student.semester}</td>
                  <td style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: "#007bff" }}>{student.branch}</td>
                  <td style={{ padding: "1rem", textAlign: "center", color: "#495057" }}>{student.section}</td>
                  <td style={{ padding: "1rem", textAlign: "center", color: student.lateDays > 0 ? "#dc3545" : "#28a745" }}>
                    {student.lateDays}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center", fontWeight: "600", color: student.fines > 0 ? "#dc3545" : "#28a745" }}>
                    ₹{student.fines}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="pro-btn pro-btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      >
                        <FiEdit2 size={14} style={{ marginRight: "6px" }} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.rollNo)}
                        className="pro-btn pro-btn-danger"
                        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      >
                        <FiTrash2 size={14} style={{ marginRight: "6px" }} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* PERFORMANCE: Pagination Controls */}
          {students.length > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1.5rem 1rem",
              background: "#f8f9fa",
              borderRadius: "0 0 12px 12px",
              marginTop: "1rem",
              borderTop: "2px solid #dee2e6"
            }}>
              <div style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                Showing <strong>{students.length}</strong> of <strong>{totalCount}</strong> student{totalCount !== 1 ? 's' : ''}
                {searchQuery && <span> (search: "{searchQuery}")</span>}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="pro-btn pro-btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    opacity: (currentPage === 1 || loading) ? 0.5 : 1,
                    cursor: (currentPage === 1 || loading) ? "not-allowed" : "pointer"
                  }}
                >
                  Previous
                </button>
                
                <span style={{
                  padding: "8px 16px",
                  background: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  fontWeight: "600",
                  color: "#495057",
                  fontSize: "0.95rem"
                }}>
                  Page {currentPage}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasMore || loading}
                  className="pro-btn pro-btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    opacity: (!hasMore || loading) ? 0.5 : 1,
                    cursor: (!hasMore || loading) ? "not-allowed" : "pointer"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentManagement;
