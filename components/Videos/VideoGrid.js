// components/VideoGrid.js - 修正後的組件
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import VideoCard from './VideoCard';
// import SortOptions from './SortOptions';
import { getProjects } from '@/app/lib/api/project';

export default function VideoGrid({ initialVideos, onSearchChange, onSortChange }) {
  const loadingRef = useRef(false);
  
  const [videos, setVideos] = useState(initialVideos || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 現在從 props 接收這些值，而不是在內部管理
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  // 當 props 更新時同步內部狀態
  useEffect(() => {
    // if (onSearchChange) {
    //   setSearch(onSearchChange);
    // }
    // console.log(`VideoGrid: onSearchChange 更新為 "${onSearchChange}"`);
    setSearch(onSearchChange || '');
    // 當關鍵字變化時重置分頁
    setPage(1);
    setHasMore(true);
  }, [onSearchChange]);
  
  useEffect(() => {
    if (onSortChange) {
      setSortBy(onSortChange);
    }
  }, [onSortChange]);

  // 在 VideoGrid.js 中，確保 initialVideos 變更時組件會重新渲染
// useEffect(() => {
//   // 當 initialVideos 改變時更新內部狀態
//   console.log("VideoGrid 收到新的 initialVideos:", initialVideos);
//   setVideos(initialVideos || []);
// }, [initialVideos]);

// 在 VideoGrid 組件中
useEffect(() => {
  // 當初始影片或搜尋關鍵字/排序方式改變時
  // console.log("VideoGrid 收到新的 initialVideos:", initialVideos);
  setVideos(initialVideos || []);
  
  // 重要：重置頁碼和 hasMore 狀態
  setPage(1);
  setHasMore(true); // 假設搜尋後還可能有更多結果
}, [initialVideos, search, sortBy]);
  
  // 載入更多影片的函數
  const loadMoreVideos = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      const nextPage = page + 1;
       // 記錄實際使用的關鍵字
      //  console.log(`VideoGrid: 加載第 ${nextPage} 頁，使用關鍵字: "${search}"`);
      
      // 直接使用 getProjects 函數獲取數據
      const newVideos = await getProjects(nextPage, search, "id");
      
      if (!newVideos || newVideos.length === 0) {
        // console.log('No more videos to load');
        setHasMore(false);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more videos:', error);
      setError('載入失敗，請稍後再試');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [page, search, sortBy, hasMore]);
  
  // 滾動監聽
  useEffect(() => {
    const handleScroll = () => {
      // if (loadingRef.current || isLoading || !hasMore) return;
      if (loadingRef.current || !hasMore) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;

      // 記錄滾動位置，以便調試
      // console.log(`Scroll position: ${scrollPosition}, Document height: ${documentHeight}`);
      
      // 當滾動到距離底部 300px 時觸發載入
      if (scrollPosition >= documentHeight - 300) {
        // console.log('Scroll triggered loading more videos');
        loadMoreVideos();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreVideos, isLoading, hasMore]);
  
  // 處理排序更改
  const handleSortChange = async (newSortBy) => {
    setSortBy(newSortBy);
    setPage(1); // 重置頁碼
    setHasMore(true); // 重置是否有更多
    setIsLoading(true);
    
    try {
      // 獲取排序後的第一頁結果
      const sortedResults = await getProjects(1, search, newSortBy);
      setVideos(sortedResults);
      
      // 檢查是否有更多結果
      if (!sortedResults || sortedResults.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('排序失敗:', error);
      setError('排序失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="page-title text-white">熱門影片</h2>
        {/* <SortOptions currentSort={sortBy} onSortChange={handleSortChange} /> */}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <VideoCard key={`${video.id}-${index}`} video={video} />
        ))}
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">載入中...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      )}
            
      {/* {!hasMore && videos.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          沒有更多影片了
        </div>
      )} */}
      
      {!hasMore && videos.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <p className="text-gray-500">沒有找到符合條件的影片</p>
        </div>
      )}
    </div>
  );
}