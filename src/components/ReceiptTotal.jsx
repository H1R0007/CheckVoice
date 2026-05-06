// src/components/ReceiptTotal.jsx

import React from 'react';
import { formatPrice, formatPriceShort } from '../utils/formatPrice';
import './ReceiptTotal.css';

export default function ReceiptTotal({ items = [], compact = false }) {
  const safeItems = Array.isArray(items) ? items : [];

  const total = safeItems.reduce(function (sum, item) {
    const price = Number.isFinite(item?.price) ? item.price : 0;
    return sum + price;
  }, 0);

  const totalRounded = Math.round(total * 100) / 100;
  const count = safeItems.length;

  if (compact) {
    return (
      <div className="receipt-total receipt-total--compact">
        <div className="receipt-total-row">
          <span className="receipt-total-label">Итого:</span>
          <span className="receipt-total-amount" key={totalRounded}>
            {formatPriceShort(totalRounded)}
          </span>
        </div>

        <span className="receipt-total-divider" aria-hidden="true">
          ·
        </span>

        <span className="receipt-total-count">{count} поз.</span>
      </div>
    );
  }

  return (
    <div className="receipt-total">
      <div className="receipt-total-row">
        <span className="receipt-total-label">Итого:</span>
        <span className="receipt-total-amount" key={totalRounded}>
          {formatPrice(totalRounded)}
        </span>
      </div>

      <div className="receipt-total-count">
        {count} {count === 1 ? 'позиция' : count >= 2 && count <= 4 ? 'позиции' : 'позиций'}
      </div>
    </div>
  );
}