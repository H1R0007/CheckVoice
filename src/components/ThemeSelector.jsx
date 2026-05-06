// src/components/ThemeSelector.jsx

import React from 'react';
import './ThemeSelector.css';

const THEMES = [
  { key: 'light', label: '\u0421\u0432\u0435\u0442\u043B\u0430\u044F' },
  { key: 'dark', label: '\u0418\u0437\u0443\u043C\u0440\u0443\u0434' },
  { key: 'midnight', label: '\u041F\u043E\u043B\u043D\u043E\u0447\u044C' },
];

export default function ThemeSelector({ currentTheme, onChangeTheme }) {
  return (
    <div className="theme-selector">
      <div className="theme-selector-title">{'\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435'}</div>
      <div className="theme-selector-options">
        {THEMES.map(({ key, label }) => (
          <button
            key={key}
            className={`theme-option ${currentTheme === key ? 'active' : ''}`}
            onClick={() => onChangeTheme(key)}
          >
            <div className={`theme-preview theme-preview--${key}`}>
              <div className="theme-preview-bg" />
              <div className="theme-preview-accent" />
            </div>
            <span className="theme-option-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}