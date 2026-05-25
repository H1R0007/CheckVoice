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
  const listRef      = useRef(null);
  const prevBtnRef   = useRef(null);
  const nextBtnRef   = useRef(null);

  const totalPages   = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage     = Math.min(currentPage, totalPages - 1);
  const startIndex   = safePage * ITEMS_PER_PAGE;
  const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const isFirstPage = safePage === 0;
  const isLastPage  = safePage >= totalPages - 1;

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

  // ─── Автоскролл scroll-area к кнопкам пагинации при фокусе ───
  useEffect(() => {
    const prevBtn = prevBtnRef.current;
    const nextBtn = nextBtnRef.current;
    if (!prevBtn || !nextBtn) return;

    function scrollBtnIntoView(btn) {
      let parent = btn.parentElement;
      while (parent) {
        const overflow = window.getComputedStyle(parent).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') {
          const btnRect    = btn.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          const isBelow    = btnRect.bottom > parentRect.bottom;
          const isAbove    = btnRect.top < parentRect.top;
          if (isBelow || isAbove) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return;
        }
        parent = parent.parentElement;
      }
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function onPrevFocus() { scrollBtnIntoView(prevBtn); }
    function onNextFocus() { scrollBtnIntoView(nextBtn); }

    prevBtn.addEventListener('focus', onPrevFocus);
    nextBtn.addEventListener('focus', onNextFocus);

    return () => {
      prevBtn.removeEventListener('focus', onPrevFocus);
      nextBtn.removeEventListener('focus', onNextFocus);
    };
  }, [totalPages]);

  // ─── Автоскролл списка при изменении selectedId ───
  useEffect(() => {
    if (!selectedId || !listRef.current) return;

    const selectedElement = listRef.current.querySelector(
      `[data-item-id="${selectedId}"]`
    );
    if (!selectedElement) return;

    selectedElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [selectedId]);

  // ─── Обработчик клавиш ───
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      const focused = document.activeElement;
      const isOnPrevBtn = focused === prevBtnRef.current;
      const isOnNextBtn = focused === nextBtnRef.current;
      const isOnPagination = isOnPrevBtn || isOnNextBtn;

      // ── Навигация КОГДА фокус на кнопках пагинации ──
      if (isOnPagination) {
        // ArrowLeft/ArrowRight — переключаемся между кнопками «Назад» и «Вперёд»
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          if (isOnNextBtn && prevBtnRef.current && !isFirstPage) {
            prevBtnRef.current.focus();
          } else if (isOnPrevBtn && nextBtnRef.current && !isLastPage) {
            nextBtnRef.current.focus();
          }
          return;
        }

        // ArrowUp — уходим с кнопок обратно в список (последний элемент)
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (visibleItems.length > 0) {
            const lastItem = visibleItems[visibleItems.length - 1];
            handleSelect(lastItem.id);
            // Убираем фокус с кнопки — фокус уйдёт на карточку через highlight
            focused.blur();
          }
          return;
        }

        // ArrowDown — уходим с кнопок обратно в список (первый элемент)
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (visibleItems.length > 0) {
            handleSelect(visibleItems[0].id);
            focused.blur();
          }
          return;
        }

        // Остальные клавиши на кнопках пагинации — не трогаем
        // (Enter/Space сработают нативно и вызовут onClick)
        return;
      }

      // ── Навигация по списку ──
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      // Если фокус внутри инпута — не мешаем
      if (
        focused &&
        (focused.tagName === 'INPUT'    ||
         focused.tagName === 'TEXTAREA' ||
         focused.tagName === 'SELECT')
      ) {
        return;
      }

      e.preventDefault();

      if (visibleItems.length === 0) return;

      const currentIndex = visibleItems.findIndex((item) => item.id === selectedId);

      // Ничего не выделено — выделяем первый элемент
      if (currentIndex === -1) {
        handleSelect(visibleItems[0].id);
        return;
      }

      if (e.key === 'ArrowDown') {
        const isLastOnPage = currentIndex >= visibleItems.length - 1;

        if (isLastOnPage) {
          // Последний элемент на странице — идём на кнопки пагинации
          // Выбираем активную кнопку: если есть следующая страница → «Вперёд»,
          // иначе (последняя страница) → «Назад»
          setSelectedId(null);
          if (!isLastPage && nextBtnRef.current) {
            nextBtnRef.current.focus();
          } else if (!isFirstPage && prevBtnRef.current) {
            prevBtnRef.current.focus();
          }
        } else {
          handleSelect(visibleItems[currentIndex + 1].id);
        }
      }

      if (e.key === 'ArrowUp') {
        const isFirstOnPage = currentIndex === 0;

        if (isFirstOnPage) {
          // Первый элемент на странице — идём на кнопки пагинации
          // Выбираем активную кнопку: если есть предыдущая страница → «Назад»,
          // иначе (первая страница) → «Вперёд»
          setSelectedId(null);
          if (!isFirstPage && prevBtnRef.current) {
            prevBtnRef.current.focus();
          } else if (!isLastPage && nextBtnRef.current) {
            nextBtnRef.current.focus();
          }
        } else {
          handleSelect(visibleItems[currentIndex - 1].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isActive,
    selectedId,
    visibleItems,
    handleSelect,
    safePage,
    totalPages,
    isFirstPage,
    isLastPage,
  ]);

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
            ref={prevBtnRef}
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
            ref={nextBtnRef}
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