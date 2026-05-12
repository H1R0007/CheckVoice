// src/pages/SettingsPage.jsx

import React, { useState } from 'react';
import { Settings, FileText, FileJson, Download, Trash2, Brain, Tv } from 'lucide-react';
import StorageIndicator from '../components/StorageIndicator';
import ConfirmDialog from '../components/ConfirmDialog';
import ThemeSelector from '../components/ThemeSelector';
import './SettingsPage.css';

// Определяем тип устройства по User-Agent
function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  // SmartTV / AndroidTV / Sber устройства
  if (
    ua.includes('smarttv') ||
    ua.includes('smart-tv') ||
    ua.includes('googletv') ||
    ua.includes('android tv') ||
    ua.includes('crkey') ||       // Chromecast
    ua.includes('netcast') ||     // LG
    ua.includes('webos') ||       // LG WebOS
    ua.includes('tizen') ||       // Samsung Smart TV
    ua.includes('viera') ||       // Panasonic
    ua.includes('hbbtv') ||       // HbbTV (европейские ТВ)
    ua.includes('philips') ||
    ua.includes('roku') ||
    // Salute устройства (SberBox, SberPortal)
    ua.includes('sberbox') ||
    ua.includes('sbertv') ||
    ua.includes('sberdevice') ||
    // Очень маленький экран с указателем "TV"
    (window.screen && window.screen.width >= 1280 && !('ontouchstart' in window) && navigator.maxTouchPoints === 0 && window.devicePixelRatio === 1)
  ) {
    return 'tv';
  }
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return 'mobile';
  }
  return 'desktop';
}

export default function SettingsPage({
  storageInfo,
  lastExportedAt,
  currentTheme,
  onChangeTheme,
  onExportJSON,
  onExportCSV,
  onImportJSON,
  onClearAllData,
  categoryLearning,
  onResetCategoryLearning,
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetLearningConfirm, setShowResetLearningConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [fileInputRef] = useState(() => React.createRef());

  const deviceType = detectDeviceType();
  const isTV = deviceType === 'tv';

  const correctionCount = categoryLearning?.stats?.totalCorrections || 0;
  const learnedTitlesCount = Object.keys(categoryLearning?.exactOverrides || {}).length;

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportConfirm(true);
    }
    e.target.value = '';
  };

  const handleImportConfirm = (mode) => {
    if (importFile) {
      onImportJSON(importFile, mode);
    }
    setShowImportConfirm(false);
    setImportFile(null);
  };

  const formatLastExport = () => {
    if (!lastExportedAt) return 'Никогда';
    const date = new Date(lastExportedAt);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-left">
          <Settings size={24} strokeWidth={2} className="page-header-icon" />
          <h1 className="page-title">Настройки</h1>
        </div>
      </div>

      <StorageIndicator storageInfo={storageInfo} />
      <ThemeSelector currentTheme={currentTheme} onChangeTheme={onChangeTheme} />

      {/* --- Экспорт --- */}
      <div className="settings-section">
        <h2 className="settings-section-title">Экспорт данных</h2>
        <p className="settings-section-hint">Последний экспорт: {formatLastExport()}</p>

        {isTV && (
          <div className="settings-tv-notice">
            <Tv size={16} strokeWidth={2} className="settings-tv-notice-icon" />
            <span>
              Файлы сохраняются в папку «Загрузки» вашего устройства.
              На телевизорах доступ к файлам может быть ограничен —
              рекомендуем использовать приложение с телефона или компьютера.
            </span>
          </div>
        )}

        <button type="button" className="settings-btn" onClick={onExportCSV}>
          <FileText size={22} strokeWidth={1.8} className="settings-btn-icon" />
          <div className="settings-btn-text">
            <span className="settings-btn-label">Экспорт в CSV</span>
            <span className="settings-btn-hint">Для Excel и Google Sheets</span>
          </div>
        </button>

        <button type="button" className="settings-btn" onClick={onExportJSON}>
          <FileJson size={22} strokeWidth={1.8} className="settings-btn-icon" />
          <div className="settings-btn-text">
            <span className="settings-btn-label">Экспорт в JSON</span>
            <span className="settings-btn-hint">Полный бэкап для восстановления</span>
          </div>
        </button>
      </div>

      {/* --- Импорт --- */}
      <div className="settings-section">
        <h2 className="settings-section-title">Импорт данных</h2>

        {isTV ? (
          <div className="settings-tv-notice settings-tv-notice--warning">
            <Tv size={16} strokeWidth={2} className="settings-tv-notice-icon" />
            <span>
              Импорт файлов недоступен на телевизорах и приставках —
              для этой функции используйте телефон или компьютер.
            </span>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="settings-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Импортировать данные из JSON"
            >
              <Download size={22} strokeWidth={1.8} className="settings-btn-icon" />
              <div className="settings-btn-text">
                <span className="settings-btn-label">Импорт из JSON</span>
                <span className="settings-btn-hint">Восстановление из бэкапа</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* --- Обучение категорий --- */}
      <div className="settings-section">
        <h2 className="settings-section-title">Персональное обучение категорий</h2>
        <p className="settings-section-hint">
          Приложение запоминает ваши исправления категорий и использует их при следующих добавлениях.
        </p>

        <div className="settings-learning-card">
          <div className="settings-learning-icon">
            <Brain size={20} strokeWidth={2} />
          </div>
          <div className="settings-learning-content">
            <div className="settings-learning-title">Сохранённые исправления</div>
            <div className="settings-learning-stats">
              <span>{correctionCount} исправлений</span>
              <span>·</span>
              <span>{learnedTitlesCount} запомненных названий</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="settings-btn"
          onClick={() => setShowResetLearningConfirm(true)}
        >
          <Brain size={22} strokeWidth={1.8} className="settings-btn-icon" />
          <div className="settings-btn-text">
            <span className="settings-btn-label">Сбросить обучение категорий</span>
            <span className="settings-btn-hint">Удалить все сохранённые исправления категорий</span>
          </div>
        </button>
      </div>

      {/* --- Опасная зона --- */}
      <div className="settings-section danger-zone">
        <h2 className="settings-section-title danger-title">Опасная зона</h2>
        <button
          type="button"
          className="settings-btn danger-btn"
          onClick={() => setShowClearConfirm(true)}
        >
          <Trash2 size={22} strokeWidth={1.8} className="settings-btn-icon" />
          <div className="settings-btn-text">
            <span className="settings-btn-label">Удалить все данные</span>
            <span className="settings-btn-hint">Безвозвратное удаление всех чеков</span>
          </div>
        </button>
      </div>

      <div className="settings-about">
        <div className="settings-about-name">CheckVoice v1.0.0</div>
        <div className="settings-about-desc">Голосовой учёт покупок</div>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="Удалить все данные?"
          message="Все чеки, история и статистика будут удалены безвозвратно."
          confirmText="Удалить всё"
          danger
          onConfirm={() => { onClearAllData(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {showResetLearningConfirm && (
        <ConfirmDialog
          title="Сбросить обучение категорий?"
          message="Все сохранённые исправления категорий будут удалены. Автоматическая категоризация вернётся к базовым правилам."
          confirmText="Сбросить"
          onConfirm={() => { onResetCategoryLearning(); setShowResetLearningConfirm(false); }}
          onCancel={() => setShowResetLearningConfirm(false)}
        />
      )}

      {showImportConfirm && (
        <ImportDialog
          fileName={importFile?.name}
          onReplace={() => handleImportConfirm('replace')}
          onMerge={() => handleImportConfirm('merge')}
          onCancel={() => { setShowImportConfirm(false); setImportFile(null); }}
        />
      )}
    </div>
  );
}

function ImportDialog({ fileName, onReplace, onMerge, onCancel }) {
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="import-dialog-title" className="confirm-title">Импорт данных</div>
        <div className="confirm-message">
          Файл: <strong>{fileName}</strong>
          <br /><br />
          Выберите способ импорта:
        </div>

        <div className="import-buttons">
          <button type="button" className="import-btn merge-btn" onClick={onMerge}>
            <span className="import-btn-label">Объединить</span>
            <span className="import-btn-hint">Добавить к существующим данным</span>
          </button>
          <button type="button" className="import-btn replace-btn" onClick={onReplace}>
            <span className="import-btn-label">Заменить</span>
            <span className="import-btn-hint">Удалить старые, загрузить новые</span>
          </button>
        </div>

        <button type="button" className="import-cancel" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}