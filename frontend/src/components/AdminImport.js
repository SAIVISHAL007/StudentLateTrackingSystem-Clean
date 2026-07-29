import { useState } from 'react';
import { FiUploadCloud, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import API from '../services/api';
import { toast } from './Toast';

function AdminImport() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isExcelOrCSV = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv');
      if (!isExcelOrCSV) {
        toast.error('Please select a valid Excel (.xlsx) or CSV (.csv) file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('No file selected.');
      return;
    }

    setUploading(true);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('jwt_token');
      const res = await API.post('/students/import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResults({ success: true, ...res.data });
      toast.success(res.data.message || 'Import successful!');
      setFile(null);
      document.getElementById('import-file-input').value = '';
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to import students';
      toast.error(errorMsg);
      setResults({ success: false, error: errorMsg, details: err.response?.data?.details });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Bulk Import Students</h2>
        <p style={{ color: '#64748b' }}>Upload an Excel or CSV file to create or update student records in bulk.</p>
      </div>

      <div style={{
        border: '2px dashed #cbd5e1',
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center',
        background: '#f8fafc',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
      }}>
        <input 
          id="import-file-input"
          type="file" 
          accept=".xlsx, .csv" 
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0,
            cursor: 'pointer'
          }}
        />
        
        {!file ? (
          <div style={{ pointerEvents: 'none' }}>
            <FiUploadCloud size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: '#475569', fontSize: '1.2rem' }}>Drag & Drop or Click to Upload</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Supports .xlsx and .csv formats</p>
          </div>
        ) : (
          <div style={{ pointerEvents: 'none' }}>
            <FiFile size={48} color="#0ea5e9" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: '#0369a1', fontSize: '1.2rem' }}>{file.name}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            padding: '12px 24px',
            background: file && !uploading ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : '#cbd5e1',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: file && !uploading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
            boxShadow: file && !uploading ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
          }}
        >
          {uploading ? 'Importing...' : 'Start Import'}
        </button>
      </div>

      {results && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          background: results.success ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${results.success ? '#bbf7d0' : '#fecaca'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {results.success ? <FiCheckCircle color="#16a34a" size={24}/> : <FiAlertCircle color="#dc2626" size={24}/>}
            <h3 style={{ margin: 0, color: results.success ? '#166534' : '#991b1b' }}>
              {results.success ? 'Import Completed' : 'Import Failed'}
            </h3>
          </div>
          
          {results.success && results.stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{results.stats.total}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Total Records</div>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{results.stats.created}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Created</div>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9' }}>{results.stats.updated}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Updated</div>
              </div>
            </div>
          )}

          {results.errors && results.errors.length > 0 && (
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '0.9rem' }}>Warnings/Errors ({results.errors.length}):</h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#dc2626', fontSize: '0.85rem' }}>
                {results.errors.slice(0, 10).map((err, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{err}</li>
                ))}
                {results.errors.length > 10 && (
                  <li>...and {results.errors.length - 10} more.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminImport;
