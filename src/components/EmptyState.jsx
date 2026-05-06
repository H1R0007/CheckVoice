// src/components/EmptyState.jsx

import React from 'react';
import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon" aria-hidden="true">
          <Icon size={36} strokeWidth={1.5} />
        </div>
      )}

      <div className="empty-state-title">{title}</div>

      {subtitle && <div className="empty-state-subtitle">{subtitle}</div>}
    </div>
  );
}