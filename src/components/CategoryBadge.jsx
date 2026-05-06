// src/components/CategoryBadge.jsx

import React from 'react';
import { getCategoryByKey } from '../constants/categories';
import CategoryDot from './CategoryDot';
import './CategoryBadge.css';

export default function CategoryBadge({ categoryKey }) {
  const category = getCategoryByKey(categoryKey);

  if (!category) return null;

  return (
    <span
      className="category-badge"
      style={{
        '--category-badge-color': 'var(' + category.cssVar + ')',
        '--category-badge-bg': 'var(' + category.cssVarSoft + ')',
      }}
      title={category.name}
    >
      <CategoryDot categoryKey={categoryKey} size={14} />
      <span className="category-badge-name">{category.name}</span>
    </span>
  );
}