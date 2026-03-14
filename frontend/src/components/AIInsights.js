import React, { useState, useEffect } from 'react';
import { 
 FiTrendingUp, FiAlertTriangle, FiTarget, FiBarChart2, 
 FiActivity, FiRefreshCw, FiInfo, FiCheckCircle 
} from 'react-icons/fi';
import api from '../services/api';
import { toast } from './Toast';
import { useMediaQuery } from '../hooks/useMediaQuery';

const AIInsights = () => {
 const [loading, setLoading] = useState(true);
 const [insights, setInsights] = useState(null);
 const [activeTab, setActiveTab] = useState('predictions');
 const isMobile = useMediaQuery('(max-width: 768px)');

 const fetchInsights = async () => {
 try {
 setLoading(true);
 const response = await api.get('/ai/insights');
 setInsights(response.data.data);
 toast.success('AI insights generated successfully');
 } catch (error) {
 console.error('Error fetching AI insights:', error);
 toast.error('Failed to load AI insights');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchInsights();
 }, []);

 if (loading) {
 return (
 <div className="page-container">
 <div style={{ textAlign: 'center', padding: '4rem' }}>
 <div className="spinner" style={{
 width: '50px',
 height: '50px',
 border: '4px solid #e2e8f0',
 borderRightColor: '#f97316',
 borderRadius: '50%',
 animation: 'spin 1s linear infinite',
 margin: '0 auto'
 }}></div>
 <p style={{ marginTop: '1rem', color: '#64748b' }}>
 Analyzing student data with AI...
 </p>
 </div>
 </div>
 );
 }

 if (!insights) {
 return (
 <div className="page-container">
 <div style={{ textAlign: 'center', padding: '4rem' }}>
 <FiAlertTriangle size={48} color="#f59e0b" />
 <h3 style={{ marginTop: '1rem' }}>No insights available</h3>
 <button className="pro-btn pro-btn-primary" onClick={fetchInsights} style={{ marginTop: '1rem' }}>
 <FiRefreshCw /> Try Again
 </button>
 </div>
 </div>
 );
 }

 const { predictions, patterns, early_warnings, summary } = insights;

 const getRiskColor = (category) => {
 switch (category) {
 case 'HIGH': return '#dc2626';
 case 'MEDIUM': return '#f59e0b';
 case 'LOW': return '#10b981';
 default: return '#64748b';
 }
 };

 const getRiskBadgeStyle = (category) => ({
 padding: isMobile ? '0.4rem 0.7rem' : '0.5rem 1rem',
 borderRadius: '8px',
 fontSize: isMobile ? '0.78rem' : '0.875rem',
 fontWeight: '700',
 color: 'white',
 backgroundColor: getRiskColor(category),
 display: 'inline-block',
 whiteSpace: 'nowrap'
 });

 return (
 <div className="page-container">
 {/* Header */}
 <div className="page-header">
 <div className="page-header-icon">
 <FiActivity />
 </div>
 <div>
 <h1 className="page-title">AI Insights</h1>
 <p style={{ color: '#64748b', margin: 0 }}>
 Machine learning-powered predictions and pattern analysis
 </p>
 </div>
 <button 
 className="pro-btn pro-btn-primary" 
 onClick={fetchInsights}
 style={{ marginLeft: 'auto' }}
 >
 <FiRefreshCw /> Refresh
 </button>
 </div>

 {/* Summary Cards */}
 <div style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
 gap: '1.5rem',
 marginBottom: '2rem'
 }}>
 <div style={{
 background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
 padding: '1.5rem',
 borderRadius: '16px',
 color: 'white'
 }}>
 <FiAlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
 <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>
 {summary.high_risk_count}
 </h3>
 <p style={{ margin: 0, opacity: 0.9 }}>High Risk</p>
 </div>

 <div style={{
 background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
 padding: '1.5rem',
 borderRadius: '16px',
 color: 'white'
 }}>
 <FiTrendingUp size={32} style={{ marginBottom: '0.5rem' }} />
 <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>
 {summary.medium_risk_count}
 </h3>
 <p style={{ margin: 0, opacity: 0.9 }}>Medium Risk</p>
 </div>

 <div style={{
 background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
 padding: '1.5rem',
 borderRadius: '16px',
 color: 'white'
 }}>
 <FiCheckCircle size={32} style={{ marginBottom: '0.5rem' }} />
 <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>
 {summary.low_risk_count}
 </h3>
 <p style={{ margin: 0, opacity: 0.9 }}>Low Risk</p>
 </div>

 <div style={{
 background: 'linear-gradient(135deg, #f97316 0%, #0d9488 100%)',
 padding: '1.5rem',
 borderRadius: '16px',
 color: 'white'
 }}>
 <FiInfo size={32} style={{ marginBottom: '0.5rem' }} />
 <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>
 {summary.warnings_count}
 </h3>
 <p style={{ margin: 0, opacity: 0.9 }}>Active Warnings</p>
 </div>
 </div>

 {/* Tabs */}
 <div style={{
 display: 'flex',
 gap: isMobile ? '0.25rem' : '1rem',
 flexWrap: isMobile ? 'wrap' : 'nowrap',
 borderBottom: '2px solid #e2e8f0',
 marginBottom: '2rem'
 }}>
 {[
 { id: 'predictions', label: 'Risk Predictions', icon: FiTarget },
 { id: 'patterns', label: 'Pattern Analysis', icon: FiBarChart2 },
 { id: 'warnings', label: 'Early Warnings', icon: FiAlertTriangle }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 style={{
 padding: isMobile ? '0.75rem 0.6rem' : '1rem 1.5rem',
 background: 'none',
 border: 'none',
 borderBottom: activeTab === tab.id ? '3px solid #f97316' : '3px solid transparent',
 color: activeTab === tab.id ? '#f97316' : '#64748b',
 fontWeight: '700',
 fontSize: isMobile ? '0.8rem' : '1rem',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: isMobile ? '0.3rem' : '0.5rem',
 transition: 'all 0.3s ease'
 }}
 >
 <tab.icon /> {tab.label}
 </button>
 ))}
 </div>

 {/* Tab Content */}
 {activeTab === 'predictions' && (
 <div>
 <h2 style={{ marginBottom: '1.5rem' }}>
 <FiTarget style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
 Top 20 High-Risk Students
 </h2>
 <p style={{ color: '#64748b', marginBottom: '2rem' }}>
 Students most likely to be late again based on historical patterns
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 {predictions.map((pred, index) => (
 <div
 key={pred.student_id}
 style={{
 background: 'white',
 padding: isMobile ? '1rem' : '1.5rem',
 borderRadius: '12px',
 border: '2px solid #e2e8f0',
 display: 'flex',
 alignItems: isMobile ? 'flex-start' : 'center',
 gap: isMobile ? '0.8rem' : '1.5rem',
 flexWrap: isMobile ? 'wrap' : 'nowrap',
 transition: 'all 0.3s ease',
 cursor: 'pointer'
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.borderColor = getRiskColor(pred.risk_category);
 e.currentTarget.style.transform = 'translateX(8px)';
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.borderColor = '#e2e8f0';
 e.currentTarget.style.transform = 'translateX(0)';
 }}
 >
 {/* Rank */}
 <div style={{
 width: isMobile ? '40px' : '48px',
 height: isMobile ? '40px' : '48px',
 borderRadius: '50%',
 background: 'linear-gradient(135deg, #f97316 0%, #0d9488 100%)',
 color: 'white',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: isMobile ? '1rem' : '1.25rem',
 fontWeight: '900'
 }}>
 {index + 1}
 </div>

 {/* Student Info */}
 <div style={{ flex: 1, minWidth: isMobile ? 'calc(100% - 52px)' : 0 }}>
 <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.125rem', lineHeight: 1.25 }}>
 {pred.name}
 </h3>
 <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: isMobile ? '0.82rem' : '0.875rem' }}>
 {pred.roll_no} • {pred.branch} Year {pred.year} • {pred.late_days} late days
 </p>
 </div>

 {/* Risk Score */}
 <div style={{ textAlign: 'center', marginLeft: 0 }}>
 <div style={{
 width: isMobile ? '68px' : '80px',
 height: isMobile ? '68px' : '80px',
 borderRadius: '50%',
 border: `${isMobile ? 5 : 6}px solid ${getRiskColor(pred.risk_category)}`,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 flexDirection: 'column'
 }}>
 <span style={{ 
 fontSize: isMobile ? '1.25rem' : '1.5rem',
 fontWeight: '900',
 color: getRiskColor(pred.risk_category)
 }}>
 {pred.risk_score}
 </span>
 <span style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: '#64748b' }}>RISK</span>
 </div>
 </div>

 {/* Risk Badge */}
 <div style={{ ...getRiskBadgeStyle(pred.risk_category), marginLeft: isMobile ? 'auto' : 0 }}>
 {pred.risk_category}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'patterns' && patterns && (
 <div>
 <h2 style={{ marginBottom: '1.5rem' }}>
 <FiBarChart2 style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
 Pattern Analysis
 </h2>

 {/* Peak Late Day */}
 <div style={{
 background: 'white',
 padding: '2rem',
 borderRadius: '16px',
 border: '2px solid #e2e8f0',
 marginBottom: '1.5rem'
 }}>
 <h3 style={{ marginTop: 0 }}> Peak Late Day: {patterns.peak_late_day.day}</h3>
 <p style={{ color: '#64748b', marginBottom: '1rem' }}>
 {patterns.peak_late_day.count} late arrivals recorded on {patterns.peak_late_day.day}s
 </p>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
 {Object.entries(patterns.peak_late_day.day_breakdown).map(([day, count]) => (
 <div
 key={day}
 style={{
 padding: '0.75rem 1.25rem',
 background: count === patterns.peak_late_day.count 
 ? 'linear-gradient(135deg, #f97316 0%, #0d9488 100%)'
 : '#f1f5f9',
 color: count === patterns.peak_late_day.count ? 'white' : '#64748b',
 borderRadius: '8px',
 fontWeight: '700'
 }}
 >
 {day}: {count}
 </div>
 ))}
 </div>
 </div>

 {/* Branch Distribution */}
 <div style={{
 background: 'white',
 padding: '2rem',
 borderRadius: '16px',
 border: '2px solid #e2e8f0',
 marginBottom: '1.5rem'
 }}>
 <h3 style={{ marginTop: 0 }}> Branch Distribution</h3>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 {Object.entries(patterns.branch_distribution).map(([branch, percentage]) => (
 <div key={branch}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
 <span style={{ fontWeight: '700' }}>{branch}</span>
 <span style={{ color: '#f97316', fontWeight: '700' }}>{percentage}%</span>
 </div>
 <div style={{
 height: '12px',
 background: '#e2e8f0',
 borderRadius: '6px',
 overflow: 'hidden'
 }}>
 <div style={{
 height: '100%',
 width: `${percentage}%`,
 background: 'linear-gradient(90deg, #f97316 0%, #0d9488 100%)',
 transition: 'width 0.5s ease'
 }} />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Year Averages */}
 <div style={{
 background: 'white',
 padding: '2rem',
 borderRadius: '16px',
 border: '2px solid #e2e8f0'
 }}>
 <h3 style={{ marginTop: 0 }}> Average Late Days by Year</h3>
 <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
 {Object.entries(patterns.year_averages).map(([year, avg]) => (
 <div
 key={year}
 style={{
 flex: '1 1 150px',
 padding: '1.5rem',
 background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
 borderRadius: '12px',
 textAlign: 'center'
 }}
 >
 <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f97316' }}>
 {avg}
 </div>
 <div style={{ color: '#64748b', fontWeight: '600' }}>
 Year {year}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'warnings' && (
 <div>
 <h2 style={{ marginBottom: '1.5rem' }}>
 <FiAlertTriangle style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
 Early Warning System
 </h2>
 <p style={{ color: '#64748b', marginBottom: '2rem' }}>
 Proactive alerts for students requiring intervention
 </p>

 {early_warnings.length === 0 ? (
 <div style={{
 background: 'white',
 padding: '3rem',
 borderRadius: '16px',
 textAlign: 'center',
 border: '2px solid #e2e8f0'
 }}>
 <FiCheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
 <h3 style={{ color: '#10b981' }}>All Clear!</h3>
 <p style={{ color: '#64748b' }}>No active warnings at this time</p>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 {early_warnings.map((warning, index) => (
 <div
 key={index}
 style={{
 background: 'white',
 padding: '1.5rem',
 borderRadius: '12px',
 border: `2px solid ${warning.severity === 'HIGH' ? '#dc2626' : '#f59e0b'}`,
 display: 'flex',
 alignItems: 'center',
 gap: '1.5rem'
 }}
 >
 <FiAlertTriangle 
 size={32} 
 color={warning.severity === 'HIGH' ? '#dc2626' : '#f59e0b'} 
 />
 
 <div style={{ flex: 1 }}>
 <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{warning.name}</h3>
 <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
 {warning.roll_no} • {warning.late_days} late days
 </p>
 <p style={{
 margin: '0.5rem 0 0 0',
 fontWeight: '600',
 color: warning.severity === 'HIGH' ? '#dc2626' : '#f59e0b'
 }}>
 {warning.message}
 </p>
 </div>

 <div style={{
 padding: '0.5rem 1rem',
 borderRadius: '8px',
 fontSize: '0.875rem',
 fontWeight: '700',
 color: 'white',
 backgroundColor: warning.severity === 'HIGH' ? '#dc2626' : '#f59e0b'
 }}>
 {warning.severity}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 );
};

export default AIInsights;

