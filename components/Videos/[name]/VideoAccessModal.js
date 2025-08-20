"use client";

import { useState, useEffect } from 'react';

const VideoAccessModal = ({ isOpen, onClose, videoId, videoTitle, onLogin, onPurchase, userStatus }) => {
  
  if (!isOpen) return null;

  const handlePrimaryAction = () => {
    if (userStatus === 'not_authenticated') {
      onLogin();
    } else if (userStatus === 'authenticated_not_purchased') {
      onPurchase(videoId);
    }
  };

  const handleSecondaryAction = () => {
    onClose();
  };

  const getModalContent = () => {
    // if (isLoading) {
    //   return {
    //     title: '檢查權限中...',
    //     message: '正在確認您的觀看權限，請稍候',
    //     primaryButton: null,
    //     secondaryButton: '關閉'
    //   };
    // }

    // if (error) {
    //   return {
    //     title: '系統錯誤',
    //     message: `發生錯誤：${error}`,
    //     primaryButton: '重新嘗試',
    //     secondaryButton: '關閉'
    //   };
    // }

    switch (userStatus) {
      case 'not_authenticated':
        return {
          title: '需要登入',
          message: `要觀看完整的影片內容，請先登入您的帳戶。`,
          primaryButton: '立即登入',
          secondaryButton: '繼續觀看預覽'
        };
      
      case 'authenticated_not_purchased':
        return {
          title: '需要購買',
          message: `這是付費內容，贊助後即可觀看完整影片。`,
          primaryButton: '立即贊助',
          secondaryButton: '繼續觀看預覽'
        };
      
      default:
        return {
          title: '權限確認',
          message: '正在確認您的觀看權限...',
          primaryButton: null,
          secondaryButton: '關閉'
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999]">
        {/* 外層容器處理漸層邊框 */}
        <div className="p-[1px] rounded-[10px] bg-gradient-to-br from-primary via-blue-300  to-indigo-400 max-w-md w-full mx-4 shadow-xl">
            <div className="bg-black text-white rounded-[10px] p-6">
                {/* 標題 */}
                <h2 className="text-xl font-bold mb-4">
                {content.title}
                </h2>
                
                {/* 內容 */}
                <p className=" mb-6 leading-relaxed">
                {content.message}
                </p>
                
                {/* 載入狀態 */}
                {/* {isLoading && (
                <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                )} */}
                
                {/* 按鈕組 */}
                <div className="flex gap-3 justify-end">
                {/* 次要按鈕 */}
                <button
                    onClick={handleSecondaryAction}
                    className="px-4 py-2 border-gray-300 rounded-[8px] transition-colors"
                >
                    {content.secondaryButton}
                </button>
                
                {/* 主要按鈕 */}
                {content.primaryButton && (
                    <button
                    onClick={handlePrimaryAction}
                    //   disabled={isLoading}
                    className="px-4 py-2
                    bg-gradient-to-br from-primary to-indigo-500 rounded-[8px] disabled:cursor-not-allowed transition-colors"
                    >
                    {content.primaryButton}
                    </button>
                )}
                </div>
            </div>
      </div>
    </div>
  );
};

export default VideoAccessModal;