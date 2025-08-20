"use client";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast 的預設配置
export const TOAST_CONFIG = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "light",
  limit: 1, // 限制同時只能顯示一個 toast
  style: {
    // 確保 toast 的容器始終在視口範圍內
    position: 'fixed',
    top: '20px',
    zIndex: 9999, // 確保 toast 在其他元素之上
  }
};

// Toast 容器組件
export const ToastProvider = ({ children }) => {
  // 監聽路由變化，當路由改變時清除所有 toast
  // if (typeof window !== 'undefined') {
  //   // 使用 MutationObserver 監聽 URL 變化
  //   const observer = new MutationObserver(() => {
  //     if (window.location.href !== lastUrl) {
  //       lastUrl = window.location.href;
  //       // toast.dismiss(); // 清除所有 toast
  //     }
  //   });
    
  //   let lastUrl = window.location.href;
    
  //   observer.observe(document, {
  //     subtree: true,
  //     childList: true
  //   });
  // }

  return (
    <>
      {children}
      <ToastContainer {...TOAST_CONFIG} />
    </>
  );
};

// Toast 輔助函數
export const showToast = {
  success: (message) => {
    if (typeof window !== 'undefined') {
      toast.dismiss(); // 在顯示新的 toast 前，先清除現有的
      toast.success(message);
    }
  },
  error: (message) => {
    if (typeof window !== 'undefined') {
      toast.dismiss();
      toast.error(message);
    }
  },
  info: (message) => {
    if (typeof window !== 'undefined') {
      toast.dismiss();
      toast.info(message);
    }
  },
  warning: (message) => {
    if (typeof window !== 'undefined') {
      toast.dismiss();
      toast.warning(message);
    }
  }
};