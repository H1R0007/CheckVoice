// src/components/VoiceIndicator.jsx

import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import './VoiceIndicator.css';

/**
 * Индикатор состояния голосового ввода.
 *
 * status: 'idle' | 'listening' | 'processing' | 'success' | 'error'
 * text: текст для отображения (необязательно)
 */
export default function VoiceIndicator({ status, text }) {
  if (status === 'idle') return null;

  return (
    <div
      className={`voice-indicator voice-indicator--${status}`}
      role="status"
      aria-live="polite"
    >
      {status === 'listening' && (
        <>
          <div className="voice-indicator-bars" aria-hidden="true">
            <span className="voice-indicator-bar" />
            <span className="voice-indicator-bar" />
            <span className="voice-indicator-bar" />
            <span className="voice-indicator-bar" />
            <span className="voice-indicator-bar" />
          </div>
          <span className="voice-indicator-text">{text || 'Слушаю...'}</span>
        </>
      )}

      {status === 'processing' && (
        <>
          <span className="voice-indicator-dot" aria-hidden="true" />
          <span className="voice-indicator-text">
            {text || 'Обрабатываю...'}
          </span>
        </>
      )}

      {status === 'success' && (
        <>
          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
          <span className="voice-indicator-text">{text || 'Готово'}</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
          <span className="voice-indicator-text">
            {text || 'Не удалось распознать'}
          </span>
        </>
      )}
    </div>
  );
}