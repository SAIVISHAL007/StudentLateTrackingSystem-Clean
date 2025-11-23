import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const { type, message } = toast;
  
  const styles = {
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      icon: '✓',
      color: '#fff'
    },
    error: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      icon: '✕',
      color: '#fff'
    },
    warning: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      icon: '⚠',
      color: '#fff'
    },
    info: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      icon: 'ℹ',
      color: '#fff'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      background: style.background,
      color: style.color,
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      animation: 'slideInRight 0.3s ease-out',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {style.icon}
      </div>
      <div style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '18px',
          lineHeight: '1',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
        onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
      >
        ×
      </button>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
