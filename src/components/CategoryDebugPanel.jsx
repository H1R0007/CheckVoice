// src/components/CategoryDebugPanel.jsx

import React, { useMemo } from 'react';
import { getCategoryByKey } from '../constants/categories';
import { buildPatternCandidates } from '../utils/categoryPatternLearning';
import './CategoryDebugPanel.css';

export default function CategoryDebugPanel({
  items = [],
  categoryLearning,
  onApprovePattern,
  onRemoveApprovedPattern,
}) {
  const correctionLog = useMemo(() => {
    return Array.isArray(categoryLearning?.correctionLog)
      ? categoryLearning.correctionLog
      : [];
  }, [categoryLearning?.correctionLog]);

  const approvedPatterns = useMemo(() => {
    return Array.isArray(categoryLearning?.approvedPatterns)
      ? categoryLearning.approvedPatterns
      : [];
  }, [categoryLearning?.approvedPatterns]);

  const recentCorrections = useMemo(() => {
    return correctionLog.slice(0, 8);
  }, [correctionLog]);

  const lowConfidenceItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.categorySource === 'auto' &&
        typeof item.categoryConfidence === 'number' &&
        item.categoryConfidence < 0.55
    );
  }, [items]);

  const patternCandidates = useMemo(() => {
    return buildPatternCandidates(correctionLog);
  }, [correctionLog]);

  return (
    <section className="category-debug-panel">
      <div className="category-debug-title">Dev: category debug</div>

      <div className="category-debug-section">
        <div className="category-debug-subtitle">Текущий чек</div>
        {items.length === 0 ? (
          <div className="category-debug-empty">Нет товаров</div>
        ) : (
          <div className="category-debug-list">
            {items.map((item) => (
              <div key={item.id} className="category-debug-item">
                <div className="category-debug-item-title">{item.title}</div>
                <div className="category-debug-item-meta">
                  <span>category: <strong>{item.category}</strong></span>
                  <span>auto: <strong>{item.autoCategory || '—'}</strong></span>
                  <span>source: <strong>{item.categorySource || '—'}</strong></span>
                  <span>
                    confidence:{' '}
                    <strong>
                      {typeof item.categoryConfidence === 'number'
                        ? item.categoryConfidence.toFixed(2)
                        : '—'}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="category-debug-section">
        <div className="category-debug-subtitle">Low confidence</div>
        {lowConfidenceItems.length === 0 ? (
          <div className="category-debug-empty">Нет спорных категорий</div>
        ) : (
          <div className="category-debug-list">
            {lowConfidenceItems.map((item) => (
              <div key={item.id} className="category-debug-item">
                <div className="category-debug-item-title">{item.title}</div>
                <div className="category-debug-item-meta">
                  <span>category: <strong>{item.category}</strong></span>
                  <span>
                    confidence:{' '}
                    <strong>{item.categoryConfidence.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="category-debug-section">
        <div className="category-debug-subtitle">Последние исправления</div>
        {recentCorrections.length === 0 ? (
          <div className="category-debug-empty">Исправлений пока нет</div>
        ) : (
          <div className="category-debug-list">
            {recentCorrections.map((entry) => (
              <div key={entry.id} className="category-debug-item">
                <div className="category-debug-item-title">{entry.originalTitle}</div>
                <div className="category-debug-item-meta">
                  <span>auto: <strong>{entry.autoCategory}</strong></span>
                  <span>final: <strong>{entry.finalCategory}</strong></span>
                  <span>normalized: <strong>{entry.normalizedTitle}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="category-debug-section">
        <div className="category-debug-subtitle">Подтверждённые паттерны</div>
        {approvedPatterns.length === 0 ? (
          <div className="category-debug-empty">Нет подтверждённых паттернов</div>
        ) : (
          <div className="category-debug-list">
            {approvedPatterns.map((entry) => {
              const categoryName = getCategoryByKey(entry.category).name;

              return (
                <div key={entry.id} className="category-debug-item category-debug-item--candidate">
                  <div className="category-debug-candidate-top">
                    <div className="category-debug-candidate-pattern">{entry.pattern}</div>
                    <div className="category-debug-candidate-badge">{categoryName}</div>
                  </div>

                  <div className="category-debug-item-meta">
                    <span>source: <strong>{entry.source}</strong></span>
                    <span>weight: <strong>{entry.weight || 1}</strong></span>
                  </div>

                  <div className="category-debug-actions">
                    <button
                      type="button"
                      className="category-debug-btn category-debug-btn--danger"
                      onClick={() => onRemoveApprovedPattern && onRemoveApprovedPattern(entry.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="category-debug-section">
        <div className="category-debug-subtitle">Кандидаты на паттерны</div>
        {patternCandidates.length === 0 ? (
          <div className="category-debug-empty">Недостаточно данных для кандидатов</div>
        ) : (
          <div className="category-debug-list">
            {patternCandidates.map((candidate) => {
              const categoryName = getCategoryByKey(candidate.category).name;
              const alreadyApproved = approvedPatterns.some(
                (entry) =>
                  entry.category === candidate.category &&
                  entry.pattern === candidate.pattern
              );

              return (
                <div key={candidate.category + '_' + candidate.pattern} className="category-debug-item category-debug-item--candidate">
                  <div className="category-debug-candidate-top">
                    <div className="category-debug-candidate-pattern">{candidate.pattern}</div>
                    <div className="category-debug-candidate-badge">
                      {categoryName}
                    </div>
                  </div>

                  <div className="category-debug-item-meta">
                    <span>совпадений: <strong>{candidate.count}</strong></span>
                  </div>

                  <div className="category-debug-examples">
                    {candidate.examples.map((example) => (
                      <div key={example} className="category-debug-example">
                        {example}
                      </div>
                    ))}
                  </div>

                  <div className="category-debug-actions">
                    <button
                      type="button"
                      className="category-debug-btn"
                      disabled={alreadyApproved}
                      onClick={() => onApprovePattern && onApprovePattern(candidate)}
                    >
                      {alreadyApproved ? 'Уже подтверждено' : 'Подтвердить'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}