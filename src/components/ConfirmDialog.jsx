// src/components/ConfirmDialog.jsx

import React, { useEffect, useId, useRef } from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Да',
  cancelText = 'Отмена',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return function () {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-title" id={titleId}>
          {title}
        </div>

        <div className="confirm-message" id={messageId}>
          {message}
        </div>

        <div className="confirm-buttons">
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={onCancel}
            ref={cancelButtonRef}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-btn confirm ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}