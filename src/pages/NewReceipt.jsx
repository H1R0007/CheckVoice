// src/pages/NewReceipt.jsx

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Trash2, Save, HelpCircle, X } from 'lucide-react';
import ReceiptItemList from '../components/ReceiptItemList';
import ReceiptTotal from '../components/ReceiptTotal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import VoiceIndicator from '../components/VoiceIndicator';
import SaveAnimation from '../components/SaveAnimation';
import CategoryReviewPrompt from '../components/CategoryReviewPrompt';
import './NewReceipt.css';

const HELP_SHOWN_KEY = 'cv_help_shown';

const HELP_SECTIONS = [
  {
    title: 'Добавить товар',
    items: [
      { example: 'Молоко 89 рублей', desc: 'название и цена' },
      { example: 'Хлеб 45', desc: 'можно без слова «рублей»' },
      { example: 'Хлеб', desc: 'можно сказать сначала продукт, попросит назвать цену' },
      { example: '100', desc: 'можно сказать сначала цену' },
      { example: 'Молоко 89 рублей 50 копеек', desc: 'с копейками' },
      { example: 'Добавь молоко 89', desc: 'с командой добавить' },
    ],
  },
  {
    title: 'Управление чеком',
    items: [
      { example: 'Удали молоко', desc: 'удалить конкретный товар' },
      { example: 'Удали первый пункт', desc: 'удалить по номеру' },
      { example: 'Отмени последнее', desc: 'отменить последнее добавление' },
      { example: 'Отмена', desc: 'если случайно распознало как продукт то, что им не является' },
      { example: 'Измени цену молокo на 95', desc: 'изменить цену(важно оставить то же самое окончание)' },
      { example: 'Очисти чек', desc: 'удалить все товары' },
      { example: 'Сохрани чек', desc: 'сохранить в историю' },
    ],
  },
  {
    title: 'Информация о чеке',
    items: [
      { example: 'Сколько итого?', desc: 'узнать сумму' },
      { example: 'Что в чеке?', desc: 'услышать все товары' },
    ],
  },
  {
    title: 'Навигация',
    items: [
      { example: 'Покажи историю', desc: 'открыть историю чеков' },
      { example: 'Покажи статистику', desc: 'открыть статистику' },
      { example: 'Открой последний чек', desc: 'последний сохранённый чек' },
      { example: 'Редактируй последний чек', desc: 'загрузить для правки' },
    ],
  },
  {
    title: 'Аналитика',
    items: [
      { example: 'Сколько потрачено на мясо?', desc: 'расходы по категории' },
      { example: 'Покажи статистику', desc: 'полный отчёт за период' },
    ],
  },
  {
    title: 'Данные',
    items: [
      { example: 'Экспортируй данные', desc: 'сохранить бэкап' },
      { example: 'Помощь', desc: 'показать это окно' },
    ],
  },
];

function HelpDialog({ onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="help-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Как пользоваться ЧекВойс"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-dialog-header">
          <div className="help-dialog-title">Как пользоваться</div>
          <button
            type="button"
            className="help-dialog-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="help-dialog-body">
          <p className="help-dialog-intro">
            Говорите название товара и цену — ЧекВойс запишет и посчитает.
            Ниже все голосовые команды.
          </p>

          {HELP_SECTIONS.map((section) => (
            <div key={section.title} className="help-section">
              <div className="help-section-title">{section.title}</div>
              <ul className="help-section-list">
                {section.items.map((item) => (
                  <li key={item.example} className="help-section-item">
                    <span className="help-example">{item.example}</span>
                    <span className="help-desc">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="help-dialog-tip">
            💡 После добавления товара ассистент продолжает слушать — можно
            диктовать следующий сразу. Чтобы отменить ввод — скажите
            «Отмена».
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewReceipt({
  items,
  onDeleteItem,
  onEditPrice,
  onEditCategory,
  onClearReceipt,
  onSaveReceipt,
  voiceStatus = 'idle',
  voiceText = '',
  showSaveAnimation: externalSaveAnimation = false,
  onSaveAnimationComplete,
  saveAnimationData,
  externalShowHelp = false,
  onHelpClose,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const [showHelp, setShowHelp] = useState(() => {
    try {
      return !localStorage.getItem(HELP_SHOWN_KEY);
    } catch {
      return false;
    }
  });

  // Открываем хелп по команде от ассистента
  useEffect(() => {
    if (externalShowHelp) {
      setShowHelp(true);
    }
  }, [externalShowHelp]);

  const handleCloseHelp = () => {
    setShowHelp(false);
    try {
      localStorage.setItem(HELP_SHOWN_KEY, '1');
    } catch {
      // ignore
    }
    if (onHelpClose) onHelpClose();
  };

  const handleOpenHelp = () => {
    setShowHelp(true);
  };

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasItems = items.length > 0;
  const total = items.reduce(function (s, i) { return s + i.price; }, 0);
  const totalRounded = Math.round(total * 100) / 100;

  return (
    <div className="new-receipt">
      <div className="page-header">
        <div className="page-header-left">
          <ShoppingCart size={22} strokeWidth={2} className="page-header-icon" />
          <div className="receipt-header-meta">
            <h1 className="page-title">Новый чек</h1>
            <span className="page-subtitle">{today}</span>
          </div>
        </div>

        {hasItems && (
          <div className="receipt-header-right">
            <div className="receipt-header-actions">
              <button
                type="button"
                className="receipt-action-icon receipt-action-icon--clear"
                onClick={function () { setShowClearConfirm(true); }}
                title="Очистить чек"
                aria-label="Очистить чек"
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="receipt-action-icon receipt-action-icon--save"
                onClick={function () { setShowSaveConfirm(true); }}
                title="Сохранить чек"
                aria-label="Сохранить чек"
              >
                <Save size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {hasItems && (
        <CategoryReviewPrompt
          items={items}
          onEditCategory={onEditCategory}
        />
      )}

      <div className="receipt-scroll-area">
        {hasItems ? (
          <ReceiptItemList
            items={items}
            onDelete={onDeleteItem}
            onEditPrice={onEditPrice}
            onEditCategory={onEditCategory}
          />
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Чек пуст"
            subtitle="Скажите название товара и цену, например: «молоко 89 рублей»"
          />
        )}
      </div>

      {hasItems && (
        <div className="receipt-floating-total">
          <ReceiptTotal items={items} />
        </div>
      )}

      {voiceStatus !== 'idle' && (
        <div className="receipt-voice-area">
          <VoiceIndicator status={voiceStatus} text={voiceText} />
        </div>
      )}

      <button
        type="button"
        className="receipt-help-btn"
        onClick={handleOpenHelp}
        aria-label="Как пользоваться"
        aria-expanded={showHelp}
      >
        <HelpCircle size={20} strokeWidth={2} />
      </button>

      {showHelp && <HelpDialog onClose={handleCloseHelp} />}

      {showClearConfirm && (
        <ConfirmDialog
          title="Очистить чек?"
          message="Все товары из текущего чека будут удалены."
          confirmText="Очистить"
          danger
          onConfirm={function () {
            onClearReceipt();
            setShowClearConfirm(false);
          }}
          onCancel={function () { setShowClearConfirm(false); }}
        />
      )}

      {showSaveConfirm && (
        <ConfirmDialog
          title="Сохранить чек?"
          message={
            'Чек с ' + items.length + ' позициями на ' + totalRounded + ' ₽ будет сохранён.'
          }
          confirmText="Сохранить"
          onConfirm={function () {
            setShowSaveConfirm(false);
            setShowSaveAnimation(true);
          }}
          onCancel={function () { setShowSaveConfirm(false); }}
        />
      )}

      {showSaveAnimation && !externalSaveAnimation && (
        <SaveAnimation
          total={totalRounded}
          itemCount={items.length}
          onComplete={function () {
            setShowSaveAnimation(false);
            onSaveReceipt();
          }}
        />
      )}

      {externalSaveAnimation && saveAnimationData && (
        <SaveAnimation
          total={saveAnimationData.total}
          itemCount={saveAnimationData.count}
          onComplete={onSaveAnimationComplete}
        />
      )}
    </div>
  );
}