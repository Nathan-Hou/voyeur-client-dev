'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';

export default function VideoCard({ video }) {
  return (
    <div className="bg-black rounded-[10px] overflow-hidden relative p-[1px] bg-gradient-to-br from-primary via-blue-300  to-indigo-400 max-w-md w-full group">
      <Link href={`/videos/${video?.slug}`} className='rounded-[10px]'>
        <div className="relative aspect-video bg-black rounded-t-[10px] overflow-hidden">
          {video.headerImage ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_PHOTO_BASE_URL}${video.headerImage}`}
              alt={video.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover rounded-t-[10px] group-hover:scale-105 transition-all duration-300 ease-in-out"
            />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center rounded-t-[10px]">
              <span className="text-gray-400">無縮圖</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-b-[10px] bg-black relative text-white">
          {/* <div className='before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-primary before:via-blue-300 before:to-indigo-400'></div> */}
          <h3 className="font-bold line-clamp-1 text-ellipsis">{video?.title}</h3>
          <div
            className="mt-4 line-clamp-2 flex-grow text-white/75 text-sm"
            dangerouslySetInnerHTML={{ __html: video?.introduction }}
          />
        </div>
      </Link>
    </div>
  );
}