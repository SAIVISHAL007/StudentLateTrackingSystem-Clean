import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Create a global toast object for easy access
let globalToast = null;

export const toast = {
  success: (message, duration) => globalToast?.success(message, duration),
  error: (message, duration) => globalToast?.error(message, duration),
  warning: (message, duration) => globalToast?.warning(message, duration),
  info: (message, duration) => globalToast?.info(message, duration)
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toastItem = { id, message, type, duration };
    
    setToasts(prev => [...prev, toastItem]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, [removeToast]);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  // Set global toast reference
  React.useEffect(() => {
    globalToast = { success, error, warning, info };
    return () => {
      globalToast = null;
    };
  }, [success, error, warning, info]);

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
      top: '1.5rem',
      right: '1.5rem',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '450px'
    }}>
      {toasts.map(toastItem => (
        <Toast key={toastItem.id} toast={toastItem} onClose={() => removeToast(toastItem.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast: toastItem, onClose }) => {
  const { type, message } = toastItem;
  
  const icons = {
    success: <FiCheckCircle size={22} />,
    error: <FiXCircle size={22} />,
    warning: <FiAlertTriangle size={22} />,
    info: <FiInfo size={22} />
  };

  const styles = {
    success: {
      bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '#6ee7b7',
      text: '#065f46'
    },
    error: {
      bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '#fca5a5',
      text: '#991b1b'
    },
    warning: {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '#fbbf24',
      text: '#92400e'
    },
    info: {
      bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      border: '#93c5fd',
      text: '#1e40af'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      background: style.bg,
      color: style.text,
      padding: '1.125rem 1.5rem',
      borderRadius: '14px',
      border: `2px solid ${style.border}`,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 15px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      minWidth: '340px',
      animation: 'slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      fontWeight: '600',
      fontSize: '0.975rem'
    }}>
      <div className="icon-wrapper icon-lg" style={{
        flexShrink: 0,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }}>
        {icons[type]}
      </div>
      <div style={{ flex: 1, lineHeight: '1.5' }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: style.text,
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0.25rem',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          flexShrink: 0
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(0, 0, 0, 0.1)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <FiXCircle size={18} />
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
