// src/components/ReceiptItemList.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReceiptItem from './ReceiptItem';
import './ReceiptItemList.css';

const ITEMS_PER_PAGE = 6;

export default function ReceiptItemList({
  items,
  onDelete,
  onEditPrice,
  onEditTitle,
  onEditCategory,
  readOnly = false,
  isActive = true,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedId, setSelectedId]   = useState(null);
  const prevCountRef = useRef(items.length);
  // eslint-disable-next-line
  const listRef = useRef(null);
  // eslint-disable-next-line
  const selectedItemRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages - 1);
  const startIndex = safePage * ITEMS_PER_PAGE;
  const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // При добавлении товара — переходим на последнюю страницу
  useEffect(() => {
    if (items.length > prevCountRef.current) {
      setCurrentPage(Math.max(0, Math.ceil(items.length / ITEMS_PER_PAGE) - 1));
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  // Если страница стала пустой — откатываемся
  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  // Снимаем выделение если выделенный элемент удалили
  useEffect(() => {
    if (selectedId && !items.find((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  const handleSelect = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
    setSelectedId(null);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
    setSelectedId(null);
  }, [totalPages]);

  // ─── Автоскролл при изменении selectedId ───
  useEffect(() => {
    if (!selectedId || !listRef.current) return;

    // Ищем DOM-элемент выделенной карточки
    const selectedElement = listRef.current.querySelector(
      `[data-item-id="${selectedId}"]`
    );
    
    if (!selectedElement) return;

    // Используем scrollIntoView с плавной прокруткой
    selectedElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest', // Прокручивает минимально необходимое расстояние
      inline: 'nearest',
    });
  }, [selectedId]);

  // ─── Обработчик клавиш Вверх/Вниз ───
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      e.preventDefault(); // Запрещаем скролл страницы

      const currentItems = visibleItems;
      
      if (currentItems.length === 0) return;

      const currentIndex = currentItems.findIndex(item => item.id === selectedId);
      let newIndex = currentIndex;

      if (e.key === 'ArrowUp') {
        newIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
      } else if (e.key === 'ArrowDown') {
        newIndex = currentIndex >= currentItems.length - 1 
          ? currentItems.length - 1 
          : currentIndex + 1;
      }

      // Если ничего не выделено — выделяем первый
      if (currentIndex === -1 && currentItems.length > 0) {
        handleSelect(currentItems[0].id);
        return;
      }

      // Если индекс изменился — выбираем новый элемент
      if (newIndex !== currentIndex && currentItems[newIndex]) {
        handleSelect(currentItems[newIndex].id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedId, visibleItems, handleSelect]);

  return (
    <div className="receipt-list-wrapper" ref={listRef}>
      {/*eslint-disable-next-line*/}
      <ul className="receipt-item-list" role="list" aria-label="Позиции чека">
        {visibleItems.map((item, idx) => (
          <ReceiptItem
            key={item.id}
            item={item}
            index={startIndex + idx}
            isSelected={selectedId === item.id}
            onSelect={handleSelect}
            onDelete={onDelete}
            onEditPrice={onEditPrice}
            onEditTitle={onEditTitle}
            onEditCategory={onEditCategory}
            readOnly={readOnly}
          />
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="receipt-pagination" aria-label="Навигация по страницам чека">
          <button
            type="button"
            className="pagination-btn"
            onClick={goToPrev}
            disabled={safePage === 0}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft size={18} strokeWidth={2.5} aria-hidden="true" />
            <span className="pagination-btn-label">Назад</span>
          </button>

          <div
            className="pagination-info"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>{safePage + 1}</strong>
            {' '}/{' '}
            {totalPages}
          </div>

          <button
            type="button"
            className="pagination-btn"
            onClick={goToNext}
            disabled={safePage >= totalPages - 1}
            aria-label="Следующая страница"
          >
            <span className="pagination-btn-label">Вперёд</span>
            <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}