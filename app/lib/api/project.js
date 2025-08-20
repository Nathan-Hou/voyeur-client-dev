export async function getProjects(page = 1, search = '', sortBy = 'id', pageSize = 10) {
    
    // console.log(`API 調用 - page: ${page}, search: "${search}", sortBy: ${sortBy}, pageSize: ${pageSize}`);

    try {
      // 構建 API URL 及參數
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Project/Search`);
      
      // console.log("url: ", url)

      // 構建 requestBody，包含搜尋參數
      const requestBody = {
        "pageRequestParameter": {
          "isReturnAllDataAndNoPage": false,
          "targetPage": page,
          "showCount": pageSize
        }
      };

      requestBody.search = search;

      // 添加排序參數
      if (sortBy) {
        requestBody.sortOrder = sortBy;
      }
      
      // console.log("requestBody: ", requestBody)

      // 發送請求到實際 API
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        cache: typeof window === 'undefined' ? 'no-store' : 'default'
      });
  
      // console.log("response: ", response);
      
      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }
      
      const apiData = await response.json();
      // console.log("API data: ", apiData);
      let allVideos = [...apiData?.data || []];
      
      if (search) {
        allVideos = allVideos.filter(video => 
          video.name.toLowerCase().includes(search.toLowerCase()) ||
          (video.creator.name && video.creator.name.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // 根據排序選項排序
      switch (sortBy) {
        case 'latest':
          allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          allVideos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'popular':
          allVideos.sort((a, b) => b.views - a.views);
          break;
        default:
          allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      
      // 根據請求的頁碼和分頁大小截取對應的資料部分
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      return allVideos;
      
      // 如果請求的頁面超出範圍，返回空陣列
      // if (startIndex >= allVideos.length) {
      //   return [];
      // }
      
      // 返回請求頁面的資料
      // console.log("allVideos.slice(startIndex, endIndex): ", allVideos.slice(startIndex, endIndex));
      // return allVideos.slice(startIndex, endIndex);
      
    } catch (error) {
      console.error('獲取影片資料失敗:', error);
      throw error;
    }
  }