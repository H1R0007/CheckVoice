// src/components/CategoryDot.jsx

import React from 'react';
import { getCategoryByKey } from '../constants/categories';
import './CategoryDot.css';

export default function CategoryDot({ categoryKey, size = 20 }) {
  const category = getCategoryByKey(categoryKey);

  if (!category) return null;

  return (
    <span
      className="category-dot"
      style={{
        width: size,
        height: size,
        '--category-dot-bg': 'var(' + category.cssVarSoft + ')',
        '--category-dot-border': 'var(' + category.cssVar + ')',
        '--category-dot-core': 'var(' + category.cssVar + ')',
        backgroundColor: 'var(--category-dot-bg)',
        borderColor: 'var(--category-dot-border)',
      }}
      title={category.name}
      aria-hidden="true"
    >
      <span
        className="category-dot-core"
        style={{ backgroundColor: 'var(--category-dot-core)' }}
      />
    </span>
  );
}