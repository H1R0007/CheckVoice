// src/components/ReceiptItemList.jsx

import React, { useEffect, useRef } from 'react';
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

  return (
    <ul className="receipt-item-list" ref={listRef}>
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