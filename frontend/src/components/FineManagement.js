import React, { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiCheck, FiSearch, FiDownload } from 'react-icons/fi';
import API from '../services/api';
import { toast } from './Toast';

function FineManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'paid'
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalFines: 0,
    pendingFines: 0,
    paidFines: 0,
    totalStudentsWithFines: 0
  });

  const calculateStats = (studentList) => {
    const totalFines = studentList.reduce((sum, s) => sum + (s.fines || 0), 0);
    const pendingFines = studentList.reduce((sum, s) => sum + (s.finesPending || s.fines || 0), 0);
    const paidFines = studentList.reduce((sum, s) => sum + (s.finesPaid || 0), 0);

    setStats({
      totalFines,
      pendingFines,
      paidFines,
      totalStudentsWithFines: studentList.length
    });
  };

  const fetchStudentsWithFines = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/students/with-fines');
      setStudents(response.data.students || []);
      calculateStats(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students with fines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentsWithFines();
  }, [fetchStudentsWithFines]);

  const markFineAsPaid = async (rollNo, amount) => {
    if (!window.confirm(`Mark Rs. ${amount} as paid for ${rollNo}?`)) {
      return;
    }

    setProcessing(true);
    try {
      await API.post('/students/pay-fine', {
        rollNo,
        amount,
        paymentMethod: 'cash', // Default to cash for manual entry
        paymentDate: new Date().toISOString()
      });

      toast.success('Fine marked as paid!');
      await fetchStudentsWithFines(); // Refresh list
    } catch (error) {
      console.error('Error marking fine as paid:', error);
      toast.error(error.response?.data?.error || 'Failed to update fine status');
    } finally {
      setProcessing(false);
    }
  };

  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = !searchQuery.trim() || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && (student.finesPending || student.fines) > 0) ||
      (filter === 'paid' && (student.finesPaid || 0) > 0);

    return matchesSearch && matchesFilter;
  });

  const downloadFineReport = () => {
    const report = `ANITS FINE COLLECTION REPORT
========================================
Generated: ${new Date().toLocaleString('en-IN')}

STATISTICS:
-----------
Total Students with Fines: ${stats.totalStudentsWithFines}
Total Fines Amount: Rs. ${stats.totalFines}
Pending Collection: Rs. ${stats.pendingFines}
Collected Amount: Rs. ${stats.paidFines}

DETAILED BREAKDOWN:
-------------------
${filteredStudents.map((student, idx) => `
${idx + 1}. ${student.rollNo} - ${student.name}
   Year: ${student.year}, Branch: ${student.branch}, Section: ${student.section}
   Late Days: ${student.lateDays}
   Total Fines: Rs. ${student.fines || 0}
   Pending: Rs. ${student.finesPending || student.fines || 0}
   Paid: Rs. ${student.finesPaid || 0}
`).join('\n')}

========================================
Note: This is an official record for administrative purposes.
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fine_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Report downloaded successfully!');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Loading fine records...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          Fine Management
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Track and manage student fine payments
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '1.5rem',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Fines</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>Rs. {stats.totalFines}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '2px solid #fbbf24',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Pending Collection</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>Rs. {stats.pendingFines}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '2px solid #86efac',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Collected</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>Rs. {stats.paidFines}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '2px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Students</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#475569' }}>{stats.totalStudentsWithFines}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or roll number..."
            style={{
              width: '100%',
              padding: '12px 12px 12px 42px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value="all">All Students</option>
          <option value="pending">Pending Fines</option>
          <option value="paid">Paid Fines</option>
        </select>

        <button
          onClick={downloadFineReport}
          style={{
            padding: '12px 20px',
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
          <FiDownload /> Download Report
        </button>
      </div>

      {/* Student List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden'
      }}>
        {filteredStudents.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <FiDollarSign size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No students found with the current filters.</p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Roll No</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Year</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Branch</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Late Days</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Total Fines</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Pending</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const pendingAmount = student.finesPending || student.fines || 0;
                const hasPending = pendingAmount > 0;

                return (
                  <tr
                    key={student.rollNo}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b' }}>{student.rollNo}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>{student.name}</td>
                    <td style={{ padding: '16px', color: '#64748b' }}>Year {student.year}</td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{student.branch} - {student.section}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>{student.lateDays}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                      Rs. {student.fines || 0}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: hasPending ? '#dc2626' : '#10b981' }}>
                      Rs. {pendingAmount}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {hasPending ? (
                        <button
                          onClick={() => markFineAsPaid(student.rollNo, pendingAmount)}
                          disabled={processing}
                          style={{
                            padding: '8px 16px',
                            background: processing ? '#94a3b8' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: processing ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FiCheck size={14} /> Mark Paid
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                          <FiCheck style={{ display: 'inline', marginRight: '4px' }} />
                          Paid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
        <strong>Note:</strong> Fine status is tracked manually. When a student pays in person, click "Mark Paid" to update the record. All transactions are logged for audit purposes.
      </div>
    </div>
  );
}

export default FineManagement;
