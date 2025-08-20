// components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 更新 state，讓下一次渲染顯示錯誤 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你可以在這裡記錄錯誤到錯誤回報服務
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 你可以渲染任何自定義的錯誤 UI
      return (
        <div>
          <h2>出現了一些問題</h2>
          <p>請重新整理頁面或稍後再試</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;