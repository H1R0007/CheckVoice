// src/components/SaveAnimation.jsx

import React, { useState, useEffect } from 'react';
import './SaveAnimation.css';

export default function SaveAnimation({ total, itemCount, onComplete }) {
  var [fading, setFading] = useState(false);

  useEffect(function () {
    var fadeTimer = setTimeout(function () {
      setFading(true);
    }, 1500);

    var completeTimer = setTimeout(function () {
      if (onComplete) onComplete();
    }, 1800);

    return function () {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  var totalText = total !== undefined ? total + ' \u20BD' : '';
  var countText = '';

  if (itemCount === 1) {
    countText = '1 позиция';
  } else if (itemCount !== undefined && itemCount > 1) {
    if (itemCount >= 2 && itemCount <= 4) {
      countText = itemCount + ' позиции';
    } else {
      countText = itemCount + ' позиций';
    }
  }

  return (
    <div className={'save-animation' + (fading ? ' fading' : '')}>
      <div className="save-animation-backdrop" />

      <div className="save-animation-center">
        <div className="save-animation-circle" />

        <div className="save-animation-pulse save-animation-pulse--1" />
        <div className="save-animation-pulse save-animation-pulse--2" />

        <div className="save-animation-particles">
          <div className="save-animation-particle" />
          <div className="save-animation-particle" />
          <div className="save-animation-particle" />
          <div className="save-animation-particle" />
          <div className="save-animation-particle" />
          <div className="save-animation-particle" />
        </div>

        <svg
          className="save-animation-check"
          viewBox="0 0 72 72"
          aria-hidden="true"
        >
          <circle
            className="save-animation-ring"
            cx="36"
            cy="36"
            r="32.5"
          />
          <polyline
            className="save-animation-tick"
            points="22 37 32 47 50 27"
          />
        </svg>

        <div className="save-animation-text">
          <span className="save-animation-text-main">Сохранено</span>

          {(totalText || countText) && (
            <span className="save-animation-text-sub">
              {countText}
              {countText && totalText ? ' \u00B7 ' : ''}
              {totalText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}