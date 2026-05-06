// src/components/StorageIndicator.jsx

import React from 'react';
import './StorageIndicator.css';

export default function StorageIndicator({ storageInfo }) {
  if (!storageInfo) return null;

  const {
    formattedUsed = '0 Б',
    formattedMax = '5.0 МБ',
    percent = 0,
    receiptsCount = 0,
    isWarning = false,
    isCritical = false,
  } = storageInfo;

  const safePercent = isNaN(percent) ? 0 : percent;

  const getFillClass = () => {
    if (isCritical || safePercent >= 95) return 'storage-bar-fill--danger';
    if (isWarning || safePercent >= 80) return 'storage-bar-fill--warning';
    return '';
  };

  return (
    <div className="storage-indicator">
      <div className="storage-header">
        <span className="storage-title">Хранилище</span>
        <span className="storage-values">
          {formattedUsed} из {formattedMax} &middot; {Math.round(safePercent)}%
        </span>
      </div>
      <div className="storage-bar">
        <div
          className={'storage-bar-fill ' + getFillClass()}
          style={{ width: Math.min(safePercent, 100) + '%' }}
        />
      </div>
      <div className="storage-footer">
        Чеков: {receiptsCount}
      </div>
    </div>
  );
}