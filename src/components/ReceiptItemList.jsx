// src/components/ReceiptItemList.jsx

import React, { useEffect, useRef, useCallback } from 'react';
import ReceiptItem from './ReceiptItem';
import './ReceiptItemList.css';

export default function ReceiptItemList({
  items,
  onDelete,
  onEditPrice,
  onEditCategory,
  readOnly = false,
}) {
  const listRef = useRef(null);
  const prevCountRef = useRef(items.length);

  // Скролл к новому элементу при добавлении
  useEffect(() => {
    if (items.length > prevCountRef.current && listRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lastItem = listRef.current.querySelector('li:last-child');

      if (lastItem) {
        lastItem.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
        });
      }
    }

    prevCountRef.current = items.length;
  }, [items.length]);

  // Обработчик фокуса: при получении фокуса любым элементом списка
  // прокручиваем его в зону видимости — критично для ТВ-навигации
  const handleFocusCapture = useCallback((e) => {
    const li = e.target.closest('li');
    if (!li) return;

    // Используем scrollIntoView с block:'nearest' чтобы не прыгал на уже видимых
    li.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, []);

  return (
    <ul
      className="receipt-item-list"
      ref={listRef}
      onFocusCapture={handleFocusCapture}
    >
      {items.map(function (item, index) {
        return (
          <ReceiptItem
            key={item.id}
            item={item}
            index={index}
            onDelete={onDelete}
            onEditPrice={onEditPrice}
            onEditCategory={onEditCategory}
            readOnly={readOnly}
          />
        );
      })}
    </ul>
  );
}