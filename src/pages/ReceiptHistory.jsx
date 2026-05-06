import React from 'react';
import { ClipboardList, Calendar, Clock, Archive } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import CategoryDot from '../components/CategoryDot';
import { formatPrice } from '../utils/formatPrice';
import './ReceiptHistory.css';

export default function ReceiptHistory({ receipts, onOpenReceipt }) {
  if (receipts.length === 0) {
    return (
      <div className="receipt-history">
        <div className="page-header">
          <div className="page-header-left">
            <ClipboardList size={24} strokeWidth={2} className="page-header-icon" />
            <h1 className="page-title">История чеков</h1>
          </div>
        </div>
        <EmptyState
          icon={ClipboardList}
          title="История пуста"
          subtitle="Сохраните первый чек, чтобы увидеть историю"
        />
      </div>
    );
  }

  const sortedReceipts = [...receipts].sort((a, b) => b.date.localeCompare(a.date));

  const groupedByDate = {};
  sortedReceipts.forEach((receipt) => {
    const dateKey = receipt.date;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(receipt);
  });

  const totalAll = receipts.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="receipt-history">
      <div className="page-header">
        <div className="page-header-left">
          <ClipboardList size={24} strokeWidth={2} className="page-header-icon" />
          <h1 className="page-title">История чеков</h1>
        </div>
        <span className="history-count">
          {receipts.length} {pluralizeReceipts(receipts.length)}
        </span>
      </div>

      {Object.entries(groupedByDate).map(([dateKey, dateReceipts]) => {
        const dateInfo = formatDateRussian(dateKey);
        const dayTotal = dateReceipts.reduce((sum, r) => sum + r.total, 0);

        return (
          <div key={dateKey} className="history-date-group">
            <div className="history-date-header">
              <div className="history-date-left">
                <DateIcon type={dateInfo.type} />
                <span className="history-date-label">{dateInfo.label}</span>
              </div>
              <span className="history-date-total">{formatPrice(dayTotal)}</span>
            </div>

            {dateReceipts.map((receipt) => (
              <HistoryCard
                key={receipt.id}
                receipt={receipt}
                onClick={() => onOpenReceipt(receipt.id)}
              />
            ))}
          </div>
        );
      })}

      <div className="history-grand-total">
        <span>Всего:</span>
        <span>{formatPrice(totalAll)}</span>
      </div>
    </div>
  );
}

function HistoryCard({ receipt, onClick }) {
  const items = receipt.items || [];
  const categoryKeys = [...new Set(items.map(item => item.category))];

  return (
    <button
      type="button"
      className="history-card"
      onClick={onClick}
      aria-label={`Открыть чек: ${items.length} позиций, сумма ${formatPrice(receipt.total)}`}
    >
      <div className="history-card-top">
        <span className="history-card-count">
          {items.length} {pluralizeItems(items.length)}
        </span>
        <span className="history-card-total">{formatPrice(receipt.total)}</span>
      </div>
      <div className="history-card-categories">
        {categoryKeys.slice(0, 8).map((key) => (
          <CategoryDot key={key} categoryKey={key} size={14} />
        ))}
        {categoryKeys.length > 8 && (
          <span className="history-card-cat-more">+{categoryKeys.length - 8}</span>
        )}
      </div>
    </button>
  );
}

function formatDateRussian(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateNoTime = new Date(date);
  dateNoTime.setHours(0, 0, 0, 0);

  if (dateNoTime.getTime() === today.getTime()) {
    return { label: 'Сегодня', type: 'today' };
  }

  if (dateNoTime.getTime() === yesterday.getTime()) {
    return { label: 'Вчера', type: 'yesterday' };
  }

  return {
    label: date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    type: 'older',
  };
}

function pluralizeReceipts(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return 'чек';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'чека';
  return 'чеков';
}

function pluralizeItems(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'позиция';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции';
  return 'позиций';
}

function DateIcon({ type }) {
  const icons = {
    today: Calendar,
    yesterday: Clock,
    older: Archive,
  };

  const IconComp = icons[type] || Archive;

  return (
    <div className={'history-date-icon history-date-icon--' + type}>
      <IconComp size={14} strokeWidth={2} />
    </div>
  );
}