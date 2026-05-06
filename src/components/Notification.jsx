// src/components/Notification.jsx

import React from 'react';
import { Check, X, AlertTriangle, AlertCircle } from 'lucide-react';
import './Notification.css';

const ICONS = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
};

export default function Notification({
  type = 'success',
  message,
  onClose,
  duration = 3000,
}) {
  const IconComponent = ICONS[type] || Check;
  const isError = type === 'error';

  return (
    <div
      className={`notification notification--${type}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      style={{ '--notification-duration': duration + 'ms' }}
    >
      <span className="notification-icon" aria-hidden="true">
        <IconComponent size={18} strokeWidth={2.25} />
      </span>

      <span className="notification-message">{message}</span>

      <button
        type="button"
        className="notification-close"
        onClick={onClose}
        aria-label="Закрыть уведомление"
      >
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}