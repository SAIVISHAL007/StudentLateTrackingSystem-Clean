import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "./Toast";
import { getCurrentUser } from "../utils/auth";
import { FiUsers, FiPlus, FiX, FiEdit2, FiSave, FiTrash2, FiRefreshCw } from "react-icons/fi";

function StudentManagement() {
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role || "faculty";
  
  // Check if user has admin access
  const hasAdminAccess = userRole === "admin" || userRole === "superadmin";
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortField, setSortField] = useState("rollNo");
  const [sortDirection, setSortDirection] = useState("asc");
  const [formData, setFormData] = useState({
    rollNo: "",
    name: "",
    year: "1",
    semester: "1",
    branch: "CSE",
    section: "A"
  });

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/students/all");
      console.log("Fetched students:", res.data);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedStudents = () => {
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
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!formData.rollNo.trim() || !formData.name.trim()) {
      toast.error("Roll number and name are required");
      return;
    }

    setLoading(true);
    try {
      if (editingStudent) {
        await API.put(`/students/student/${editingStudent.rollNo}`, {
          rollNo: formData.rollNo.toUpperCase().trim(),
          name: formData.name.trim(),
          year: parseInt(formData.year),
          semester: parseInt(formData.semester),
          branch: formData.branch.toUpperCase(),
          section: formData.section.toUpperCase()
        });
        toast.success("Student updated successfully");
      } else {
        await API.post("/students/mark-late", {
          rollNo: formData.rollNo.toUpperCase().trim(),
          name: formData.name.trim(),
          year: parseInt(formData.year),
          semester: parseInt(formData.semester),
          branch: formData.branch.toUpperCase(),
          section: formData.section.toUpperCase(),
          date: new Date().toISOString().split("T")[0],
          isLate: false
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
      toast.error(err.response?.data?.error || `Failed to ${editingStudent ? 'update' : 'add'} student`);
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
          Total: {students.length} students
        </div>
      </div>

      {/* Add/Edit Student Form */}
      {showAddForm && (
        <form onSubmit={handleAddStudent} className="pro-card" style={{
          padding: "2rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{ marginTop: 0, color: "#495057", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {editingStudent ? (
              <><FiEdit2 size={20} /> Edit Student</>
            ) : (
              <><FiPlus size={20} /> Add New Student</>
            )}
          </h3>
          
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
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
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
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                placeholder="A"
                maxLength="2"
                className="pro-input"
              />
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
              {getSortedStudents().map((student, index) => (
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
        </div>
      )}
    </div>
  );
}

export default StudentManagement;
