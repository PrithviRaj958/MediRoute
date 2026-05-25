import React from 'react';

export default function DeleteConfirmModal({ title, name, warning, onConfirm, onClose, loading = false }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="delete-modal-icon">🗑️</div>
        <div className="delete-modal-text">You are about to permanently delete:</div>
        <div className="delete-modal-name">"{name}"</div>
        {warning && <div className="delete-modal-warning" style={{ marginTop: '0.5rem' }}>⚠️ {warning}</div>}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
          >
            {loading ? 'Deleting...' : '🗑 Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
