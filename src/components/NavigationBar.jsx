// src/components/NavigationBar.jsx

import React from 'react';
import {
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Settings,
} from 'lucide-react';
import './NavigationBar.css';

const TABS = [
  { key: 'newReceipt', label: 'Чек', Icon: ShoppingCart },
  { key: 'history', label: 'История', Icon: ClipboardList },
  { key: 'statistics', label: 'Статистика', Icon: BarChart3 },
  { key: 'settings', label: 'Настройки', Icon: Settings },
];

export default function NavigationBar({ currentScreen, onNavigate }) {
  return (
    <nav className="navigation-bar" aria-label="Основная навигация">
      {TABS.map(function ({ key, label, Icon }) {
        var isActive = currentScreen === key;

        return (
          <button
            key={key}
            type="button"
            className={'nav-tab' + (isActive ? ' active' : '')}
            onClick={function () {
              onNavigate(key);
            }}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
          >
            <Icon
              className="nav-icon"
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}