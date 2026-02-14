import React, { useState, useEffect, useCallback } from "react";
import { FiEye, FiDownload, FiSearch, FiClipboard, FiLock, FiAlertCircle } from "react-icons/fi";
import API from "../services/api";
import "../styles/auditTrail.css";

function AuditTrail() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [expandedLog, setExpandedLog] = useState(null);
  
  const logsPerPage = 20;
  const skip = (currentPage - 1) * logsPerPage;

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams({
        limit: logsPerPage,
        skip: skip
      });
      
      if (searchQuery.trim()) {
        params.append('rollNo', searchQuery.trim());
      }
      
      const res = await API.get(`/students/audit-logs/removal-history?${params.toString()}`);
      
      setAuditLogs(res.data.logs || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load audit trail. " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [skip, searchQuery]);

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await API.get('/students/audit-logs/statistics');
      setStatistics(res.data.stats || []);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  }, []);

  // Fetch audit logs on mount and when page changes
  useEffect(() => {
    fetchAuditLogs();
    fetchStatistics();
  }, [fetchAuditLogs, fetchStatistics]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const calculateFineChange = (changes) => {
    if (!changes || !changes.fines) return 0;
    return changes.fines.from - changes.fines.to;
  };

  const totalPages = Math.ceil(totalCount / logsPerPage);

  const downloadAsPDF = async () => {
    try {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('rollNo', searchQuery.trim());
      }
      
      // Limit to 100 records for PDF to prevent huge files
      params.append('limit', '100');
      
      const res = await API.get(`/students/audit-logs/export-pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to generate PDF: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="audit-trail-container">
      <div className="audit-header">
        <h2><FiClipboard style={{ display: 'inline', marginRight: '8px' }} /> Removal Audit Trail</h2>
        <p className="audit-subtitle">Complete immutable record of all late record removals | Non-editable system report</p>
      </div>

      {/* Statistics Section */}
      <div className="audit-stats-toggle">
        <button 
          className="stats-toggle-btn"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? "Hide Summary" : "Show Summary"}
        </button>
        {showStats && statistics && statistics.length > 0 && (
          <div className="audit-statistics">
            <h3>Removal Summary by Admin</h3>
            <div className="stats-grid">
              {statistics.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <div className="stat-name">{stat._id || "Unknown"}</div>
                  <div className="stat-metric">
                    <span className="stat-label">Total Removals:</span>{" "}
                    <span className="stat-value">{stat.totalRemovals}</span>
                  </div>
                  <div className="stat-metric">
                    <span className="stat-label">Records Removed:</span>{" "}
                    <span className="stat-value">{stat.totalRecordsRemoved}</span>
                  </div>
                  <div className="stat-metric">
                    <span className="stat-label">Fines Impact:</span>{" "}
                    <span className="stat-value positive">₹{stat.totalFinesRefunded || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Section */}
      <div className="audit-search-section">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by student roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="btn-search">Search</button>
          {searchQuery && (
            <button onClick={handleClearSearch} className="btn-clear">Clear</button>
          )}
        </div>
        <button onClick={downloadAsPDF} className="btn-download">
          <FiDownload /> Export PDF
        </button>
      </div>

      {/* Status Messages */}
      {error && <div className="audit-error">{error}</div>}

      {loading && (
        <div className="audit-loading">
          <div className="spinner"></div>
          <p>Loading audit records...</p>
        </div>
      )}

      {!loading && auditLogs.length === 0 && !error && (
        <div className="audit-empty">
          <p>No removal records found.</p>
        </div>
      )}

      {/* Audit Logs Table */}
      {!loading && auditLogs.length > 0 && (
        <div className="audit-logs-section">
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Removed By</th>
                  <th>Records</th>
                  <th>Fine Impact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => {
                  const isExpanded = expandedLog === log._id;
                  const fineChange = calculateFineChange(log.details?.changes);
                  
                  return (
                    <React.Fragment key={log._id || idx}>
                      <tr className={`audit-row ${isExpanded ? 'expanded' : ''}`}>
                        <td className="timestamp">{formatDate(log.timestamp)}</td>
                        <td className="student-name">{log.targetStudent?.name || "N/A"}</td>
                        <td className="roll-no">{log.targetStudent?.rollNo || "N/A"}</td>
                        <td className="performed-by">{log.performedBy?.facultyName || "Unknown"}</td>
                        <td className="records-count">
                          <span className="badge">{log.details?.recordsRemoved || 0}</span>
                        </td>
                        <td className="fine-impact">
                          {fineChange > 0 ? (
                            <span className="fine-positive">₹{fineChange}</span>
                          ) : (
                            <span className="fine-neutral">-</span>
                          )}
                        </td>
                        <td className="status">
                          <span className="badge-success">Completed</span>
                        </td>
                        <td className="action-col">
                          <button
                            className="btn-details"
                            onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                            title="View details"
                          >
                            <FiEye size={16} />
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="details-row">
                          <td colSpan="8">
                            <div className="details-panel">
                              <div className="details-header">
                                <h4><FiAlertCircle style={{ display: 'inline', marginRight: '6px' }} /> Removal Details</h4>
                                <p className="read-only-badge"><FiLock style={{ display: 'inline', marginRight: '6px' }} /> READ-ONLY | Non-editable Record</p>
                              </div>
                              
                              <div className="details-grid">
                                <div className="detail-section">
                                  <h5>Removal Information</h5>
                                  <div className="detail-item">
                                    <span className="label">Performed By:</span>
                                    <span className="value">{log.performedBy?.facultyName}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Email:</span>
                                    <span className="value">{log.performedBy?.facultyEmail}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Role:</span>
                                    <span className="value">{log.performedBy?.actorRole || "Faculty"}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Date & Time:</span>
                                    <span className="value">{formatDate(log.timestamp)}</span>
                                  </div>
                                </div>

                                <div className="detail-section">
                                  <h5>Student Information</h5>
                                  <div className="detail-item">
                                    <span className="label">Name:</span>
                                    <span className="value">{log.targetStudent?.name}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Roll No:</span>
                                    <span className="value">{log.targetStudent?.rollNo}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Branch:</span>
                                    <span className="value">{log.targetStudent?.branch || "N/A"}</span>
                                  </div>
                                </div>

                                <div className="detail-section">
                                  <h5>Record Changes</h5>
                                  <div className="detail-item">
                                    <span className="label">Records Removed:</span>
                                    <span className="value">{log.details?.recordsRemoved}</span>
                                  </div>
                                  {log.details?.removedDates && (
                                    <div className="detail-item">
                                      <span className="label">Dates Removed:</span>
                                      <div className="dates-list">
                                        {log.details.removedDates.map((date, i) => (
                                          <span key={i} className="date-tag">{date}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="detail-section">
                                  <h5>Impact Summary</h5>
                                  <div className="detail-item">
                                    <span className="label">Late Days:</span>
                                    <span className="value">
                                      {log.details?.changes?.lateDays?.from} → {log.details?.changes?.lateDays?.to}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Fines:</span>
                                    <span className="value">
                                      ₹{log.details?.changes?.fines?.from} → ₹{log.details?.changes?.fines?.to}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Status:</span>
                                    <span className="value">
                                      {log.details?.changes?.status?.from} → {log.details?.changes?.status?.to}
                                    </span>
                                  </div>
                                </div>

                                <div className="detail-section">
                                  <h5>Reason for Removal</h5>
                                  <div className="reason-box">
                                    {log.reason || "No reason provided"}
                                  </div>
                                </div>

                                <div className="detail-section">
                                  <h5>System Information</h5>
                                  <div className="detail-item">
                                    <span className="label">IP Address:</span>
                                    <span className="value">{log.ipAddress || "N/A"}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="label">Record ID:</span>
                                    <span className="value mono">{log._id}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="audit-pagination">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-paging"
              >
                ← Previous
              </button>
              <div className="page-info">
                Page {currentPage} of {totalPages} ({totalCount} total records)
              </div>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-paging"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
