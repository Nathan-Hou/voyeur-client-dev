'use client'
import { useRouter, useSearchParams } from 'next/navigation';

export default function Pagination({ total, pageSize = 10, currentPage = 1 }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // 計算總頁數
    const totalPages = Math.ceil(total / pageSize);
    
    // 如果只有一頁或更少，不顯示分頁
    if (totalPages <= 1) return null;

    const handlePageChange = (page) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page);
        router.push(`?${params.toString()}`, { 
            scroll: false  // 添加這個配置來防止自動滾動
        });
    };

    // 生成頁碼數組
    const getPageNumbers = () => {
        const pages = [];
        const showPages = 5; // 顯示幾個頁碼
        
        let start = Math.max(1, currentPage - Math.floor(showPages / 2));
        let end = Math.min(totalPages, start + showPages - 1);
        
        // 調整 start 以確保顯示足夠的頁碼
        if (end - start + 1 < showPages) {
            start = Math.max(1, end - showPages + 1);
        }

        // 添加頁碼
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center space-x-2 mt-6">
            {/* 上一頁 */}
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded whitespace-nowrap ${
                    currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
                上一頁
            </button>
            
            {/* 第一頁 */}
            {getPageNumbers()[0] > 1 && (
                <>
                    <button
                        onClick={() => handlePageChange(1)}
                        className={`px-3 py-1 rounded ${
                            currentPage === 1 ? 'bg-secondary text-white' : 'bg-white text-fourth hover:bg-fourth hover:bg-opacity-20'
                        }`}
                    >
                        1
                    </button>
                    {getPageNumbers()[0] > 2 && <span>...</span>}
                </>
            )}
            
            {/* 頁碼 */}
            {getPageNumbers().map(page => (
                <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                        currentPage === page 
                        ? 'bg-secondary text-white'
                        : 'bg-tertiary hover:bg-fourth hover:bg-opacity-20'
                    }`}
                >
                    {page}
                </button>
            ))}
            
            {/* 最後一頁 */}
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <>
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && <span>...</span>}
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`px-3 py-1 rounded ${
                            currentPage === totalPages ? 'bg-secondary text-white' : 'bg-tertiary hover:bg-fourth hover:bg-opacity-20'
                        }`}
                    >
                        {totalPages}
                    </button>
                </>
            )}
            
            {/* 下一頁 */}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded whitespace-nowrap ${
                    currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
                下一頁
            </button>
        </div>
    );
}