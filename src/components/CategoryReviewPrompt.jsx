// src/components/CategoryReviewPrompt.jsx

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';
import './CategoryReviewPrompt.css';

export default function CategoryReviewPrompt({ items = [], onEditCategory }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const reviewItems = useMemo(() => {
    return items.filter((item) => {
      const isLowConfidence =
        item.categorySource === 'auto' &&
        typeof item.categoryConfidence === 'number' &&
        item.categoryConfidence < 0.55;

      const isOther = item.category === 'other';

      return isLowConfidence || isOther;
    });
  }, [items]);

  if (isDismissed || reviewItems.length === 0) {
    return null;
  }

  const handleCategoryChange = (itemId, newCategory) => {
    if (typeof onEditCategory === 'function') {
      onEditCategory(itemId, newCategory);
    }
  };

  return (
    <div className="category-review-prompt">
      <div className="category-review-header">
        <div className="category-review-title-wrap">
          <div className="category-review-icon">
            <AlertCircle size={18} strokeWidth={2} />
          </div>
          <div className="category-review-text">
            <div className="category-review-title">Проверьте категории</div>
            <div className="category-review-subtitle">
              {reviewItems.length} спорн{reviewItems.length === 1 ? 'ая позиция' : reviewItems.length >= 2 && reviewItems.length <= 4 ? 'ые позиции' : 'ых позиций'}
            </div>
          </div>
        </div>

        <div className="category-review-actions">
          <button
            type="button"
            className="category-review-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} strokeWidth={2} />
                <span>Скрыть</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} strokeWidth={2} />
                <span>Проверить</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="category-review-btn category-review-btn--ghost"
            onClick={() => setIsDismissed(true)}
          >
            Позже
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="category-review-list">
          {reviewItems.map((item) => {
            const isLowConfidence =
              item.categorySource === 'auto' &&
              typeof item.categoryConfidence === 'number' &&
              item.categoryConfidence < 0.55;

            const reasonText = item.category === 'other'
              ? 'Не удалось уверенно определить категорию'
              : isLowConfidence
                ? 'Категория определена неуверенно'
                : 'Проверьте категорию';

            return (
              <div key={item.id} className="category-review-item">
                <div className="category-review-item-main">
                  <div className="category-review-item-title">{item.title}</div>
                  <div className="category-review-item-reason">{reasonText}</div>
                </div>

                <div className="category-review-item-controls">
                  <select
                    className="category-review-select"
                    value={item.category}
                    onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                    aria-label={'Категория товара ' + item.title}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}

          <div className="category-review-footer">
            <CheckCircle2 size={16} strokeWidth={2} />
            <span>Исправления запомнятся и будут учтены в следующий раз</span>
          </div>
        </div>
      )}
    </div>
  );
}