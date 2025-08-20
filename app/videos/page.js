import { Suspense } from 'react';
import VideoGridWrapper from '@/components/Videos/VideoGridWrapper';
// import SearchBar from '@/components/SearchBar';
import { getProjects } from '@/app/lib/api/project';

export const revalidate = 0;

export default async function HomePage({ searchParams }) {
  // 從 URL 搜尋參數中獲取關鍵字和排序方式
  // const search = await searchParams?.q || '';
  // const sortBy = await searchParams?.sort || 'latest';
  // console.log("inside homepage")
  
  // 在伺服器端獲取第一頁影片數據
  const initialVideos = await getProjects(1, "", "latest");
  
  return (
    <main className='page-main'>
      <div className="container mx-auto max-w-[1200px]">      
        <Suspense fallback={<p>載入中...</p>}>
          <VideoGridWrapper initialVideos={initialVideos} />
        </Suspense>
      </div>
    </main>
  );
}