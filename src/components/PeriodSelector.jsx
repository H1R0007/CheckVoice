// src/components/PeriodSelector.jsx

import React from 'react';
import './PeriodSelector.css';

const PERIODS = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'all', label: 'Всё время' },
];

export default function PeriodSelector({ selected, onChange }) {
  return (
    <div className="period-selector" role="group" aria-label="Выбор периода">
      {PERIODS.map(function (period) {
        var isActive = selected === period.key;

        return (
          <button
            key={period.key}
            type="button"
            className={'period-btn' + (isActive ? ' active' : '')}
            onClick={function () {
              onChange(period.key);
            }}
            aria-pressed={isActive}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}