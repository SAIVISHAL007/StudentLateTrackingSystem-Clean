import { useState } from 'react';
import { FiSearch, FiX, FiCalendar, FiDollarSign, FiUser, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiFileText, FiCheck } from 'react-icons/fi';
import API from '../services/api';
import { toast } from './Toast';

function StudentProfile() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'week', 'month', 'custom', 'all'
  const [selectedDate, setSelectedDate] = useState(''); // For custom date picker

  // Search students by name or roll number
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await API.get(`/students/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data.students || []);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed. Try entering at least 2 characters.');
      setSearchResults([]);
    }
  };

  // Fetch full student details
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
    
    try {
      const res = await API.get(`/students/student/${student.rollNo}`);
      setStudentDetails(res.data);
    } catch (err) {
      console.error('Error fetching student details:', err);
      toast.error('Failed to fetch student details');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#10b981'; // green
      case 'approaching_limit': return '#f59e0b'; // amber
      case 'fined': return '#ef4444'; // red
      case 'excused': return '#3b82f6'; // blue
      default: return '#6366f1';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'normal': 'Normal',
      'approaching_limit': 'Approaching Limit',
      'fined': 'Fined',
      'excused': 'Excused',
      'alert': 'Alert',
      'graduated': 'Graduated'
    };
    return labels[status] || status;
  };

  // Filter late logs based on date range
  const getFilteredLogs = () => {
    if (!studentDetails || !studentDetails.lateLogs) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return studentDetails.lateLogs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case 'today':
          return logDate.getTime() === today.getTime();
        
        case 'week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return logDate >= weekAgo && logDate <= today;
        }
        
        case 'month': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return logDate >= monthAgo && logDate <= today;
        }
        
        case 'custom': {
          if (!selectedDate) return false;
          const customDate = new Date(selectedDate);
          customDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === customDate.getTime();
        }
        
        default: // 'all'
          return true;
      }
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <FiUser size={32} style={{ color: '#667eea' }} />
        <div>
          <h2 style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem', fontWeight: 800, margin: 0 }}>
            Student Profile Search
          </h2>
          <p style={{ fontSize: '.85rem', color: '#64748b', fontWeight: 500, margin: '4px 0 0 0' }}>
            Search for a student and view their complete attendance history
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '0 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <FiSearch size={20} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by roll number or name... (e.g., A23126552001 or Adari Maheswari)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              padding: '12px 16px',
              fontSize: '0.95rem',
              outline: 'none',
              background: 'transparent'
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '2px solid #e2e8f0',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {searchResults.map((student, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectStudent(student)}
                style={{
                  padding: '12px 16px',
                  borderBottom: idx < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{student.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {student.rollNo} • {student.branch} • Year {student.year} • Section {student.section}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Details */}
      {selectedStudent && studentDetails && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Header Card */}
          <div style={{
            background: 'linear-gradient(135deg,#667eea,#764ba2)',
            color: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(102,126,234,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 800 }}>
                  {studentDetails.name}
                </h3>
                <p style={{ margin: '0', fontSize: '0.95rem', opacity: 0.9 }}>
                  {studentDetails.rollNo}
                </p>
              </div>
              <button
                onClick={() => { setSelectedStudent(null); setStudentDetails(null); }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <p style={{ margin: '0', opacity: 0.8, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Year</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{studentDetails.year}</p>
              </div>
              <div>
                <p style={{ margin: '0', opacity: 0.8, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Semester</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{studentDetails.semester || '-'}</p>
              </div>
              <div>
                <p style={{ margin: '0', opacity: 0.8, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Branch</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{studentDetails.branch}</p>
              </div>
              <div>
                <p style={{ margin: '0', opacity: 0.8, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Section</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{studentDetails.section}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <FiClock size={24} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                {studentDetails.lateDays}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                Total Late Days
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <FiDollarSign size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{studentDetails.fines}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                Total Fines
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <FiUser size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                {studentDetails.excuseDaysUsed || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                Excuse Days Used
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: `2px solid ${getStatusColor(studentDetails.status)}`,
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <FiUser size={24} style={{ color: getStatusColor(studentDetails.status) }} />
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getStatusColor(studentDetails.status), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {studentDetails.status === 'normal' && <FiCheckCircle size={20} />}
                {studentDetails.status === 'approaching_limit' && <FiAlertCircle size={20} />}
                {studentDetails.status === 'fined' && <FiXCircle size={20} />}
                {studentDetails.status === 'excused' && <FiFileText size={20} />}
                {studentDetails.status === 'alert' && <FiAlertCircle size={20} />}
                {studentDetails.status === 'graduated' && <FiCheckCircle size={20} />}
                {getStatusLabel(studentDetails.status)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                Current Status
              </div>
            </div>
          </div>

          {/* Late Dates Timeline */}
          {studentDetails.lateLogs && studentDetails.lateLogs.length > 0 && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCalendar size={20} />
                Late Attendance History ({getFilteredLogs().length} instances)
              </h3>

              {/* Date Filter Controls */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={() => { setDateFilter('all'); setSelectedDate(''); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: dateFilter === 'all' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: dateFilter === 'all' ? '#667eea' : 'white',
                    color: dateFilter === 'all' ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => { setDateFilter('today'); setSelectedDate(''); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: dateFilter === 'today' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: dateFilter === 'today' ? '#667eea' : 'white',
                    color: dateFilter === 'today' ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => { setDateFilter('week'); setSelectedDate(''); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: dateFilter === 'week' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: dateFilter === 'week' ? '#667eea' : 'white',
                    color: dateFilter === 'week' ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  This Week
                </button>
                <button
                  onClick={() => { setDateFilter('month'); setSelectedDate(''); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: dateFilter === 'month' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: dateFilter === 'month' ? '#667eea' : 'white',
                    color: dateFilter === 'month' ? 'white' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  This Month
                </button>

                {/* Custom Date Picker */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: dateFilter === 'custom' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Display Count Message */}
              {dateFilter !== 'all' && (
                <div style={{ marginBottom: '1rem', padding: '12px', background: '#f0f4ff', borderRadius: '8px', fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FiCalendar size={18} />
                  <span>Showing {getFilteredLogs().length} late instance(s) 
                  {dateFilter === 'today' && ' for today'}
                  {dateFilter === 'week' && ' from this week'}
                  {dateFilter === 'month' && ' from this month'}
                  {dateFilter === 'custom' && selectedDate && ` for ${new Date(selectedDate).toLocaleDateString('en-IN')}`}
                  </span>
                </div>
              )}

              {getFilteredLogs().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                <FiCheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No late records found for the selected period.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {getFilteredLogs().map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        borderLeft: `4px solid #ef4444`
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        background: '#fee2e2',
                        borderRadius: '50%',
                        fontWeight: 700,
                        color: '#dc2626',
                        flexShrink: 0
                      }}>
                        #{idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                          Late Instance #{idx + 1}
                        </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiClock size={16} />
                        {new Date(log.date).toLocaleString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fine History */}
          {studentDetails.fineHistory && studentDetails.fineHistory.length > 0 && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiDollarSign size={20} />
                Fine Breakdown ({studentDetails.fineHistory.length} entries)
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reason</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDetails.fineHistory.map((fine, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 16px', color: '#0f172a' }}>
                          {new Date(fine.date).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {fine.reason || 'Late marking'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                          ₹{fine.amount}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: fine.paid ? '#dcfce7' : '#fee2e2',
                            color: fine.paid ? '#166534' : '#dc2626'
                          }}>
                            {fine.paid ? <FiCheck size={14} /> : <FiXCircle size={14} />}
                            {fine.paid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No History Message */}
          {(!studentDetails.lateLogs || studentDetails.lateLogs.length === 0) && (
            <div style={{
              background: '#dcfce7',
              border: '2px solid #86efac',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#166534'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <FiCheckCircle size={24} /> No late records found!
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
                This student has perfect attendance.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedStudent && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
          border: '2px dashed #667eea',
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#475569'
        }}>
          <FiSearch size={48} style={{ color: '#667eea', marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>
            Search for a student to view their complete attendance and fine history
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentProfile;
