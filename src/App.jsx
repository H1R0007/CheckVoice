// src/App.jsx

import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import './App.css';

import NewReceipt from './pages/NewReceipt';
import ReceiptHistory from './pages/ReceiptHistory';
import ReceiptDetails from './pages/ReceiptDetails';
import Statistics from './pages/Statistics';
import SettingsPage from './pages/SettingsPage';

import NavigationBar from './components/NavigationBar';
import Notification from './components/Notification';
import CategoryDebugPanel from './components/CategoryDebugPanel';

import { parseVoiceInput, extractPriceOnly, isCancelPhrase } from './utils/parseVoiceInput';
import {
  resolveItemCategory,
  applyCategoryCorrectionToLearning,
  getEmptyCategoryLearning,
  approvePatternCandidate,
  removeApprovedPattern,
} from './utils/categoryLearning';
import { resolveCategoryFromVoice } from './utils/categoryVoiceMap';
import {
  loadState,
  saveState,
  getStorageInfo,
  addItemToCurrentReceipt,
  removeItemFromCurrentReceipt,
  editItemPrice,
  editItemCategory,
  clearCurrentReceipt,
  saveCurrentReceipt,
  deleteSavedReceipt,
  getCategoryTotal,
  updateLastExportedAt,
  getReceiptsByPeriod,
} from './utils/storage';
import { exportToJSON, exportToCSV } from './utils/exportData';
import { importFromJSON, mergeImportedState } from './utils/importData';
import { CATEGORIES } from './constants/categories';
import { wordsToNumber } from './utils/wordsToNumber';

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: 'Запусти ' + (process.env.REACT_APP_SMARTAPP || ''),
      getState,
      nativePanel: {
        defaultText: 'Молоко 89 рублей',
        screenshotMode: false,
        tabIndex: -1,
      },
    });
  } else {
    return createAssistant({ getState });
  }
};

export class App extends React.Component {
  constructor(props) {
    super(props);

    const persistedState = loadState();

    this.state = {
      showHelpDialog: false,
      currentReceipt: persistedState.currentReceipt,
      savedReceipts: persistedState.savedReceipts,
      lastExportedAt: persistedState.lastExportedAt,
      categoryLearning: persistedState.categoryLearning || getEmptyCategoryLearning(),

      currentScreen: 'newReceipt',
      selectedReceiptId: null,
      selectedPeriod: 'month',

      pendingItem: null,
      notification: null,

      isSaving: false,
      storageInfo: getStorageInfo(),

      voiceStatus: 'idle',
      voiceText: '',

      currentTheme: localStorage.getItem('cv-theme') || 'light',

      showSaveAnimation: false,
      saveAnimationData: null,
    };

    this._lastActionTime = 0;
    this._lastActionType = '';

    this.assistant = initializeAssistant(() => this.getStateForAssistant());

    this.assistant.on('data', (event) => {
      try {
        if (event.type === 'character' || event.type === 'insets') return;
        const { action } = event;
        this.dispatchAssistantAction(action);
      } catch (e) {
        console.warn('assistant data handler error:', e);
      }
    });

    this.assistant.on('error', (event) => {
      if (event && event.message && event.message.includes('applicationId')) {
        console.warn('assistant: suppressed applicationId error');
        return;
      }
      console.error('assistant.on(error):', event);
    });

    this._originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (error && error.message && error.message.includes('applicationId')) {
        console.warn('Suppressed applicationId error from SDK');
        return true;
      }
      if (this._originalOnError) {
        return this._originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    this._originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (
        event.reason &&
        event.reason.message &&
        event.reason.message.includes('applicationId')
      ) {
        console.warn('Suppressed applicationId rejection from SDK');
        event.preventDefault();
        return;
      }
      if (this._originalUnhandledRejection) {
        this._originalUnhandledRejection(event);
      }
    };

    this.applyTheme(this.state.currentTheme);
    this.applyDeviceClass();
  }

  // ─────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentReceipt !== this.state.currentReceipt ||
      prevState.savedReceipts !== this.state.savedReceipts ||
      prevState.lastExportedAt !== this.state.lastExportedAt ||
      prevState.categoryLearning !== this.state.categoryLearning
    ) {
      this.persistState();
    }
  }

  persistState() {
    const { currentReceipt, savedReceipts, lastExportedAt, categoryLearning } = this.state;

    // eslint-disable-next-line no-unused-vars
    const {
      _editingReceiptId,
      _editingReceiptDate,
      _editingReceiptCreatedAt,
      ...cleanReceipt
    } = currentReceipt;

    const stateToSave = {
      version: 2,
      currentReceipt: cleanReceipt,
      savedReceipts,
      lastExportedAt,
      categoryLearning,
    };

    const result = saveState(stateToSave);

    if (result.success) {
      this.setState({ storageInfo: getStorageInfo() });
      if (result.warning) {
        this.showNotification('warning', result.message);
      }
    } else {
      this.showNotification('error', result.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Состояние для ассистента
  // ─────────────────────────────────────────────────────────────

  getStateForAssistant() {
    const currentItems = this.state.currentReceipt.items;
    const total = currentItems.reduce((sum, item) => sum + item.price, 0);
    const totalRounded = Math.round(total * 100) / 100;

    return {
      item_selector: {
        items: currentItems.map(({ id, title }, index) => ({
          number: index + 1,
          id,
          title,
        })),
        ignored_words: [
          'добавить', 'добавь', 'добавьте', 'записать', 'запиши', 'запишите',
          'внести', 'внеси', 'внесите', 'плюс',
          'удалить', 'удали', 'удалите',
          'очистить', 'очисти', 'очистите',
          'сохранить', 'сохрани', 'сохраните',
          'исправить', 'исправь', 'исправьте',
          'изменить', 'измени', 'измените',
          'поменять', 'поменяй', 'поменяйте',
          'показать', 'покажи', 'покажите',
          'открыть', 'открой', 'откройте',
          'история', 'статистика', 'настройки', 'чек',
          'сколько', 'итого', 'всего', 'сумма',
          'рублей', 'рубля', 'рубль', 'руб',
          'копеек', 'копейки', 'копейка', 'коп',
          'цена', 'цену', 'стоимость',
          'пожалуйста', 'спасибо',
        ],
      },
      current_screen: this.state.currentScreen,
      current_receipt_total: totalRounded,
      current_receipt_count: currentItems.length,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Диспетчер
  // ─────────────────────────────────────────────────────────────

  dispatchAssistantAction(action) {
    if (!action) return;

    const now = Date.now();
    const actionKey = action.type + '|' + (action.text || action.id || '');

    if (now - this._lastActionTime < 400 && actionKey === this._lastActionType) {
      return;
    }

    this._lastActionTime = now;
    this._lastActionType = actionKey;

    switch (action.type) {
      case 'add_item':            return this.handleAddItem(action);
      case 'delete_item':         return this.handleDeleteItem(action);
      case 'clear_receipt':       return this.handleClearReceipt();
      case 'save_receipt':        return this.handleSaveReceipt();
      case 'navigate':            return this.handleNavigate(action);
      case 'ask_total':           return this.handleAskTotal();
      case 'ask_category':        return this.handleAskCategory(action);
      case 'ask_period_total':    return this.handleAskPeriodTotal(action);
      case 'edit_price':          return this.handleEditPrice(action);
      case 'edit_price_by_name':  return this.handleEditPriceByName(action);
      case 'read_receipt':        return this.handleReadReceipt();
      case 'ask_item_price':      return this.handleAskItemPrice(action);
      case 'open_last_receipt':   return this.handleOpenLastReceipt();
      case 'edit_last_receipt':   return this.handleEditLastReceipt();
      case 'delete_last_receipt': return this.handleDeleteLastReceipt();
      case 'export_data':         return this.handleVoiceExport();
      case 'cancel_pending':      return this.handleCancelPending();
      case 'undo_last_item':      return this.handleUndoLastItem();
      case 'show_help':           return this.handleShowHelp();
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Голосовой ответ
  //
  // КАК РАБОТАЕТ ОЗВУЧКА В САЛЮТ:
  // 1. Сценарий сам озвучивает через $reactions.answer() —
  //    это происходит для всех команд где сценарий отвечает напрямую
  //    (навигация, сохранение и т.д.)
  //
  // 2. Для ответов которые формирует ПРИЛОЖЕНИЕ (итог, категории и т.д.)
  //    приложение вызывает sendVoiceEvent() — это отправляет событие
  //    обратно в сценарий, где event!: его ловит и озвучивает через
  //    $reactions.answer()
  //
  // 3. Данные передаются ПЛОСКО в parameters (не вложено в eventData):
  //    { action: { action_id: 'item_added', parameters: { title, price } } }
  //    В сценарии читается как:
  //    $context.request.rawRequest.payload.data.parameters.title
  // ─────────────────────────────────────────────────────────────

  /**
   * Отправляет событие в сценарий.
   * Данные передаются ПЛОСКО в parameters — именно так их читает сценарий.
   *
   * @param {string} eventName  - имя события (совпадает с event!: в .sc)
   * @param {object} data       - данные для сценария (title, price, count и т.д.)
   */
  sendVoiceEvent(eventName, data = {}) {
    console.log('=== sendVoiceEvent ===', eventName, JSON.stringify(data));
    try {
      this.assistant.sendData(
        {
          action: {
            action_id: eventName,
            parameters: data,   // ← ПЛОСКО, без обёртки eventData
          },
        },
        (response) => {
          if (response?.error) {
            console.warn('sendVoiceEvent error:', response.error);
          }
        }
      );
    } catch (e) {
      console.warn('sendVoiceEvent exception:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Вспомогательные методы
  // ─────────────────────────────────────────────────────────────

  extractPrice(text) {
    if (!text) return null;

    const parsedPrice = extractPriceOnly(text);
    if (parsedPrice !== null && parsedPrice !== undefined) return parsedPrice;

    const cleaned = text
      .trim()
      .toLowerCase()
      .replace(/рублей|рубля|рубль|руб/gi, '')
      .replace(/копеек|копейки|копейка|коп/gi, '')
      .replace(/стоит|цена|по|за/gi, '')
      .trim();

    if (!cleaned) return null;

    const num = parseFloat(cleaned.replace(',', '.'));
    if (!isNaN(num) && num >= 0) return Math.round(num * 100) / 100;

    const fromWords = wordsToNumber(cleaned);
    if (fromWords !== null && fromWords >= 0) return fromWords;

    return null;
  }

  addItemToReceipt(title, price) {
    const categoryMeta = resolveItemCategory(title, this.state.categoryLearning);
    const newState = addItemToCurrentReceipt(this.state, title, price, categoryMeta);
    this.setState(newState);
    this.showNotification('success', 'Добавлено: ' + title + ' — ' + price + ' ₽');
  }

  parseOrdinal(text) {
    if (!text) return null;
    const cleaned = text.toLowerCase().trim();

    const ordinals = {
      'первый': 1, 'первую': 1, 'первое': 1, 'первая': 1, '1': 1,
      'второй': 2, 'вторую': 2, 'второе': 2, 'вторая': 2, '2': 2,
      'третий': 3, 'третью': 3, 'третье': 3, 'третья': 3, '3': 3,
      'четвёртый': 4, 'четвертый': 4, 'четвёртую': 4, 'четвертую': 4, '4': 4,
      'пятый': 5, 'пятую': 5, 'пятое': 5, '5': 5,
      'шестой': 6, 'шестую': 6, '6': 6,
      'седьмой': 7, 'седьмую': 7, '7': 7,
      'восьмой': 8, 'восьмую': 8, '8': 8,
      'девятый': 9, 'девятую': 9, '9': 9,
      'десятый': 10, 'десятую': 10, '10': 10,
      'последний': -1, 'последнюю': -1, 'последнее': -1,
    };

    const words = cleaned.split(/\s+/);
    for (const word of words) {
      if (ordinals[word] !== undefined) {
        const val = ordinals[word];
        if (val === -1) return this.state.currentReceipt.items.length;
        return val;
      }
    }

    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0) return num;

    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // Обработчики голосовых команд
  // ─────────────────────────────────────────────────────────────

  handleAddItem(action) {
    const rawText = action.text || '';

    if (isCancelPhrase(rawText)) {
      this.handleCancelPending();
      return;
    }

    this.showVoiceStatus('processing', rawText);

    const parsed = parseVoiceInput(rawText);

    // ── Незавершённый ввод (ждём уточнения) ──
    if (this.state.pendingItem) {
      const pending = this.state.pendingItem;

      // Ждём цену для уже известного товара
      if (pending.title && !pending.price) {
        const priceFromText = this.extractPrice(rawText);

        if (priceFromText !== null) {
          this.addItemToReceipt(pending.title, priceFromText);
          this.setState({ pendingItem: null });
          this.showVoiceStatus('success', pending.title + ' — ' + priceFromText + ' ₽');
          this.sendVoiceEvent('item_added', {
            title: pending.title,
            price: priceFromText,
          });
          return;
        }

        // Может пользователь сказал полную фразу заново
        if (parsed.title && parsed.price !== null) {
          this.setState({ pendingItem: null });
          this.addItemToReceipt(parsed.title, parsed.price);
          this.showVoiceStatus('success', parsed.title + ' — ' + parsed.price + ' ₽');
          this.sendVoiceEvent('item_added', {
            title: parsed.title,
            price: parsed.price,
          });
          return;
        }

        this.showVoiceStatus('error', 'Назовите цену');
        this.sendVoiceEvent('parse_error', {
          text: 'Не расслышал цену. Сколько стоит ' + pending.title + '?',
        });
        return;
      }

      // Ждём название для уже известной цены
      if (pending.price && !pending.title) {
        if (parsed.title) {
          this.addItemToReceipt(parsed.title, pending.price);
          this.setState({ pendingItem: null });
          this.showVoiceStatus('success', parsed.title + ' — ' + pending.price + ' ₽');
          this.sendVoiceEvent('item_added', {
            title: parsed.title,
            price: pending.price,
          });
          return;
        }

        this.showVoiceStatus('error', 'Назовите товар');
        this.sendVoiceEvent('parse_error', {
          text: 'Не понял название. Что стоит ' + pending.price + ' рублей?',
        });
        return;
      }
    }

    // ── Обычный ввод ──
    if (parsed.title && parsed.price !== null) {
      // Всё распознано — добавляем
      this.addItemToReceipt(parsed.title, parsed.price);
      this.setState({ pendingItem: null });
      this.showVoiceStatus('success', parsed.title + ' — ' + parsed.price + ' ₽');
      this.sendVoiceEvent('item_added', {
        title: parsed.title,
        price: parsed.price,
      });
    } else if (parsed.title && parsed.price === null) {
      // Есть название, нет цены — спрашиваем цену
      this.setState({ pendingItem: { title: parsed.title, price: null } });
      this.showVoiceStatus('listening', parsed.title + ' — цена?');
      this.showNotification('warning', 'Какая цена у "' + parsed.title + '"?');
      this.sendVoiceEvent('parse_error', {
        text: 'А сколько стоит ' + parsed.title + '?',
      });
    } else if (!parsed.title && parsed.price !== null) {
      // Есть цена, нет названия — спрашиваем название
      this.setState({ pendingItem: { title: null, price: parsed.price } });
      this.showVoiceStatus('listening', parsed.price + ' ₽ — что?');
      this.showNotification('warning', 'Что стоит ' + parsed.price + ' ₽?');
      this.sendVoiceEvent('parse_error', {
        text: parsed.price + ' рублей — а что именно?',
      });
    } else {
      // Ничего не распознано
      this.showVoiceStatus('error', 'Не удалось распознать');
      this.showNotification('error', 'Скажите товар и цену');
      this.sendVoiceEvent('parse_error', {
        text: 'Не расслышал. Попробуйте: молоко 89 рублей.',
      });
    }
  }

  handleDeleteItem(action) {
    const items = this.state.currentReceipt.items;
    let itemToDelete = null;

    // Поиск по id
    if (action.id) {
      itemToDelete = items.find((item) => item.id === action.id);
    }

    // Поиск по тексту (название)
    if (!itemToDelete && action.id) {
      const searchText = action.id.toLowerCase().trim();
      itemToDelete =
        items.find((item) => item.title.toLowerCase() === searchText) ||
        items.find((item) => item.title.toLowerCase().includes(searchText)) ||
        items.find((item) => searchText.includes(item.title.toLowerCase()));
    }

    // Поиск по порядковому номеру
    if (!itemToDelete && action.id) {
      const num = this.parseOrdinal(action.id);
      if (num !== null && num >= 1 && num <= items.length) {
        itemToDelete = items[num - 1];
      }
    }

    if (!itemToDelete) {
      this.showNotification('error', 'Товар не найден');
      this.showVoiceStatus('error', 'Не найден');
      this.sendVoiceEvent('item_not_found', {});
      return;
    }

    const newState = removeItemFromCurrentReceipt(this.state, itemToDelete.id);
    this.setState(newState);
    this.showNotification('success', 'Удалено: ' + itemToDelete.title);
    this.showVoiceStatus('success', 'Удалено');
    this.sendVoiceEvent('item_deleted', { title: itemToDelete.title });
  }

  handleClearReceipt() {
    const count = this.state.currentReceipt.items.length;

    if (count === 0) {
      this.sendVoiceEvent('receipt_empty', { text: 'Чек и так пуст.' });
      return;
    }

    const newState = clearCurrentReceipt(this.state);
    this.setState(newState);
    this.showNotification('success', 'Чек очищен');
    this.showVoiceStatus('success', 'Очищено');
    this.sendVoiceEvent('receipt_cleared', { count });
  }

  handleSaveReceipt() {
    if (this.state.currentReceipt.items.length === 0) {
      this.sendVoiceEvent('receipt_empty', { text: 'Нечего сохранять, чек пустой.' });
      return;
    }

    const total = this.state.currentReceipt.items.reduce((s, i) => s + i.price, 0);
    const totalRounded = Math.round(total * 100) / 100;
    const count = this.state.currentReceipt.items.length;

    this.setState({
      showSaveAnimation: true,
      saveAnimationData: { total: totalRounded, count },
    });
    // Озвучка произойдёт в handleSaveAnimationComplete после реального сохранения
  }

  handleCancelPending() {
    if (this.state.pendingItem) {
      this.setState({ pendingItem: null });
      this.showVoiceStatus('idle');
      this.showNotification('success', 'Ввод отменён');
      // НЕ шлём sendVoiceEvent — сценарий cancel.sc уже сам ответил "Отменил."
    } else {
      // Сценарий уже ответил через cancel.sc, ничего не делаем
    }
  }

  handleUndoLastItem() {
    const items = this.state.currentReceipt.items;

    if (items.length === 0) {
      this.sendVoiceEvent('receipt_empty', { text: 'Чек пустой, нечего отменять.' });
      return;
    }

    const lastItem = items[items.length - 1];
    const newState = removeItemFromCurrentReceipt(this.state, lastItem.id);
    this.setState(newState);

    this.showNotification('success', 'Удалено: ' + lastItem.title);
    this.showVoiceStatus('success', 'Отменено');
    this.sendVoiceEvent('item_deleted', { title: lastItem.title });
  }

  handleNavigate(action) {
    if (!action.screen) return;
    this.setState({ currentScreen: action.screen });
    // Сценарий уже озвучил переход через $reactions.answer() в navigate.sc
    // Здесь только обновляем UI
    this.showVoiceStatus('success', action.screen);
  }

  handleAskTotal() {
    const items = this.state.currentReceipt.items;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const totalRounded = Math.round(total * 100) / 100;
    const count = items.length;

    this.showNotification('success', 'Итого: ' + totalRounded + ' ₽');
    this.showVoiceStatus('success', 'Итого: ' + totalRounded + ' ₽');

    // Отправляем событие — сценарий озвучит через ИтогоЧека / ЧекПуст
    this.sendVoiceEvent('receipt_total', { total: totalRounded, count });
  }

  handleAskPeriodTotal(action) {
    const period = action.period || 'all';
    const periodReceipts = getReceiptsByPeriod(
      { savedReceipts: this.state.savedReceipts },
      period
    );

    const periodLabels = {
      week: 'за неделю',
      month: 'за месяц',
      all: 'за всё время',
    };
    const label = periodLabels[period] || 'за всё время';

    if (periodReceipts.length === 0) {
      this.sendVoiceEvent('period_total', { total: 0, period: label, count: 0 });
      return;
    }

    const total = periodReceipts.reduce((s, r) => s + r.total, 0);
    const totalRounded = Math.round(total * 100) / 100;
    const count = periodReceipts.length;

    this.showNotification('success', label + ': ' + totalRounded + ' ₽');
    this.sendVoiceEvent('period_total', {
      total: totalRounded,
      period: label,
      count,
    });
  }

  handleAskCategory(action) {
    const categoryKey = resolveCategoryFromVoice(action.categoryText);

    if (!categoryKey) {
      this.showNotification('warning', 'Категория не найдена');
      this.sendVoiceEvent('parse_error', {
        text: 'Не нашёл такую категорию. Попробуйте сказать по-другому.',
      });
      return;
    }

    const categoryInfo = CATEGORIES.find((c) => c.key === categoryKey);
    const name = categoryInfo ? categoryInfo.name : action.categoryText;

    // period приходит из action — это то что передал сценарий (week/month/all)
    const period = action.period || 'all';

    const periodReceipts = getReceiptsByPeriod(
      { savedReceipts: this.state.savedReceipts },
      period
    );
    const { total, count } = getCategoryTotal(periodReceipts, categoryKey);

    const periodLabels = { week: ' за неделю', month: ' за месяц', all: '' };
    const periodLabel = periodLabels[period] || '';

    this.showNotification('success', name + periodLabel + ': ' + total + ' ₽');

    let text;
    if (count === 0) {
      text = 'На ' + name + periodLabel + ' пока ничего не потрачено.';
    } else if (count === 1) {
      text = 'На ' + name + periodLabel + ' одна покупка на ' + total + ' рублей.';
    } else {
      text =
        'На ' + name + periodLabel + ' потрачено ' + total + ' рублей, ' + count + ' покупок.';
    }

    this.sendVoiceEvent('category_answer', { text });
  }

  handleEditPrice(action) {
    if (!action.id || action.newPrice === null || action.newPrice === undefined) {
      this.sendVoiceEvent('parse_error', { text: 'Не понял, какую цену поменять.' });
      return;
    }

    const item = this.state.currentReceipt.items.find((i) => i.id === action.id);
    const newState = editItemPrice(this.state, action.id, action.newPrice);
    this.setState(newState);

    const name = item ? item.title : 'Товар';
    this.showNotification('success', name + ': ' + action.newPrice + ' ₽');
    this.showVoiceStatus('success', 'Цена изменена');
    this.sendVoiceEvent('price_edited', { title: name, newPrice: action.newPrice });
  }

  handleEditPriceByName(action) {
    const text = (action.text || '').toLowerCase().trim();
    if (!text) {
      this.sendVoiceEvent('parse_error', { text: 'Не понял, что изменить.' });
      return;
    }

    const items = this.state.currentReceipt.items;
    const parsed = parseVoiceInput(text);
    let newPrice = parsed.price;
    const itemName = parsed.title;

    if (newPrice === null) {
      newPrice = this.extractPrice(text);
    }

    if (newPrice === null) {
      this.sendVoiceEvent('parse_error', {
        text: 'Не расслышал новую цену. Скажите, например: измени цену молока на 95.',
      });
      return;
    }

    let itemToEdit = null;

    if (itemName) {
      const search = itemName.toLowerCase();
      itemToEdit =
        items.find((i) => i.title.toLowerCase() === search) ||
        items.find((i) => i.title.toLowerCase().includes(search)) ||
        items.find((i) => search.includes(i.title.toLowerCase()));
    }

    if (!itemToEdit) {
      const wordsInText = text
        .replace(/\d+/g, '')
        .replace(
          /рублей|рубля|руб|копеек|копейки|копейка|коп|на|за|по|цену|цена|измени|поменяй|исправь|стоит/gi,
          ''
        )
        .trim();

      if (wordsInText) {
        const searchAlt = wordsInText.toLowerCase();
        itemToEdit =
          items.find((i) => i.title.toLowerCase().includes(searchAlt)) ||
          items.find((i) => searchAlt.includes(i.title.toLowerCase()));
      }
    }

    if (!itemToEdit) {
      this.sendVoiceEvent('item_not_found', {});
      this.showVoiceStatus('error', 'Товар не найден');
      return;
    }

    const oldPrice = itemToEdit.price;
    const newState = editItemPrice(this.state, itemToEdit.id, newPrice);
    this.setState(newState);

    this.showNotification(
      'success',
      itemToEdit.title + ': ' + oldPrice + ' → ' + newPrice + ' ₽'
    );
    this.showVoiceStatus('success', 'Цена изменена');
    this.sendVoiceEvent('price_edited', {
      title: itemToEdit.title,
      newPrice,
    });
  }

  handleReadReceipt() {
    const items = this.state.currentReceipt.items;

    if (items.length === 0) {
      this.sendVoiceEvent('receipt_empty', { text: 'Чек пустой, нечего читать.' });
      return;
    }

    const total = items.reduce((sum, item) => sum + item.price, 0);
    const totalRounded = Math.round(total * 100) / 100;

    this.sendVoiceEvent('receipt_read', {
      items: items.map((i) => ({ title: i.title, price: i.price })),
      total: totalRounded,
    });
  }

  handleAskItemPrice(action) {
    const itemName = (action.itemName || '').toLowerCase().trim();

    if (!itemName) {
      this.sendVoiceEvent('parse_error', { text: 'Скажите название товара.' });
      return;
    }

    const items = this.state.currentReceipt.items;

    const found =
      items.find((i) => i.title.toLowerCase() === itemName) ||
      items.find((i) => i.title.toLowerCase().includes(itemName)) ||
      items.find((i) => itemName.includes(i.title.toLowerCase()));

    if (!found) {
      this.sendVoiceEvent('item_price_in_receipt', { title: itemName, price: 0 });
      return;
    }

    this.showNotification('success', found.title + ': ' + found.price + ' ₽');
    this.sendVoiceEvent('item_price_in_receipt', {
      title: found.title,
      price: found.price,
    });
  }

  handleOpenLastReceipt() {
    const receipts = this.state.savedReceipts;
    if (receipts.length === 0) {
      this.sendVoiceEvent('receipt_empty', {
        text: 'В истории нет сохранённых чеков.',
      });
      return;
    }

    const last = receipts[0];
    this.setState({ currentScreen: 'details', selectedReceiptId: last.id });

    const dateStr = new Date(last.date + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });

    // Шлём receipt_total — сценарий озвучит "В чеке N позиций на X рублей."
    this.sendVoiceEvent('receipt_total', {
      total: last.total,
      count: last.items.length,
    });

    this.showNotification('success', 'Чек от ' + dateStr);
  }

  handleEditLastReceipt() {
    const receipts = this.state.savedReceipts;
    if (receipts.length === 0) {
      this.sendVoiceEvent('receipt_empty', {
        text: 'В истории нет чеков для редактирования.',
      });
      return;
    }
    this.handleEditReceipt(receipts[0].id);
  }

  handleDeleteLastReceipt() {
    const receipts = this.state.savedReceipts;
    if (receipts.length === 0) {
      this.sendVoiceEvent('receipt_empty', { text: 'В истории нет чеков.' });
      return;
    }

    const last = receipts[0];
    const newState = deleteSavedReceipt(this.state, last.id);
    this.setState(newState);

    this.showNotification('success', 'Чек удалён из истории');
    this.sendVoiceEvent('item_deleted', {
      title: 'Чек на ' + last.total + ' рублей',
    });
  }

  handleVoiceExport() {
    const result = exportToJSON(this.state);
    if (result.success) {
      const newState = updateLastExportedAt(this.state);
      this.setState(newState);
      this.showNotification('success', 'Экспортировано в ' + result.filename);
    } else {
      this.sendVoiceEvent('parse_error', { text: 'Не удалось экспортировать данные.' });
    }
  }

  handleShowHelp() {
    this.setState({ currentScreen: 'newReceipt', showHelpDialog: true });
    // Сценарий уже озвучил через help.sc → $reactions.answer()
  }

  // ─────────────────────────────────────────────────────────────
  // UI / ручные обработчики
  // ─────────────────────────────────────────────────────────────

  applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  handleChangeTheme = (theme) => {
    this.setState({ currentTheme: theme });
    this.applyTheme(theme);
    localStorage.setItem('cv-theme', theme);
  };

  handleAddItemManual = (title, price) => {
    this.addItemToReceipt(title, price);
  };

  handleDeleteItemManual = (itemId) => {
    const newState = removeItemFromCurrentReceipt(this.state, itemId);
    this.setState(newState);
  };

  handleEditPriceManual = (itemId, newPrice) => {
    const newState = editItemPrice(this.state, itemId, newPrice);
    this.setState(newState);
  };

  handleEditTitleManual = (itemId, newTitle) => {
    this.setState((prevState) => ({
      currentReceipt: {
        ...prevState.currentReceipt,
        items: prevState.currentReceipt.items.map((item) =>
          item.id === itemId
            ? { ...item, title: newTitle }
            : item
        ),
      },
    }));
  };

  handleEditCategoryManual = (itemId, newCategory) => {
    const item = this.state.currentReceipt.items.find((i) => i.id === itemId);
    if (!item) return;

    let nextState = editItemCategory(this.state, itemId, newCategory);
    nextState = {
      ...nextState,
      categoryLearning: applyCategoryCorrectionToLearning(
        nextState.categoryLearning,
        item,
        newCategory
      ),
    };

    this.setState(nextState);
    this.showNotification('success', 'Категория изменена');
  };

  handleApprovePattern = (candidate) => {
    this.setState((prevState) => ({
      categoryLearning: approvePatternCandidate(prevState.categoryLearning, candidate),
    }));
    this.showNotification('success', 'Паттерн подтверждён');
  };

  handleRemoveApprovedPattern = (patternId) => {
    this.setState((prevState) => ({
      categoryLearning: removeApprovedPattern(prevState.categoryLearning, patternId),
    }));
    this.showNotification('success', 'Паттерн удалён');
  };

  handleResetCategoryLearning = () => {
    this.setState({ categoryLearning: getEmptyCategoryLearning() });
    this.showNotification('success', 'Обучение категорий сброшено');
  };

  handleClearReceiptManual = () => {
    const newState = clearCurrentReceipt(this.state);
    this.setState(newState);
  };

  handleSaveReceiptManual = () => {
    const { state: newState } = saveCurrentReceipt(this.state);
    this.setState(newState);
  };

  handleDeleteSavedReceipt = (receiptId) => {
    const newState = deleteSavedReceipt(this.state, receiptId);
    this.setState(newState);
    this.showNotification('success', 'Чек удалён из истории');
  };

  handleNavigateManual = (screen, receiptId = null) => {
    this.setState({ currentScreen: screen, selectedReceiptId: receiptId });
  };

  handleChangePeriod = (period) => {
    this.setState({ selectedPeriod: period });
  };

  handleExportJSON = () => {
    const result = exportToJSON(this.state);
    if (result.success) {
      const newState = updateLastExportedAt(this.state);
      this.setState(newState);
      this.showNotification('success', `Экспортировано в ${result.filename}`);
    }
  };

  handleExportCSV = () => {
    const result = exportToCSV(this.state);
    if (result.success) {
      const newState = updateLastExportedAt(this.state);
      this.setState(newState);
      this.showNotification('success', `Экспортировано в ${result.filename}`);
    }
  };

  handleImportJSON = async (file, mode = 'replace') => {
    const result = await importFromJSON(file);

    if (result.success) {
      const mergedState = mergeImportedState(this.state, result.state, mode);
      this.setState(mergedState);
      this.showNotification(
        'success',
        `Импортировано: ${result.stats.receiptsImported} чеков, ${result.stats.itemsImported} товаров`
      );
    } else {
      this.showNotification('error', result.message);
    }
  };

  handleClearAllData = () => {
    this.setState({
      currentReceipt: { items: [] },
      savedReceipts: [],
      lastExportedAt: null,
      categoryLearning: getEmptyCategoryLearning(),
    });
    this.showNotification('success', 'Все данные удалены');
  };

  handleEditReceipt = (receiptId) => {
    const receipt = this.state.savedReceipts.find((r) => r.id === receiptId);
    if (!receipt) return;

    const newState = {
      ...this.state,
      currentReceipt: {
        items: [...receipt.items],
        _editingReceiptId: receipt.id,
        _editingReceiptDate: receipt.date,
        _editingReceiptCreatedAt: receipt.createdAt,
      },
      savedReceipts: this.state.savedReceipts.filter((r) => r.id !== receiptId),
      currentScreen: 'newReceipt',
      selectedReceiptId: null,
    };

    this.setState(newState);
    this.showNotification('success', 'Чек загружен для редактирования');
  };

  handleSaveAnimationComplete = () => {
    const { state: newState, receipt } = saveCurrentReceipt(this.state);

    this.setState({
      ...newState,
      showSaveAnimation: false,
      saveAnimationData: null,
    });

    if (receipt) {
      this.showVoiceStatus('success', 'Сохранено');
      this.showNotification('success', 'Чек сохранён');
      // Теперь отправляем событие озвучки — сценарий скажет "Чек сохранён. N позиций на X рублей."
      this.sendVoiceEvent('receipt_saved', {
        count: receipt.items.length,
        total: receipt.total,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UI helpers
  // ─────────────────────────────────────────────────────────────

  showNotification(type, message) {
    this.setState({ notification: { type, message } });
    setTimeout(() => {
      this.setState({ notification: null });
    }, 3000);
  }

  showVoiceStatus(status, text = '') {
    this.setState({ voiceStatus: status, voiceText: text });

    if (status === 'success' || status === 'error') {
      setTimeout(() => {
        this.setState({ voiceStatus: 'idle', voiceText: '' });
      }, 2000);
    }
  }

  applyDeviceClass() {
    const ua = navigator.userAgent.toLowerCase();
    const isTV =
      ua.includes('smarttv') ||
      ua.includes('smart-tv') ||
      ua.includes('googletv') ||
      ua.includes('android tv') ||
      ua.includes('webos') ||
      ua.includes('tizen') ||
      ua.includes('hbbtv') ||
      ua.includes('sberbox') ||
      ua.includes('sbertv') ||
      ua.includes('sberdevice') ||
      ua.includes('netcast') ||
      ua.includes('viera') ||
      ua.includes('philips') ||
      ua.includes('roku') ||
      (window.screen &&
        window.screen.width >= 1280 &&
        !('ontouchstart' in window) &&
        navigator.maxTouchPoints === 0 &&
        window.devicePixelRatio === 1);

    if (isTV) {
      document.documentElement.classList.add('is-tv-device');
    } else {
      document.documentElement.classList.remove('is-tv-device');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  render() {
    const {
      currentScreen,
      currentReceipt,
      savedReceipts,
      selectedReceiptId,
      selectedPeriod,
      notification,
      storageInfo,
      categoryLearning,
    } = this.state;

    const isDev = process.env.NODE_ENV === 'development';

    return (
      <div className="app">
        <NavigationBar
          currentScreen={currentScreen}
          onNavigate={this.handleNavigateManual}
        />

        <main className="app-content">
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => this.setState({ notification: null })}
            />
          )}

          {currentScreen === 'newReceipt' && (
            <>
              <NewReceipt
                items={currentReceipt.items}
                onDeleteItem={this.handleDeleteItemManual}
                onEditPrice={this.handleEditPriceManual}
                onEditTitle={this.handleEditTitleManual}
                onEditCategory={this.handleEditCategoryManual}
                onClearReceipt={this.handleClearReceiptManual}
                onSaveReceipt={this.handleSaveReceiptManual}
                voiceStatus={this.state.voiceStatus}
                voiceText={this.state.voiceText}
                showSaveAnimation={this.state.showSaveAnimation}
                onSaveAnimationComplete={this.handleSaveAnimationComplete}
                saveAnimationData={this.state.saveAnimationData}
                externalShowHelp={this.state.showHelpDialog}
                onHelpClose={() => this.setState({ showHelpDialog: false })}
              />

              {isDev && (
                <CategoryDebugPanel
                  items={currentReceipt.items}
                  categoryLearning={categoryLearning}
                  onApprovePattern={this.handleApprovePattern}
                  onRemoveApprovedPattern={this.handleRemoveApprovedPattern}
                />
              )}
            </>
          )}

          {currentScreen === 'history' && (
            <ReceiptHistory
              receipts={savedReceipts}
              onOpenReceipt={(id) => this.handleNavigateManual('details', id)}
            />
          )}

          {currentScreen === 'details' && selectedReceiptId && (
            <ReceiptDetails
              receiptId={selectedReceiptId}
              receipts={savedReceipts}
              onDeleteReceipt={this.handleDeleteSavedReceipt}
              onEditReceipt={this.handleEditReceipt}
              onGoBack={() => this.handleNavigateManual('history')}
            />
          )}

          {currentScreen === 'statistics' && (
            <Statistics
              receipts={savedReceipts}
              selectedPeriod={selectedPeriod}
              onChangePeriod={this.handleChangePeriod}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsPage
              storageInfo={storageInfo}
              lastExportedAt={this.state.lastExportedAt}
              currentTheme={this.state.currentTheme}
              onChangeTheme={this.handleChangeTheme}
              onExportJSON={this.handleExportJSON}
              onExportCSV={this.handleExportCSV}
              onImportJSON={this.handleImportJSON}
              onClearAllData={this.handleClearAllData}
              categoryLearning={categoryLearning}
              onResetCategoryLearning={this.handleResetCategoryLearning}
            />
          )}
        </main>
      </div>
    );
  }
}