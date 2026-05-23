// src/components/ReceiptItem.jsx
// Структура карточки — возвращаем оригинальную двухрядную

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, AlertCircle, Brain } from 'lucide-react';
import { getCategoryByKey } from '../constants/categories';
import { formatPriceShort } from '../utils/formatPrice';
import { CATEGORIES } from '../constants/categories';
import './ReceiptItem.css';

export default function ReceiptItem({
  item,
  index,
  isSelected,
  onSelect,
  onDelete,
  onEditPrice,
  onEditTitle,
  onEditCategory,
  readOnly = false,
}) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editTitleValue, setEditTitleValue] = useState('');
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

  const category = getCategoryByKey(item.category);
  const catColor  = category ? `var(${category.cssVar})`     : 'var(--color-text-tertiary)';
  const catBg     = category ? `var(${category.cssVarSoft})` : 'var(--color-bg-inset)';

  const handleCardClick = () => {
    if (readOnly || isEditingPrice || isEditingTitle) return;
    if (typeof onSelect === 'function') onSelect(item.id);
  };

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleStartEditTitle = (e) => {
    e.stopPropagation();
    if (readOnly || isRemoving) return;
    setEditTitleValue(item.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    const val = editTitleValue.trim();
    if (val && typeof onEditTitle === 'function') onEditTitle(item.id, val);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter')  handleSaveTitle();
    if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const handleStartEditPrice = (e) => {
    e.stopPropagation();
    if (readOnly || isRemoving) return;
    setEditPriceValue(String(item.price));
    setIsEditingPrice(true);
  };

  const handleSavePrice = () => {
    const val = parseFloat(editPriceValue.replace(',', '.'));
    if (!isNaN(val) && val >= 0) onEditPrice(item.id, Math.round(val * 100) / 100);
    setIsEditingPrice(false);
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter')  handleSavePrice();
    if (e.key === 'Escape') setIsEditingPrice(false);
  };

  const handleCategoryChange = (e) => {
    e.stopPropagation();
    if (readOnly || typeof onEditCategory !== 'function') return;
    onEditCategory(item.id, e.target.value);
  };

  const handleDelete = useCallback((e) => {
    if (e) e.stopPropagation();
    if (readOnly || isRemoving) return;
    setIsRemoving(true);
    setTimeout(() => onDelete(item.id), 250);
  }, [item.id, onDelete, readOnly, isRemoving]);

  useEffect(() => {
    const el = itemRef.current;
    if (!el || readOnly) return;

    function onTouchStart(e) {
      if (isEditingPrice || isEditingTitle || isRemoving) return;
      touchStartX.current        = e.touches[0].clientX;
      touchStartY.current        = e.touches[0].clientY;
      isHorizontalSwipe.current  = false;
      currentSwipeX.current      = 0;
      setIsSwiping(true);
    }

    function onTouchMove(e) {
      if (!isHorizontalSwipe.current && currentSwipeX.current === 0) {
        const dx = touchStartX.current - e.touches[0].clientX;
        const dy = Math.abs(touchStartY.current - e.touches[0].clientY);
        if (Math.abs(dx) > 10 || dy > 10) {
          isHorizontalSwipe.current = Math.abs(dx) > dy;
          if (!isHorizontalSwipe.current) {
            setIsSwiping(false);
            setSwipeX(0);
            return;
          }
        } else return;
      }
      if (isHorizontalSwipe.current) {
        const dx = touchStartX.current - e.touches[0].clientX;
        if (dx > 0) {
          e.preventDefault();
          const capped = dx > 80 ? 80 + (dx - 80) * 0.3 : dx;
          currentSwipeX.current = Math.min(capped, 120);
          setSwipeX(currentSwipeX.current);
        } else {
          currentSwipeX.current = 0;
          setSwipeX(0);
        }
      }
    }

    function onTouchEnd() {
      if (currentSwipeX.current >= 60) handleDelete();
      currentSwipeX.current = 0;
      setSwipeX(0);
      setIsSwiping(false);
      isHorizontalSwipe.current = false;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [readOnly, isEditingPrice, isEditingTitle, isRemoving, handleDelete]);

  const cardClass = [
    'receipt-item-card',
    isSwiping && swipeX > 0 ? 'swiping'        : '',
    isSelected              ? 'is-selected'    : '',
    isLowConfidence         ? 'low-confidence' : '',
    isLearnedExact          ? 'learned-exact'  : '',
  ].filter(Boolean).join(' ');

  return (
    <li
      ref={itemRef}
      data-item-id={item.id}
      className={[
        'receipt-item',
        readOnly                    ? 'read-only' : '',
        isRemoving                  ? 'removing'  : '',
        isSwiping && swipeX > 0    ? 'is-swiping' : '',
      ].filter(Boolean).join(' ')}
    >
      {!readOnly && (
        <div className="receipt-item-swipe-bg" aria-hidden="true">
          <Trash2 size={20} strokeWidth={2} />
        </div>
      )}

      <div
        className={cardClass}
        style={swipeX > 0 ? { transform: `translateX(-${swipeX}px)` } : undefined}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        role={readOnly ? undefined : 'button'}
        tabIndex={readOnly ? undefined : 0}
        aria-pressed={readOnly ? undefined : isSelected}
        aria-label={`${item.title}, ${formatPriceShort(item.price)}`}
      >
        {/* ── Строка 1: номер · название · цена ── */}
        <div className="item-row-top">

          <span className="item-number" aria-hidden="true">
            {index + 1}
          </span>

          {isEditingTitle ? (
            <input
              className="item-title-input"
              type="text"
              value={editTitleValue}
              onChange={(e) => setEditTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleSaveTitle}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              aria-label="Название товара"
            />
          ) : (
            <button
              type="button"
              className={`item-title-btn${!readOnly ? ' editable' : ''}`}
              onClick={handleStartEditTitle}
              disabled={readOnly}
              tabIndex={readOnly ? -1 : 0}
              aria-label={readOnly ? item.title : `Изменить название: ${item.title}`}
            >
              {item.title}
            </button>
          )}

          <div className="item-price-block">
            {isEditingPrice ? (
              <div className="item-price-input-wrap">
                <input
                  className="item-price-input"
                  type="text"
                  inputMode="decimal"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  onBlur={handleSavePrice}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  aria-label="Цена товара"
                />
                <span className="item-price-currency">₽</span>
              </div>
            ) : (
              <button
                type="button"
                className={`item-price-btn${!readOnly ? ' editable' : ''}`}
                onClick={handleStartEditPrice}
                disabled={readOnly}
                tabIndex={readOnly ? -1 : 0}
                aria-label={
                  readOnly
                    ? `Цена: ${formatPriceShort(item.price)}`
                    : `Изменить цену: ${formatPriceShort(item.price)}`
                }
              >
                {formatPriceShort(item.price)}
              </button>
            )}
          </div>
        </div>

        {/* ── Строка 2: категория · подсказки · удаление ── */}
        <div className="item-row-bottom">

          {readOnly ? (
            <span
              className="item-category-badge"
              style={{ color: catColor, borderColor: catColor, background: catBg }}
            >
              {category?.name ?? 'Другое'}
            </span>
          ) : (
            <select
              className="item-category-select"
              value={item.category}
              onChange={handleCategoryChange}
              onClick={(e) => e.stopPropagation()}
              style={{ color: catColor, background: catBg, borderColor: catColor }}
              aria-label={`Категория: ${category?.name}`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          {isLowConfidence && !readOnly && (
            <span
              className="item-quality-hint"
              title="Категория определена неуверенно — проверьте"
            >
              <AlertCircle size={11} strokeWidth={2.5} aria-hidden="true" />
              <span>проверьте</span>
            </span>
          )}

          {isLearnedExact && !readOnly && (
            <span
              className="item-quality-hint item-quality-hint--learned"
              title="Категория учтена по вашим исправлениям"
            >
              <Brain size={11} strokeWidth={2.5} aria-hidden="true" />
            </span>
          )}

          <span className="item-row-bottom-spacer" aria-hidden="true" />

          {/* Единственная кнопка удаления — только здесь */}
          {!readOnly && (
            <button
              type="button"
              className="item-delete-btn"
              onClick={handleDelete}
              tabIndex={0}
              aria-label={`Удалить: ${item.title}`}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>

      </div>
    </li>
  );
}