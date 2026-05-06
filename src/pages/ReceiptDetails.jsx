import React, { useState } from 'react';
import { ChevronLeft, Trash2, AlertCircle, Pencil } from 'lucide-react';
import ReceiptItemList from '../components/ReceiptItemList';
import ReceiptTotal from '../components/ReceiptTotal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import './ReceiptDetails.css';

export default function ReceiptDetails({
  receiptId,
  receipts,
  onDeleteReceipt,
  onEditReceipt,
  onGoBack,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const receipt = receipts.find(r => r.id === receiptId);

  if (!receipt) {
    return (
      <div className="receipt-details">
        <button type="button" className="back-btn" onClick={onGoBack}>
          <ChevronLeft size={18} strokeWidth={2} />
          <span>Назад</span>
        </button>
        <EmptyState
          icon={AlertCircle}
          title="Чек не найден"
          subtitle="Возможно, он был удалён"
        />
      </div>
    );
  }

  const formattedDate = new Date(receipt.date + 'T00:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="receipt-details">
      <div className="details-header">
        <button type="button" className="back-btn" onClick={onGoBack}>
          <ChevronLeft size={18} strokeWidth={2} />
          <span>Назад</span>
        </button>
        <h1 className="page-title">Чек от {formattedDate}</h1>
      </div>

      <ReceiptItemList
          items={receipt.items}
          readOnly
          onDelete={function() {}}
          onEditPrice={function() {}}
          onEditCategory={function() {}}
      />

      <ReceiptTotal items={receipt.items} />

      <div className="details-actions">
        <button
          type="button"
          className="edit-receipt-btn"
          onClick={function() { setShowEditConfirm(true); }}
        >
          <Pencil size={18} strokeWidth={2} />
          <span>Редактировать</span>
        </button>

        <button
          type="button"
          className="delete-receipt-btn"
          onClick={function() { setShowDeleteConfirm(true); }}
        >
          <Trash2 size={18} strokeWidth={2} />
          <span>Удалить чек</span>
        </button>
      </div>

      {showEditConfirm && (
        <ConfirmDialog
          title="Редактировать чек?"
          message="Чек будет загружен как текущий для редактирования. Оригинал будет удалён из истории."
          confirmText="Редактировать"
          onConfirm={function() {
            setShowEditConfirm(false);
            onEditReceipt(receiptId);
          }}
          onCancel={function() { setShowEditConfirm(false); }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Удалить чек?"
          message="Чек будет удалён из истории безвозвратно."
          confirmText="Удалить"
          danger
          onConfirm={function() {
            setShowDeleteConfirm(false);
            onDeleteReceipt(receiptId);
            onGoBack();
          }}
          onCancel={function() { setShowDeleteConfirm(false); }}
        />
      )}
    </div>
  );
}