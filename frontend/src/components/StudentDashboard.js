import { useState, useEffect, useMemo, useRef } from 'react';
import { FiSearch, FiArrowUp, FiArrowDown, FiClock, FiCalendar, FiX } from 'react-icons/fi';
import API from '../services/api';

function StudentDashboard({ onClose }) {
  const [lateStudents, setLateStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('time'); // 'time', 'name', 'rollNo', 'year'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  
  // PERFORMANCE: Debounce timer
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchLateStudentsToday();
  }, []);
  
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);
  
  // PERFORMANCE: Debounced search handler (400ms delay for dashboard)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  };

  const fetchLateStudentsToday = async () => {
    try {
      setLoading(true);
      const response = await API.get('/students/late-today');
      setLateStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching late students:', error);
      setLateStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'time' ? 'desc' : 'asc');
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = lateStudents.filter(student => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        student.name.toLowerCase().includes(query) ||
        student.rollNo.toLowerCase().includes(query) ||
        student.branch.toLowerCase().includes(query)
      );
    });

    // Sort students
    filtered.sort((a, b) => {
      let compareA, compareB;
      
      switch (sortBy) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'rollNo':
          compareA = a.rollNo.toLowerCase();
          compareB = b.rollNo.toLowerCase();
          break;
        case 'year':
          compareA = a.year;
          compareB = b.year;
          break;
        case 'time':
        default:
          // Get the latest late log time for each student
          const aLatestLog = a.lateLogs && a.lateLogs.length > 0 
            ? new Date(a.lateLogs[a.lateLogs.length - 1].date).getTime() 
            : 0;
          const bLatestLog = b.lateLogs && b.lateLogs.length > 0 
            ? new Date(b.lateLogs[b.lateLogs.length - 1].date).getTime() 
            : 0;
          compareA = aLatestLog;
          compareB = bLatestLog;
          break;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [lateStudents, searchQuery, sortBy, sortOrder]);

  const getLatestLateTime = (student) => {
    if (!student.lateLogs || student.lateLogs.length === 0) return 'N/A';
    const latestLog = student.lateLogs[student.lateLogs.length - 1];
    return new Date(latestLog.date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      style={{
        background: sortBy === field ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
        color: sortBy === field ? 'white' : '#374151',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '0.875rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s'
      }}
    >
      {label}
      {sortBy === field && (
        sortOrder === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />
      )}
    </button>
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
              Students Late Today
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>
              <FiCalendar size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Controls */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '2px solid #f3f4f6',
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          gap: '1rem',
          alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: window.innerWidth <= 768 ? '100%' : '400px' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type="text"
                placeholder="Search by name, roll number, or branch..."
                value={searchInput}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Sort Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap'
          }}>
            <SortButton field="time" label="Time" />
            <SortButton field="name" label="Name" />
            <SortButton field="rollNo" label="Roll No" />
            <SortButton field="year" label="Year" />
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 2rem'
        }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#6b7280' 
            }}>
              <FiClock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading students...</p>
            </div>
          ) : filteredAndSortedStudents.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#6b7280' 
            }}>
              <FiClock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {searchQuery ? 'No students found' : 'No students marked late today'}
              </p>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                {searchQuery ? 'Try a different search term' : 'All students are on time!'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.9rem', 
                  fontWeight: 600 
                }}>
                  Total: {filteredAndSortedStudents.length} student{filteredAndSortedStudents.length !== 1 ? 's' : ''}
                  {searchQuery && ` (filtered)`}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 768 
                  ? '1fr' 
                  : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {filteredAndSortedStudents.map(student => (
                  <div
                    key={student._id}
                    style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '2px solid #bae6fd',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(14, 165, 233, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '1.1rem', 
                          fontWeight: 700, 
                          color: '#0c4a6e' 
                        }}>
                          {student.rollNo}
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0 0 0', 
                          fontSize: '1rem', 
                          fontWeight: 600, 
                          color: '#0369a1' 
                        }}>
                          {student.name}
                        </p>
                      </div>
                      <div style={{
                        background: '#0c4a6e',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        Year {student.year}
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #bae6fd'
                    }}>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.75rem', 
                          color: '#64748b', 
                          fontWeight: 600 
                        }}>
                          Branch
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0 0 0', 
                          fontSize: '0.85rem', 
                          color: '#1e40af', 
                          fontWeight: 600 
                        }}>
                          {student.branch}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.75rem', 
                          color: '#64748b', 
                          fontWeight: 600 
                        }}>
                          Section
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0 0 0', 
                          fontSize: '0.85rem', 
                          color: '#1e40af', 
                          fontWeight: 600 
                        }}>
                          {student.section}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: 'rgba(14, 165, 233, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FiClock size={14} color="#0369a1" />
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#0369a1', 
                        fontWeight: 600 
                      }}>
                        Marked at: {getLatestLateTime(student)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
