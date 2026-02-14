import React, { useState } from 'react';
import { FiUser, FiClock, FiDollarSign, FiCalendar, FiDownload, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import API from '../services/api';
import { toast } from './Toast';

function StudentPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rollNo, setRollNo] = useState('');
  const [logging, setLogging] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [lateRecords, setLateRecords] = useState([]);

  // Handle student login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!rollNo.trim()) {
      toast.error("Please enter your roll number");
      return;
    }

    setLogging(true);
    try {
      const response = await API.post("/auth/student-login", {
        rollNo: rollNo.trim().toUpperCase()
      });

      // Store student token
      localStorage.setItem('student_token', response.data.token);
      localStorage.setItem('student_rollNo', response.data.student.rollNo);

      setStudentData(response.data.student);
      setIsLoggedIn(true);
      toast.success(`Welcome, ${response.data.student.name}!`);

      // Fetch detailed student data
      await fetchStudentDetails(response.data.student.rollNo);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLogging(false);
    }
  };

  // Fetch student details including late records
  const fetchStudentDetails = async (studentRollNo) => {
    try {
      const response = await API.get(`/students/student/${studentRollNo}`);
      setLateRecords(response.data.student.lateRecords || []);
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("Failed to load late records");
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_rollNo');
    setIsLoggedIn(false);
    setStudentData(null);
    setLateRecords([]);
    setRollNo('');
    toast.info("Logged out successfully");
  };

  // Download late statement as text
  const downloadStatement = () => {
    if (!studentData) return;

    const content = `
ANITS STUDENT LATE STATEMENT
========================================

Student Details:
----------------
Roll Number: ${studentData.rollNo}
Name: ${studentData.name}
Year: ${studentData.year}, Semester: ${studentData.semester}
Branch: ${studentData.branch}, Section: ${studentData.section}

Late Summary:
-------------
Total Late Days: ${studentData.lateDays}
Total Fines: Rs. ${studentData.fines}
Fine per Late: Rs. 50

Late Records:
-------------
${lateRecords.length === 0 ? 'No late records found.' : ''}
${lateRecords.map((record, index) => `
${index + 1}. Date: ${new Date(record.date).toLocaleDateString('en-IN')}
   Time: ${new Date(record.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
   Reason: ${record.reason || 'Not specified'}
   Marked By: ${record.markedBy || 'Faculty'}
`).join('\n')}

========================================
Generated on: ${new Date().toLocaleString('en-IN')}

Note: This is an official record. For fine payment,
please contact the administration office.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Late_Statement_${studentData.rollNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Statement downloaded successfully!");
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'white',
          padding: '3rem 2.5rem',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'scaleIn 0.4s ease-out'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
            }}>
              <FiUser size={40} color="white" />
            </div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              Student Portal
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
              View your late records and fine details
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                Roll Number
              </label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g., 22B91A05A1"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  transition: 'all 0.3s'
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={logging}
              style={{
                padding: '14px 20px',
                background: logging ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: logging ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
                transition: 'all 0.3s'
              }}
            >
              {logging ? 'Logging in...' : 'View My Records'}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f1f5f9',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: '#475569',
            textAlign: 'center'
          }}>
            <FiAlertCircle style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Enter your roll number to access your late records. No password required.
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen (After Login)
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {studentData.name}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0 }}>
            {studentData.rollNo} • Year {studentData.year} • {studentData.branch} - {studentData.section}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          <FiLogOut /> Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '1.5rem',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <FiClock size={24} />
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Late Days</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{studentData.lateDays}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '2px solid #fbbf24',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <FiDollarSign size={24} color="#f59e0b" />
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Fines</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>
            Rs. {studentData.fines}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Rs. 50 per late
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '2px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
            <FiCalendar size={24} color="#10b981" />
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Late Records</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
            {lateRecords.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Total entries
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={downloadStatement}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          <FiDownload /> Download Statement
        </button>
      </div>

      {/* Late Records Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          color: '#1e293b'
        }}>
          Late Records History
        </h3>

        {lateRecords.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#94a3b8',
            fontSize: '0.95rem'
          }}>
            <FiClock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No late records found. Keep up the good work!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Time</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reason</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {lateRecords.map((record, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>
                      {new Date(record.date).toLocaleDateString('en-IN', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {new Date(record.date).toLocaleTimeString('en-IN', { 
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {record.reason || 'Not specified'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {record.markedBy || 'Faculty'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#fef3c7',
        borderRadius: '12px',
        border: '2px solid #fbbf24',
        fontSize: '0.9rem',
        color: '#92400e'
      }}>
        <strong>Important:</strong> For fine payment or to report discrepancies, please contact the administration office with your roll number and this statement.
      </div>
    </div>
  );
}

export default StudentPortal;
