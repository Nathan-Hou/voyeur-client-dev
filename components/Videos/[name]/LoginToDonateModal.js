import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LoginToDonateModal({ isOpen, onClose, onLogin }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999]">
        {/* 外層容器處理漸層邊框 */}
        <div className="p-[1px] rounded-[10px] bg-gradient-to-br from-primary via-blue-300  to-indigo-400 max-w-md w-full mx-4 shadow-xl">
            <div className="bg-black text-white rounded-[10px] p-6">
                {/* 標題 */}
                <h2 className="text-xl font-bold mb-4">
                    需要登入
                </h2>
                
                {/* 內容 */}
                <p className=" mb-6 leading-relaxed">
                    請先進行登入以支持本計畫。
                </p>
                                
                {/* 按鈕組 */}
                <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border-gray-300 rounded-[8px] transition-colors"
                >
                    取消
                </button>
                
                {/* 主要按鈕 */}
                <button
                    onClick={onLogin}
                    //   disabled={isLoading}
                    className="px-4 py-2
                    bg-gradient-to-br from-primary to-indigo-500 rounded-[8px] disabled:cursor-not-allowed transition-colors"
                    >
                    前往登入
                </button>
                </div>
            </div>
      </div>
    </div>
    </>
  );
}