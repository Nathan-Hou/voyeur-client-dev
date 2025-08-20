import { useEffect } from 'react';

export default function PaymentResultModal({ isOpen, onClose, isSuccess, handleRetryPayment }) {

  // 按 ESC 關閉 modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc, false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc, false);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999]">
        {/* 外層容器處理漸層邊框 */}
        <div className="p-[1px] rounded-[10px] bg-gradient-to-br from-primary via-blue-300  to-indigo-400 max-w-md w-full mx-4 shadow-xl">
            <div className="bg-black text-white rounded-[10px] p-6">
                {/* 標題 */}
                <h2 className="text-xl font-bold mb-4">
                    {isSuccess ? '支付成功！' : '支付失敗'}
                </h2>
                
                {/* 內容 */}
                <p className=" mb-6 leading-relaxed">
                    {isSuccess 
                        ? '感謝您的支持！您可至個人頁面查看贊助紀錄。'
                        : '很抱歉，您的支付未能完成，請再試一次。'
                    }
                </p>
                                
                {/* 按鈕組 */}
                <div className="flex gap-3 justify-end">
                {!isSuccess && (
                <button
                    onClick={onClose}
                    className="px-4 py-2 border-gray-300 rounded-[8px] transition-colors"
                >
                    取消
                </button>
                )}
                
                {/* 主要按鈕 */}
                <button
                    onClick={isSuccess ? onClose : handleRetryPayment}
                    //   disabled={isLoading}
                    className="px-4 py-2
                    bg-gradient-to-br from-primary to-indigo-500 rounded-[8px] disabled:cursor-not-allowed transition-colors"
                    >
                    {isSuccess ? '確定' : '重新嘗試'}
                </button>
                </div>
            </div>
      </div>
    </div>
    </>
  );
}