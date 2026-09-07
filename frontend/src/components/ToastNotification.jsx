import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({
  toast,
  onClose
}) {
  if (!toast || !toast.message) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.9rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--surface)',
        border: `1px solid ${
          isSuccess ? '#10b981' : isError ? '#dc2626' : 'var(--primary)'
        }`,
        boxShadow: 'var(--shadow-xl)',
        maxWidth: '420px',
        color: 'var(--text-primary)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: isSuccess
            ? 'rgba(16, 185, 129, 0.15)'
            : isError
            ? 'rgba(220, 38, 38, 0.15)'
            : 'var(--primary-light)',
          color: isSuccess ? '#10b981' : isError ? '#dc2626' : 'var(--primary)',
        }}
      >
        {isSuccess ? (
          <CheckCircle size={20} />
        ) : isError ? (
          <AlertCircle size={20} />
        ) : (
          <Info size={20} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isSuccess
                ? '#10b981'
                : isError
                ? '#dc2626'
                : 'var(--text-primary)',
              marginBottom: '0.15rem',
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.35',
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
        title="Fermer"
      >
        <X size={16} />
      </button>
    </div>,
    document.body
  );
}
