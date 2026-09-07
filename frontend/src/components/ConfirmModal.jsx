import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = "Confirmation De Suppression",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  isDanger = true,
  isAlert = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (isAlert && onConfirm) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  };

  return createPortal(
    <div style={styles.overlay} className="animate-fade-in">
      <div className="card" style={styles.dialog}>
        <button onClick={handleCancel} style={styles.closeBtn} title="Fermer">
          <X size={18} />
        </button>

        <div style={{
          ...styles.iconCircle,
          backgroundColor: isDanger ? 'rgba(220, 38, 38, 0.12)' : 'var(--primary-light)',
          color: isDanger ? '#dc2626' : 'var(--primary)',
        }}>
          {isDanger ? <AlertTriangle size={28} /> : <HelpCircle size={28} />}
        </div>

        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>

        <div style={styles.actions}>
          {!isAlert && (
            <button onClick={handleCancel} className="btn btn-secondary" style={styles.cancelBtn}>
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={isDanger ? "btn btn-danger" : "btn btn-primary"}
            style={isDanger ? styles.dangerBtn : styles.primaryBtn}
          >
            {isAlert ? (confirmText !== "Supprimer" ? confirmText : "Compris") : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
    padding: '1rem',
  },
  dialog: {
    width: '100%',
    maxWidth: '440px',
    padding: '2rem 1.75rem 1.75rem 1.75rem',
    textAlign: 'center',
    position: 'relative',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--surface)',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem auto',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  message: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '1.75rem',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.65rem 1rem',
  },
  dangerBtn: {
    flex: 1,
    padding: '0.65rem 1rem',
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
    color: '#ffffff',
  },
  primaryBtn: {
    flex: 1,
    padding: '0.65rem 1rem',
  }
};
