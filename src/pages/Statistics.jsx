import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import PeriodSelector from '../components/PeriodSelector';
import CategoryBar from '../components/CategoryBar';
import EmptyState from '../components/EmptyState';
import { formatPrice } from '../utils/formatPrice';
import {
  getReceiptsByPeriod,
  calculateTotal,
  calculateCategoryStats,
} from '../utils/storage';
import { CATEGORIES } from '../constants/categories';
import './Statistics.css';

export default function Statistics({ receipts, selectedPeriod, onChangePeriod }) {
  const periodLabels = {
    week: 'за неделю',
    month: 'за месяц',
    all: 'за всё время',
  };

  const {
    totalAmount,
    totalReceipts,
    totalItems,
    categoryStats,
  } = useMemo(() => {
    const stateForPeriod = { savedReceipts: receipts };
    const periodReceipts = getReceiptsByPeriod(stateForPeriod, selectedPeriod);

    return {
      totalAmount: calculateTotal(periodReceipts),
      totalReceipts: periodReceipts.length,
      totalItems: periodReceipts.reduce((sum, r) => sum + (r.items?.length || 0), 0),
      categoryStats: calculateCategoryStats(periodReceipts, CATEGORIES),
    };
  }, [receipts, selectedPeriod]);

  return (
    <div className="statistics">
      <div className="page-header">
        <div className="page-header-left">
          <BarChart3 size={24} strokeWidth={2} className="page-header-icon" />
          <h1 className="page-title">Статистика</h1>
        </div>
      </div>

      <PeriodSelector selected={selectedPeriod} onChange={onChangePeriod} />

      {totalReceipts === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Нет данных"
          subtitle={`Нет сохранённых чеков ${periodLabels[selectedPeriod]}`}
        />
      ) : (
        <>
          <div className="stats-summary">
            <div className="stats-summary-label">
              Потрачено {periodLabels[selectedPeriod]}:
            </div>
            <div className="stats-summary-amount">
              {formatPrice(totalAmount)}
            </div>
            <div className="stats-summary-details">
              <span>
                {totalReceipts} {pluralize(totalReceipts, 'чек', 'чека', 'чеков')}
              </span>
              <span>·</span>
              <span>
                {totalItems} {pluralize(totalItems, 'товар', 'товара', 'товаров')}
              </span>
            </div>
          </div>

          <div className="stats-categories">
            <h2 className="stats-section-title">По категориям</h2>
            {categoryStats.map((stat, index) => (
              <CategoryBar
                key={stat.key}
                stat={stat}
                style={{ animationDelay: `${index * 60}ms` }}
              />
            ))}
          </div>

          {selectedPeriod !== 'all' && totalReceipts > 0 && (
            <div className="stats-average">
              <div className="stats-average-label">Среднее за чек:</div>
              <div className="stats-average-amount">
                {formatPrice(Math.round((totalAmount / totalReceipts) * 100) / 100)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function pluralize(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}