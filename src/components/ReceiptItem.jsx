// src/components/ReceiptItem.jsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Trash2, AlertCircle, Brain } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import { formatPriceShort } from '../utils/formatPrice';
import { CATEGORIES } from '../constants/categories';
import './ReceiptItem.css';

export default function ReceiptItem({
  item,
  index,
  onDelete,
  onEditPrice,
  onEditCategory,
  readOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const itemRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const currentSwipeX = useRef(0);

  const isLowConfidence =
    item.categorySource === 'auto' &&
    typeof item.categoryConfidence === 'number' &&
    item.categoryConfidence < 0.55;

  const isLearnedExact = item.categorySource === 'learned-exact';

  const handleStartEdit = () => {
    if (readOnly || isRemoving) return;
    setEditValue(String(item.price));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newPrice = parseFloat(editValue.replace(',', '.'));

    if (!isNaN(newPrice) && newPrice >= 0) {
      onEditPrice(item.id, Math.round(newPrice * 100) / 100);
    }

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const handlePriceButtonKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStartEdit();
    }
  };

  const handleCategoryChange = (e) => {
    if (readOnly || typeof onEditCategory !== 'function') return;
    onEditCategory(item.id, e.target.value);
  };

  const handleDelete = useCallback(() => {
    if (readOnly || isRemoving) return;

    setIsRemoving(true);

    setTimeout(function () {
      onDelete(item.id);
    }, 280);
  }, [item.id, onDelete, readOnly, isRemoving]);

  useEffect(() => {
    const el = itemRef.current;
    if (!el || readOnly) return;

    function onTouchStart(e) {
      if (isEditing || isRemoving) return;

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = false;
      currentSwipeX.current = 0;

      setIsSwiping(true);
    }

    function onTouchMove(e) {
      if (!isHorizontalSwipe.current && currentSwipeX.current === 0) {
        var diffX = touchStartX.current - e.touches[0].clientX;
        var diffY = Math.abs(touchStartY.current - e.touches[0].clientY);

        if (Math.abs(diffX) > 10 || diffY > 10) {
          isHorizontalSwipe.current = Math.abs(diffX) > diffY;

          if (!isHorizontalSwipe.current) {
            setIsSwiping(false);
            setSwipeX(0);
            return;
          }
        } else {
          return;
        }
      }

      if (isHorizontalSwipe.current) {
        var dx = touchStartX.current - e.touches[0].clientX;

        if (dx > 0) {
          e.preventDefault();

          var capped = dx > 80 ? 80 + (dx - 80) * 0.3 : dx;
          currentSwipeX.current = Math.min(capped, 120);
          setSwipeX(currentSwipeX.current);
        } else {
          currentSwipeX.current = 0;
          setSwipeX(0);
        }
      }
    }

    function onTouchEnd() {
      if (currentSwipeX.current >= 60) {
        handleDelete();
      }

      currentSwipeX.current = 0;
      setSwipeX(0);
      setIsSwiping(false);
      isHorizontalSwipe.current = false;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return function () {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [readOnly, isEditing, isRemoving, handleDelete]);

  return (
    <li
      ref={itemRef}
      className={
        'receipt-item' +
        (readOnly ? ' read-only' : '') +
        (isRemoving ? ' removing' : '')
      }
    >
      {!readOnly && (
        <div className="receipt-item-delete-zone" aria-hidden="true">
          <Trash2 size={20} strokeWidth={2} />
        </div>
      )}

      <div
        className={
          'receipt-item-content' +
          (isSwiping && swipeX > 0 ? ' swiping' : '') +
          (isLowConfidence ? ' low-confidence' : '') +
          (isLearnedExact ? ' learned-exact' : '')
        }
        style={
          swipeX > 0
            ? { transform: 'translateX(-' + swipeX + 'px)' }
            : undefined
        }
      >
        <div className="item-main">
          <div className="item-info">
            <span className="item-number">{index + 1}.</span>
            <span className="item-title">{item.title}</span>
          </div>

          <div className="item-price-block">
            {isEditing ? (
              <div className="item-price-edit">
                <input
                  className="price-edit-input"
                  type="text"
                  inputMode="decimal"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={handleSaveEdit}
                  autoFocus
                  aria-label="Цена товара"
                />
                <span className="price-edit-currency">₽</span>
              </div>
            ) : (
              <button
                type="button"
                className={'item-price' + (!readOnly ? ' editable' : '')}
                onClick={handleStartEdit}
                onKeyDown={handlePriceButtonKeyDown}
                disabled={readOnly}
                aria-label={
                  readOnly
                    ? 'Цена товара'
                    : 'Редактировать цену: ' + formatPriceShort(item.price)
                }
              >
                {formatPriceShort(item.price)}
              </button>
            )}
          </div>
        </div>

        <div className="item-bottom">
          <div className="item-category-area">
            {readOnly ? (
              <CategoryBadge categoryKey={item.category} />
            ) : (
              <label className="item-category-editor">
                <span className="sr-only">Категория товара</span>
                <select
                  className={
                    'item-category-select' +
                    (isLowConfidence ? ' item-category-select--low-confidence' : '') +
                    (isLearnedExact ? ' item-category-select--learned' : '')
                  }
                  value={item.category}
                  onChange={handleCategoryChange}
                  aria-label={'Категория товара ' + item.title}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {isLowConfidence && !readOnly && (
              <div className="item-category-hint" role="note" aria-live="polite">
                <AlertCircle size={14} strokeWidth={2} aria-hidden="true" />
                <span>Проверьте категорию</span>
              </div>
            )}

            {isLearnedExact && !readOnly && (
              <div className="item-category-hint item-category-hint--learned" role="note">
                <Brain size={14} strokeWidth={2} aria-hidden="true" />
                <span>Учтено по вашим исправлениям</span>
              </div>
            )}
          </div>

          {!readOnly && (
            <button
              type="button"
              className="item-delete-btn"
              onClick={handleDelete}
              title="Удалить"
              aria-label={'Удалить позицию ' + item.title}
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}