// src/components/ErrorBoundary.jsx

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== 'production';

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-icon" aria-hidden="true">
            <AlertTriangle size={36} strokeWidth={1.5} />
          </div>

          <div className="error-boundary-title">Что-то пошло не так</div>

          <div className="error-boundary-message">
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </div>

          <button
            type="button"
            className="error-boundary-btn"
            onClick={this.handleReload}
          >
            <RefreshCw size={18} strokeWidth={2} aria-hidden="true" />
            Обновить
          </button>

          {isDev && this.state.error && (
            <details className="error-boundary-details">
              <summary>Подробности ошибки</summary>
              <pre>{String(this.state.error)}</pre>
              {this.state.errorInfo?.componentStack && (
                <pre>{this.state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}