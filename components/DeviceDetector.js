'use client';

import { useEffect, useState } from 'react';

export default function DeviceDetector() {
  const [showMobileAlert, setShowMobileAlert] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipod', 'blackberry', 'windows phone'];
      const isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      setShowMobileAlert(isMobile);
    };

    checkDevice();
  }, []);

  if (!showMobileAlert) return null;

  return (
    <>
      {/* 黑色半透明遮罩 */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50" />
      
      {/* 提示視窗 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg py-6 px-10 max-w-sm w-full mx-auto shadow-lg">
          <p className="text-gray-800 mb-6">
            為了更好的瀏覽體驗，建議您使用平板或電腦瀏覽此網站。
          </p>
          <button
            onClick={() => setShowMobileAlert(false)}
            className="w-full btn-secondary font-medium py-2 px-4 rounded-lg transition-colors"
          >
            確定
          </button>
        </div>
      </div>
    </>
  );
}