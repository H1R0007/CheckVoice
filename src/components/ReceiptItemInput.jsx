// src/components/ReceiptItemInput.jsx

import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import './ReceiptItemInput.css';

export default function ReceiptItemInput({ onAddItem }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const titleRef = useRef(null);

  const normalizedPrice = parseFloat(price.replace(',', '.'));
  const isValid =
    title.trim().length > 0 &&
    price.length > 0 &&
    !isNaN(normalizedPrice) &&
    normalizedPrice >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (typeof onAddItem !== 'function') {
      console.error('ReceiptItemInput: onAddItem is not a function', onAddItem);
      return;
    }

    const trimmedTitle = title.trim();
    const parsedPrice = parseFloat(price.replace(',', '.'));

    if (!trimmedTitle) return;
    if (isNaN(parsedPrice) || parsedPrice < 0) return;

    const capitalizedTitle =
      trimmedTitle.charAt(0).toUpperCase() + trimmedTitle.slice(1);

    onAddItem(capitalizedTitle, Math.round(parsedPrice * 100) / 100);

    setTitle('');
    setPrice('');
    titleRef.current?.focus();
  };

  return (
    <form className="receipt-item-input" onSubmit={handleSubmit}>
      <div className="input-row">
        <input
          ref={titleRef}
          className="input-title"
          type="text"
          placeholder="Название товара"
          aria-label="Название товара"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          autoCapitalize="sentences"
          autoCorrect="off"
        />

        <input
          className="input-price"
          type="text"
          inputMode="decimal"
          placeholder="Цена"
          aria-label="Цена"
          value={price}
          onChange={(e) => {
            const val = e.target.value;
            if (/^[\d]*[.,]?[\d]{0,2}$/.test(val) || val === '') {
              setPrice(val);
            }
          }}
          autoComplete="off"
          spellCheck={false}
        />

        <button
          className={'input-add-btn' + (isValid ? ' active' : '')}
          type="submit"
          disabled={!isValid}
          aria-label="Добавить позицию"
        >
          <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}