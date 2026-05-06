// src/components/CategoryBar.jsx

import React from 'react';
import { getCategoryByKey } from '../constants/categories';
import CategoryDot from './CategoryDot';
import { formatPriceShort } from '../utils/formatPrice';
import './CategoryBar.css';

export default function CategoryBar({ stat, style }) {
  if (!stat || !stat.key) return null;

  const category = getCategoryByKey(stat.key);

  if (!category) return null;

  const total = Number.isFinite(stat.total) ? stat.total : 0;
  const count = Number.isFinite(stat.count) ? stat.count : 0;

  const pct =
    stat.percent !== undefined
      ? stat.percent
      : stat.percentage !== undefined
        ? stat.percentage
        : 0;

  const safePctRaw = Number.isFinite(pct) ? pct : 0;
  const safePct = Math.min(Math.max(safePctRaw, 0), 100);
  const visualPct = safePct > 0 ? Math.max(safePct, 1.2) : 0;

  return (
    <div className="category-bar" style={style}>
      <div className="category-bar-header">
        <div className="category-bar-left">
          <CategoryDot categoryKey={stat.key} size={16} />
          <span className="category-bar-name" title={category.name}>
            {category.name}
          </span>
          <span className="category-bar-count">({count})</span>
        </div>

        <span className="category-bar-amount">
          {formatPriceShort(total)}
        </span>
      </div>

      <div className="category-bar-track" aria-hidden="true">
        <div
          className="category-bar-fill"
          style={{
            transform: 'scaleX(' + visualPct / 100 + ')',
            backgroundColor: 'var(' + category.cssVar + ')',
            opacity: visualPct > 0 ? 1 : 0,
          }}
        />
      </div>

      <div className="category-bar-percent">{Math.round(safePct)}%</div>
    </div>
  );
}