// src/components/Skeleton.jsx

import React from 'react';
import './Skeleton.css';

var RECEIPT_LINE_WIDTHS = ['72%', '84%', '67%', '79%', '88%', '74%'];
var STATS_LABEL_WIDTHS = ['92px', '128px', '104px', '138px'];

export function SkeletonText({ width = '100%', height, className = '' }) {
  return (
    <div
      className={'skeleton skeleton-text ' + className}
      style={{ width: width, height: height }}
    />
  );
}

export function SkeletonReceiptList({ count = 3 }) {
  return (
    <div className="skeleton-receipt-list">
      {Array.from({ length: count }).map(function (_, i) {
        var lineWidth = RECEIPT_LINE_WIDTHS[i % RECEIPT_LINE_WIDTHS.length];

        return (
          <div key={i} className="skeleton-receipt-item">
            <div className="skeleton-card-row">
              <div className="skeleton-inline-group skeleton-inline-group--grow">
                <SkeletonText width="24px" />
                <SkeletonText width={lineWidth} />
              </div>

              <SkeletonText width="60px" />
            </div>

            <div className="skeleton-inline-group">
              <div
                className="skeleton skeleton-circle"
                style={{ width: 14, height: 14 }}
              />
              <SkeletonText width="80px" className="skeleton-text--sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SkeletonHistoryCard() {
  return (
    <div className="skeleton skeleton-card" style={{ height: 72 }}>
      <div className="skeleton-card-row">
        <SkeletonText width="80px" className="skeleton-text--sm" />
        <SkeletonText width="60px" className="skeleton-text--lg" />
      </div>

      <div className="skeleton-inline-group" style={{ gap: 6 }}>
        {Array.from({ length: 3 }).map(function (_, i) {
          return (
            <div
              key={i}
              className="skeleton skeleton-circle"
              style={{ width: 14, height: 14 }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div>
      <div
        className="skeleton skeleton-card"
        style={{ height: 120, marginBottom: 24 }}
      />

      <SkeletonText width="120px" className="skeleton-text--sm" />

      {Array.from({ length: 4 }).map(function (_, i) {
        var labelWidth = STATS_LABEL_WIDTHS[i % STATS_LABEL_WIDTHS.length];

        return (
          <div key={i} className="skeleton-stats-row">
            <div className="skeleton-card-row">
              <div className="skeleton-inline-group" style={{ gap: 8 }}>
                <div
                  className="skeleton skeleton-circle"
                  style={{ width: 16, height: 16 }}
                />
                <SkeletonText width={labelWidth} />
              </div>

              <SkeletonText width="50px" />
            </div>

            <div className="skeleton skeleton-progress" />
          </div>
        );
      })}
    </div>
  );
}