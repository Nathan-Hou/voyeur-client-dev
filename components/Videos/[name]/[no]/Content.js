"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import ThreejsCanvas from "@/components/Threejs/Canvas";

import NewProjectService from "@/services/project-service";

export default function VideoDetails() {
  const params = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
      const fetchData = async () => {
          if (!params?.no) return;
          try {
            const res = await NewProjectService.getDetailsWithAuth(params.name);
            // [Todo] 是否可能為使用者未登入或未購買？應該改成 navigate，但要一律導回計畫頁面嗎？
            if (!res?.data || !res?.data?.videos?.length) return;
            
            const targetVideo = res?.data?.videos?.find((i) => i.id.toString() === params.no);
            // [Todo] 是否可能為使用者未登入或未購買？應該改成 navigate，但要一律導回計畫頁面嗎？
            if (!targetVideo || !targetVideo?.cameras?.length) return;
            setData(targetVideo);
          } catch (e) {
              console.error(`Error fetching project data. `, e);
          }
      }
      fetchData();
  }, [params.no]);

  return (
    <ThreejsCanvas
      isFullscreen={true}
      videoSources={data?.cameras?.map(camera => camera.url)}
    />
  )
}