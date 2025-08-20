"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
// import ThreejsCanvas from "@/components/Threejs/Canvas";
import ThreejsCanvas from "@/components/Threejs/Canvas_v3_fixZoomInOut";
import ClientInfo from "./ClientInfo";
import VideoAccessModal from "./VideoAccessModal";
import PaymentResultModal from "./PaymentResultModal";
import LoginToDonateModal from "./LoginToDonateModal";
import HasPaidButNotOnlineYetModal from "./HasPaidButNotOnlineYetModal";

import NewProjectService from "@/services/project-service";

import s from "./Content.module.scss";
import RankingBoard from "./RankingBoard";

export default function Content() {
    const params = useParams();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const clientInfoRef = useRef(null);
    const [data, setData] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isLoginToDonateModalOpen, setIsLoginToDonateModalOpen] = useState(false);
    const [hasPaidButNotOnlineYetModalOpen, setHasPaidButNotOnlineYetModalOpen] = useState(false);
    const [rankingRefreshTrigger, setRankingRefreshTrigger] = useState(0);

    // 🆕 監聽 URL 參數，處理付款結果
    useEffect(() => {
        const payment = searchParams.get('payment');
        
        if (payment === 'success') {
            setPaymentSuccess(true);
            setIsPaymentModalOpen(true);
            // 清理 URL 參數
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        } else if (payment === 'failed') {
            setPaymentSuccess(false);
            setIsPaymentModalOpen(true);
            // 清理 URL 參數
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams]);

    // 🆕 關閉付款結果 modal
    const handleClosePaymentModal = useCallback(() => {
        setIsPaymentModalOpen(false);
        
        // 如果付款成功，可以在這裡重新載入項目數據
        if (paymentSuccess) {
            // 重新獲取項目數據以更新支持者數量等資訊
            const refreshData = async () => {
                if (!params?.name) return;
                try {
                    const res = isAuthenticated 
                        ? await NewProjectService.getDetailsWithAuth(params.name)
                        : await NewProjectService.getDetails(params.name);
                    setData(res?.data);
                    setRankingRefreshTrigger(prev => prev + 1);
                } catch (e) {
                    console.error('Error refreshing project data:', e);
                }
            };
            refreshData();
        }
    }, [paymentSuccess, params?.name, isAuthenticated]);

    const handleRetryPayment = useCallback(() => {
        setIsPaymentModalOpen(false);
        
        // 滾動到付款區域
        setTimeout(() => {
            if (clientInfoRef.current) {
                clientInfoRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 300);
    }, []);

    const handleCloseLoginToDonateModal = useCallback(() => {
        setIsLoginToDonateModalOpen(false);
    })

    // 🆕 處理隱藏金額狀態變更的回調函數
    const handleHideAmountChange = useCallback((userId, isHidden) => {
        // 觸發排行榜刷新
        setRankingRefreshTrigger(prev => prev + 1);
    }, []);

    // 🆕 使用 useCallback 穩定化回調函數
    const handleLogin = useCallback(() => {
        setIsModalOpen(false);
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }, [router]);
    
    const handlePurchase = useCallback(() => {
        setIsModalOpen(false);
        // 滾動到付款區域
        setTimeout(() => {
            if (clientInfoRef.current) {
                clientInfoRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 300);        
    }, []);
    
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // 🆕 使用 useCallback 穩定化 setIsModalOpen 函數
    const stableSetIsModalOpen = useCallback((value) => {
        setIsModalOpen(value);
    }, []);

    const handleCloseHasPaidButNotOnlineYetModal = useCallback(() => {
        setHasPaidButNotOnlineYetModalOpen(false);
    })

    const handleLoginToDonate = useCallback(() => {
        setIsModalOpen(false);
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        // 滾動到付款區域
        setTimeout(() => {
            if (clientInfoRef.current) {
                clientInfoRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 300);
    }, [router]);

    // 🆕 裝置檢測
    useEffect(() => {
        const detectDevice = () => {
            // 檢測觸控裝置
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // 檢測 User Agent
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // 檢測螢幕尺寸 (考慮平板橫屏)
            const isSmallScreen = window.innerWidth <= 1024;
            
            // 綜合判斷
            const isMobileOrTabletDevice = isTouchDevice || isMobileUA || isSmallScreen;
            
            setIsMobileOrTablet(isMobileOrTabletDevice);
        };

        // 初始檢測
        detectDevice();

        // 監聽螢幕尺寸變化
        const handleResize = () => {
            detectDevice();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!params?.name) return;
            try {
                if (isAuthenticated) {
                    const res = await NewProjectService.getDetailsWithAuth(params.name);
                    setData(res?.data);
                    // [Todo] 要判斷使用者有無購買
                } else {
                    const res = await NewProjectService.getDetails(params.name);
                    setData(res?.data);
                }
            } catch (e) {
                if (e?.response?.status === 400) {
                    if (e?.response?.data?.errorCode === "2000") {
                        router.push("/videos");
                    } else {

                    }
                } else {
                    console.error(`Error fetching project data. `, e);
                }
            }
        }
        fetchData();
    }, [params, isAuthenticated]); // 🆕 添加 isAuthenticated 依賴

    // 🆕 使用 useMemo 穩定化 videoSources 陣列，避免每次重新渲染都創建新陣列
    const memoizedVideos = useMemo(() => {
        if (!data?.videos) return [];
        
        return data.videos.map((video, index) => ({
            ...video,
            // 預先計算並穩定化 videoSources
            videoSources: video?.cameras?.map(camera => camera.url) || [],
            uniqueKey: video.id || `video-${index}`
        }));
    }, [data?.videos]);

    const handleOpenLineQRCode = () => {
        window.open('https://lin.ee/kQtwDaN', '_blank', 'noopener,noreferrer');
    }  

    return (
        <div className={`{isMobileOrTablet ? 'mobile-tablet-device' : ''} ${s.htmlContentConfig}`}>
            <h2 className="text-3xl sm:text-7xl lg:text-[3rem] xl:text-[3.5rem] font-bold text-center text-secondary">{data?.title}</h2>
            <div className="mt-[30px] text-white" dangerouslySetInnerHTML={{ __html: data?.introduction }}></div>
            <button className="mt-6 lg:mt-8 border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 ease-in-out w-full sm:w-fit rounded-[10px] px-3 py-1.5 sm:py-1" onClick={handleOpenLineQRCode}>有興趣 / 想建議：加入 LINE@</button>
            <div className="">
                {memoizedVideos.map((video, index) => (
                    (video?.type === "Bonus" && (!video?.isBonusUnlocked || !video.isOnline)) ? (
                            <div key={video.uniqueKey} className={`group relative ${index === 0 ? "mt-[90px] md:mt-[120px]" : "mt-[120px]"}`}>
                                <div className={`${s.videoTitle}`}>
                                    {video?.name}
                                </div>
                                
                                <div className="w-[calc(100%-1px)] pt-[50%] border border-primary relative overflow-hidden rounded-[10px]">
                                    <Image 
                                        src="/images/temp-video-not-online.jpg" 
                                        alt="" 
                                        fill 
                                        className="object-cover blur sm:blur-lg sm:group-hover:blur-md md:group-hover:scale-105 transition-all duration-300 ease-in-out"
                                    />
                                    <div className="absolute w-full h-full top-0 left-0 bg-black/30"></div>
                                    <p className="text-white font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl tracking-[1px] [text-shadow:2px_2px_4px_rgba(0,0,0,0.7)] sm:[text-shadow:2px_2px_4px_rgba(0,0,0,1)] text-nowrap whitespace-nowrap">
                                        {!video?.isBonusUnlocked ? "支持本計畫，解鎖更多影片" : "影片尚未上線，敬請期待！"}
                                    </p>
                                </div>
                                {/* <div className={`md:hidden bg-transparent text-white/50 p-[8px] absolute bottom-0 left-0 w-full text-center text-[14px] translate-y-full`}>© Effect Player</div> */}
                            </div>
                        ) : (
                            <ThreejsCanvas 
                                key={video.uniqueKey} // 🆕 使用穩定的 key
                                uniqueId={`list-video-${video.uniqueKey}`}
                                isFullscreen={false}
                                autoPlay={false}
                                pauseOthersOnPlay={true}
                                videoTitle={video?.name}
                                videoSources={video.videoSources} // 🆕 使用穩定化的 videoSources
                                isWaitingForOnline={video?.cameras?.some((i) => i.isWaitOnline)}
                                needsToPay={video?.cameras?.some((i) => i.isGoPay) || video?.cameras?.some((i) => i.isGoLogin)}
                                setIsModalOpen={stableSetIsModalOpen} // 🆕 使用穩定化的函數
                                setHasPaidButNotOnlineYetModalOpen={setHasPaidButNotOnlineYetModalOpen}
                            />
                        )
                    // ) : (
                    //     <div key={video.uniqueKey} className="group relative mt-[120px]">
                    //         <div className={`${s.videoTitle}`}>
                    //             {video?.name}
                    //         </div>
                            
                    //         <div className="w-[calc(100%-1px)] pt-[50%] border border-primary relative overflow-hidden rounded-[10px]">
                    //             <Image 
                    //                 src="/images/temp-video-not-online.jpg" 
                    //                 alt="" 
                    //                 fill 
                    //                 className="object-cover blur sm:blur-lg sm:group-hover:blur-md md:group-hover:scale-105 transition-all duration-300 ease-in-out"
                    //             />
                    //             <div className="absolute w-full h-full top-0 left-0 bg-black/30"></div>
                    //             <p className="text-white font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl tracking-[1px] [text-shadow:2px_2px_4px_rgba(0,0,0,0.7)] sm:[text-shadow:2px_2px_4px_rgba(0,0,0,1)] text-nowrap whitespace-nowrap">
                    //                 影片尚未上線，敬請期待！
                    //             </p>
                    //         </div>
                    //         <div className={`md:hidden bg-transparent text-white/50 p-[8px] absolute bottom-0 left-0 w-full text-center text-[14px] translate-y-full`}>© Effect Player</div>
                    //     </div>
                    // )
                ))}
                <div ref={clientInfoRef}>
                    <ClientInfo projectId={data?.id} projectSlug={data?.slug} setIsLoginToDonateModalOpen={setIsLoginToDonateModalOpen} minPrice={data?.minPrice} isPublicPaymentAmount={data?.isPublicPaymentAmount}onHideAmountChange={handleHideAmountChange} />
                </div>
                {/* 使用者已贊助過的話不會開啟 VideoAccessModal，所以 userStatus 傳 authenticated_not_purchased 沒有關係。userStatus 必須傳值，因為若沒傳 modal 就會使用 default content */}
                <VideoAccessModal
                    userStatus={isAuthenticated ? "authenticated_not_purchased" : "not_authenticated"}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onLogin={handleLogin}
                    onPurchase={handlePurchase}
                />
                <PaymentResultModal
                    isOpen={isPaymentModalOpen}
                    onClose={handleClosePaymentModal}
                    isSuccess={paymentSuccess}
                    handleRetryPayment={handleRetryPayment}
                />
                <LoginToDonateModal
                    isOpen={isLoginToDonateModalOpen}
                    onClose={handleCloseLoginToDonateModal}
                    onLogin={handleLoginToDonate}
                />
                <HasPaidButNotOnlineYetModal
                    isOpen={hasPaidButNotOnlineYetModalOpen}
                    onClose={handleCloseHasPaidButNotOnlineYetModal}
                />
            </div>
            <div className="mt-10">
                <RankingBoard projectSlug={data?.slug} refreshTrigger={rankingRefreshTrigger} />
            </div>
            <div className="mt-20 lg:mt-32" id="rule">
                <h2 className="project-detail-page-section-title">規則說明</h2>
                <div className="mt-4" dangerouslySetInnerHTML={{ __html: data?.rulesDescription}}></div>
            </div>
        </div>
    )
}