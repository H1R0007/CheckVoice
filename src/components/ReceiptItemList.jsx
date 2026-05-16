// src/components/ReceiptItemList.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReceiptItem from './ReceiptItem';
import './ReceiptItemList.css';

const ITEMS_PER_PAGE = 6;

export default function ReceiptItemList({
  items,
  onDelete,
  onEditPrice,
  onEditCategory,
  readOnly = false,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const listRef = useRef(null);
  const prevCountRef = useRef(items.length);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleItems = items.slice(startIndex, endIndex);

  const hasPrevPage = currentPage > 0;
  const hasNextPage = currentPage < totalPages - 1;

  // При добавлении товара переходим на последнюю страницу
  useEffect(() => {
    if (items.length > prevCountRef.current) {
      const lastPage = Math.max(0, Math.ceil(items.length / ITEMS_PER_PAGE) - 1);
      setCurrentPage(lastPage);
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  // При удалении товара корректируем страницу если она стала пустой
  useEffect(() => {
    if (currentPage > 0 && visibleItems.length === 0 && items.length > 0) {
      setCurrentPage(Math.max(0, currentPage - 1));
    }
  }, [currentPage, visibleItems.length, items.length]);

  const handlePrevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const handleFocusCapture = useCallback((e) => {
    const li = e.target.closest('li');
    if (!li) return;

    li.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, []);

  return (
    <div className="receipt-item-list-wrapper">
      <ul
        className="receipt-item-list"
        ref={listRef}
        onFocusCapture={handleFocusCapture}
      >
        {visibleItems.map(function (item, index) {
          const globalIndex = startIndex + index;
          return (
            <ReceiptItem
              key={item.id}
              item={item}
              index={globalIndex}
              onDelete={onDelete}
              onEditPrice={onEditPrice}
              onEditCategory={onEditCategory}
              readOnly={readOnly}
            />
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="receipt-pagination" role="navigation" aria-label="Навигация по страницам чека">
          <button
            type="button"
            className="pagination-btn pagination-btn--prev"
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft size={20} strokeWidth={2.5} aria-hidden="true" />
            <span className="pagination-btn-text">Назад</span>
          </button>

          <div className="pagination-indicator" aria-live="polite" aria-atomic="true">
            <span className="pagination-current">{currentPage + 1}</span>
            <span className="pagination-divider">/</span>
            <span className="pagination-total">{totalPages}</span>
          </div>

          <button
            type="button"
            className="pagination-btn pagination-btn--next"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            aria-label="Следующая страница"
          >
            <span className="pagination-btn-text">Вперёд</span>
            <ChevronRight size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}