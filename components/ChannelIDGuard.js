'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const ChannelIDGuard = ({ children }) => {
  const { userData, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 不需要檢查 ChannelID 的頁面
  const exemptPaths = [
    '/profile',
    '/login',
    '/register',
    "/forgot-password",
    "/resetpkey",
    '/auth/handle-login',
    '/auth/redirect',
    // 可以添加其他不需要檢查的頁面
  ];

  // 檢查當前路徑是否需要 ChannelID
  const requiresChannelID = !exemptPaths.some(path => pathname.startsWith(path));

  useEffect(() => {
    // 還在載入中，不進行檢查
    if (isLoading) return;

    // 未登入用戶不需要檢查
    if (!isAuthenticated) return;

    // 不需要檢查的頁面
    if (!requiresChannelID) return;

    // 檢查用戶是否需要填寫 ChannelID
    // const needsChannelID = !userData?.channelID;

    // 暫時改成以下寫法，因為在進到別人的頻道時，會觸發兩次這個 useEffect，第一次的 userData 會是 null，因此 userData?.channelID 會變 falsy
    let needsChannelID = false;
    if (userData && !userData.channelID) {
      needsChannelID = true;
    }

    // console.log("inside ChannelIDGuard. isAuthenticated: ", isAuthenticated, " requiresChannelID: ", requiresChannelID, " needsChannelID: ", needsChannelID, " userData: ", userData);

    // if (needsChannelID) {
    //   // 直接重導向並顯示 toast
    //   router.replace('/profile?required=channelID');
    // }
  }, [isAuthenticated, isLoading, userData, pathname, requiresChannelID, router]);

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-gray-300 border-r-transparent"></div>
          <p className="mt-2">載入中...</p>
        </div>
      </div>
    );
  }

  // 正常顯示內容
  return <>{children}</>;
};

export default ChannelIDGuard;