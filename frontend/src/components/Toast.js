import { useState, useEffect } from 'react';

let toastQueue = [];
let showToastCallback = null;

export const toast = {
  success: (message, duration = 3000) => {
    showToast({ type: 'success', message, duration });
  },
  error: (message, duration = 4000) => {
    showToast({ type: 'error', message, duration });
  },
  warning: (message, duration = 3500) => {
    showToast({ type: 'warning', message, duration });
  },
  info: (message, duration = 3000) => {
    showToast({ type: 'info', message, duration });
  },
  loading: (message) => {
    return showToast({ type: 'loading', message, duration: null });
  }
};

function showToast(config) {
  const id = Date.now() + Math.random();
  const toastItem = { ...config, id };
  toastQueue.push(toastItem);
  if (showToastCallback) {
    showToastCallback([...toastQueue]);
  }
  return id;
}

export function dismissToast(id) {
  toastQueue = toastQueue.filter(t => t.id !== id);
  if (showToastCallback) {
    showToastCallback([...toastQueue]);
  }
}

function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastCallback = setToasts;
    return () => {
      showToastCallback = null;
    };
  }, []);

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration !== null) {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts]);

  const getToastStyle = (type) => {
    const baseStyle = {
      padding: '14px 20px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.95rem',
      fontWeight: 600,
      minWidth: '280px',
      maxWidth: '450px',
      animation: 'slideInRight 0.3s ease-out',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };

    const styles = {
      success: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        border: '2px solid #34d399'
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        border: '2px solid #f87171'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: '2px solid #fbbf24'
      },
      info: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        border: '2px solid #60a5fa'
      },
      loading: {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: '2px solid #a78bfa'
      }
    };

    return { ...baseStyle, ...styles[type] };
  };

  const getIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      loading: '⏳'
    };
    return icons[type] || '📢';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          style={{
            ...getToastStyle(toast.type),
            pointerEvents: 'auto',
            animationDelay: `${index * 0.1}s`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>{getIcon(toast.type)}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.type === 'loading' && (
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default Toast;
