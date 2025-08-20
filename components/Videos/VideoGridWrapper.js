'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VideoGrid from './VideoGrid';
import { getProjects } from '@/app/lib/api/project';

export default function VideoGridWrapper({ 
  initialVideos, 
  initialSearch = '', 
  initialSort = 'latest' 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [videos, setVideos] = useState(initialVideos || []);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSort);
  const [isLoading, setIsLoading] = useState(false);
  
  // 監聽 URL 參數變化
  useEffect(() => {
    const urlSearch = searchParams.get('q') || '';
    const urlSort = searchParams.get('sort') || 'latest';
    
    if (urlSearch !== search || urlSort !== sortBy) {
      setSearch(urlSearch);
      setSortBy(urlSort);
      handleSearch(urlSearch, urlSort);
    }
  }, [searchParams]);
  
  const handleSearch = async (searchTerm, sort = sortBy) => {
    // console.log(`處理搜尋關鍵字: "${searchTerm}"`);
    setIsLoading(true);
    
    try {
      const searchResults = await getProjects(1, searchTerm, sort);
      // console.log("搜尋結果:", searchResults);
      setVideos(searchResults || []);
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    // 更新 URL 參數
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    if (search) params.set('q', search);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      )}
      
      <VideoGrid 
        initialVideos={videos} 
        onSearchChange={search}
        onSortChange={sortBy}
      />
    </>
  );
}