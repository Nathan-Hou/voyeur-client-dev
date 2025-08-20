'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, SessionProvider, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/utils/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from 'lucide-react';

import NewAccountService from '@/services/account-service';
import { showToast } from '@/components/shared/toast/Config';

function HandleLoginContent() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const { login } = useAuth();
  
  // 使用 ref 來追蹤是否已處理過登入
  const isProcessingRef = useRef(false);
  const hasProcessedRef = useRef(false);
  
  // 可選：使用 state 來追蹤處理狀態
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      console.log("handleAuth triggered, status:", status, "hasProcessed:", hasProcessedRef.current);
      
      // 防止重複執行
      if (isProcessingRef.current || hasProcessedRef.current) {
        console.log("Already processing or processed, skipping");
        return;
      }

      // 等待 session 加載完成
      if (status === 'loading') {
        console.log("Still loading, waiting...");
        return;
      }

      // 如果沒有 session 且狀態不是 authenticated，處理未認證情況
      if (status === 'unauthenticated') {
        console.log("unauthenticated");
        const currentSession = await getSession();
        if (!currentSession?.backendToken) {
          console.log("No backend token, redirecting to login");
          router.replace('/login');
          return;
        }
      }

      // 如果沒有 backendToken，不進行處理
      if (!session?.backendToken) {
        console.log("No backendToken in session");
        return;
      }

      // 開始處理登入
      isProcessingRef.current = true;
      setIsProcessing(true);
      
      try {
        console.log("Processing login with backendToken");
        
        await setAuthToken(session.backendToken);
        const res = await NewAccountService.getDetails();
        console.log("handleAuth. res: ", res);
        
        login(res.data.token);
        
        // 標記為已處理，防止重複執行
        hasProcessedRef.current = true;
        console.log("marked hasProcessedRef.current as true");
        console.log("Login complete, redirecting to home");
        router.replace('/');
        
      } catch (error) {
        console.error('Error setting token:', error);
        router.replace('/login');
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    };

    handleAuth();
  }, [session, status, router, login]);

  // 清理函數：組件卸載時重置狀態
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
    };
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-transparent">
      <div className="text-center">
        <Loader className="mx-auto h-8 w-8 animate-spin text-white" />
        <p className="mt-4 text-lg font-medium text-white">
          {status === 'loading' ? '載入中...' : '登入中...'}
        </p>
        {/* 可選：顯示處理狀態 */}
        {isProcessing && (
          <p className="mt-2 text-sm text-gray-300">
            載入中...
          </p>
        )}
      </div>
    </div>
  );
}

export default function HandleLogin() {
  return (
    <SessionProvider refetchInterval={0}>
      <HandleLoginContent />
    </SessionProvider>
  );
}