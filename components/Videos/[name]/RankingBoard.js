"use client";

import { useState, useEffect } from "react";
import { UserRound, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import NewProjectService from "@/services/project-service";
import { showToast } from "@/components/shared/toast/Config";

// SWR fetcher function
const fetcher = async ([projectSlug, page, pageSize]) => {
    if (!projectSlug) return null;
    const res = await NewProjectService.getTopDonors(projectSlug, page, pageSize);
    return res?.data;
};

export default function RankingBoard({ projectSlug, refreshTrigger }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const pageSize = 10;
    const currentPage = parseInt(searchParams.get('page')) || 1;

    // SWR hook for data fetching
    const {
        data: swrData,
        error,
        isLoading,
        mutate
    } = useSWR(
        projectSlug ? [projectSlug, currentPage, pageSize] : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 5000,     // 正常情況下 5秒去重
            staleTime: 10000,          // 10秒後資料視為過時
            revalidateIfStale: true,   // 🆕 啟用背景檢查
            refreshInterval: 30000,    // 🆕 30秒自動背景刷新（可選）
            errorRetryCount: 3,
            keepPreviousData: true,
            onError: (error) => {
                console.error("Error fetching ranking board data: ", error);
                showToast("載入排行榜數據時發生錯誤", "error");
            }
        }
    );

    // Extract data from SWR response
    const data = swrData?.data ? [
        ...swrData.data,
    ] : [];
    const totalCount = swrData?.pagination?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // 更新 URL 中的頁碼參數
    const updatePageInUrl = (newPage) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (newPage === 1) {
            current.delete('page');
        } else {
            current.set('page', newPage.toString());
        }
        
        const search = current.toString();
        const query = search ? `?${search}` : '';
        
        // 使用 window.history.pushState 來避免滾動到頂端
        window.history.pushState(
            {},
            '',
            `${window.location.pathname}${query}`
        );
    };

    // 處理頁碼變更
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            updatePageInUrl(newPage);
            // SWR 會自動根據新的 key 重新 fetch 數據
        }
    };

    // 🆕 修改後的版本
    useEffect(() => {
        if (refreshTrigger > 0) {
            mutate(); // 使用 SWR 的 mutate 來重新驗證數據
            
            // 🆕 在資料更新後檢查頁面是否仍有效
            setTimeout(() => {
                // 重新檢查當前頁面是否仍然有效
                const updatedTotalPages = Math.ceil((swrData?.pagination?.totalCount || 0) / pageSize);
                if (currentPage > updatedTotalPages && updatedTotalPages > 0) {
                    updatePageInUrl(updatedTotalPages);
                }
            }, 1000); // 給一點時間讓資料更新
        }
    }, [refreshTrigger, mutate, currentPage, swrData?.pagination?.totalCount, pageSize]);

    // 🆕 新增：檢查當前頁面是否有資料，如果沒有則跳轉到最後一頁
    useEffect(() => {
        // 只在非載入狀態且有資料時執行檢查
        if (!isLoading && swrData && totalPages > 0) {
            // 如果當前頁面超過總頁數，跳轉到最後一頁
            if (currentPage > totalPages) {
                updatePageInUrl(totalPages);
                return;
            }
            
            // 如果當前頁面的資料為空（但不是第一頁），也跳轉到最後一頁
            if (currentPage > 1 && (!swrData.data || swrData.data.length === 0)) {
                updatePageInUrl(totalPages);
                return;
            }
        }
    }, [isLoading, swrData, currentPage, totalPages]);

    // 生成頁碼按鈕
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // 調整起始頁面，確保顯示足夠的頁碼
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // 第一頁和省略號
        if (startPage > 1) {
            buttons.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 rounded border border-white/25 text-white hover:bg-primary hover:border-primary transition-colors"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                buttons.push(<span key="start-ellipsis" className="px-2 text-white/50">...</span>);
            }
        }

        // 頁碼按鈕
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 rounded border transition-colors ${
                        i === currentPage
                            ? 'bg-primary border-primary text-white'
                            : 'border-white/25 text-white hover:bg-primary hover:border-primary'
                    }`}
                >
                    {i}
                </button>
            );
        }

        // 最後一頁和省略號
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="end-ellipsis" className="px-2 text-white/50">...</span>);
            }
            buttons.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 rounded border border-white/25 text-white hover:bg-primary hover:border-primary transition-colors"
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    // 處理錯誤狀態
    if (error) {
        return (
            <div>
                <h2 className="project-detail-page-section-title">贊助排行榜</h2>
                <div className="mt-4 text-center py-8 text-red-400">
                    載入排行榜時發生錯誤，請稍後重試
                    <button
                        onClick={() => mutate()}
                        className="ml-2 px-3 py-1 bg-primary rounded text-white hover:bg-primary/80 transition-colors"
                    >
                        重試
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {(data && data?.length !== 0) ? (
                <div>
                    <h2 className="project-detail-page-section-title">贊助排行榜</h2>
                    <div className="mt-4 max-sm:text-sm">
                        {/* Table Header */}
                        <div className="flex items-center p-3 sm:p-4 border-b border-white/25 font-bold text-white">
                            <div className="w-8 sm:w-16 shrink-0 text-center">排名</div>
                            <div className="flex-grow flex-shrink min-w-0 ml-[calc(1.5rem+23px)]">用戶名稱</div>
                            <div className="w-24 sm:w-32 shrink-0 text-right mr-1 min-w-0">贊助金額</div>
                        </div>
                        
                        {isLoading ? (
                            <div className={`${totalPages > 1 ? currentPage !== totalPages ? `min-h-[556px] md:min-h-[656px]` : "md:min-h-[656px]" : ""} flex items-center justify-center`}>
                            <div className={`text-center py-8 text-white/75`}>載入中...</div>
                            </div>
                        ) : (
                            <div className={`max-h-[650px] ${totalPages > 1 ? currentPage !== totalPages ? `min-h-[550px] md:min-h-[650px]` : "md:min-h-[650px]" : ""}`}>
                                {/* Table Body */}
                                {data.map((donor, index) => {
                                    const rank = (currentPage - 1) * pageSize + index + 1;
                                    return (
                                        <div 
                                            className="group p-[1px] hover:bg-gradient-to-br hover:from-primary hover:via-blue-300 hover:to-indigo-400 transition-colors duration-300 ease-in-out rounded-[10px] mt-1.5" 
                                            key={donor.id || index + 1}
                                        >
                                            <div className="bg-black rounded-[10px]">
                                                <div className="flex items-center p-3 sm:p-4 bg-white/10 border-b border-white/10 last:border-b-0 rounded-[10px]">
                                                    {/* 排名 */}
                                                    <div className="w-8 sm:w-16 text-center shrink-0">
                                                        <span className="text-primary font-bold">{rank}</span>
                                                    </div>

                                                    {/* 用戶名稱 */}
                                                    <div className="flex-grow flex-shrink min-w-0 mx-4">
                                                        <div className="flex items-center font-bold min-w-0">
                                                            <div className="w-[22px] h-[22px] relative rounded-full overflow-hidden bg-white/15 flex items-center justify-center shrink-0">
                                                                {donor?.profilePicture ? (
                                                                    <Image src={`${process.env.NEXT_PUBLIC_PHOTO_BASE_URL}${donor?.profilePicture}`} alt="" fill></Image>
                                                                ) : (
                                                                    <UserRound size={14} className="text-white/75"></UserRound>
                                                                )}
                                                            </div>
                                                            <div className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden min-w-0 flex-1">
                                                                {`${donor.userName}` || '匿名贊助者'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 贊助金額 */}
                                                    <div className="w-24 sm:w-32 text-right shrink-0 min-w-0">
                                                        <div className="text-ellipsis whitespace-nowrap overflow-hidden">
                                                            {(donor?.isPublicPaymentAmount !== false && !donor?.hideAmount) && 
                                                                !!donor?.totalAmount && 
                                                                (`NT$ ${donor?.totalAmount?.toLocaleString()}`)
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center mt-6 gap-2">
                                {/* 上一頁按鈕 */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded border transition-colors ${
                                        currentPage === 1
                                            ? 'border-white/25 text-white/50 cursor-not-allowed'
                                            : 'border-white/25 text-white hover:bg-primary hover:border-primary'
                                    }`}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {/* 頁碼按鈕 */}
                                <div className="flex items-center gap-1">
                                    {renderPaginationButtons()}
                                </div>

                                {/* 下一頁按鈕 */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded border transition-colors ${
                                        currentPage === totalPages
                                            ? 'border-white/25 text-white/50 cursor-not-allowed'
                                            : 'border-white/25 text-white hover:bg-primary hover:border-primary'
                                    }`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                null
            )}
        </>
    )
}