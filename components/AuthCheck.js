'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCheck({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();

  // console.log("inside AuthCheck.");

  useEffect(() => {
    let isNavigating = false;

    const handleNavigation = async () => {
      if (isNavigating) return;

      // 使用 try-catch 來安全地訪問 sessionStorage
      let isLoggingOut = false;
      try {
        isLoggingOut = sessionStorage.getItem('isLoggingOut') === 'true';
      } catch (e) {
        console.error('sessionStorage is not available:', e);
      }

      if (isLoggingOut) {
        isNavigating = true;
        router.replace('/login');
        return;
      }

      if (isLoading || status === 'loading') {
        return;
      }

      if (isAuthenticated) {
        return;
      }

      if (session?.backendToken && !isAuthenticated && !isLoggingOut) {
        isNavigating = true;
        router.replace('/auth/handle-login');
        return;
      }

      if (!isAuthenticated && status === 'unauthenticated') {
        isNavigating = true;
        router.replace('/login');
      }
    };

    // 確保在客戶端環境中執行
    if (typeof window !== 'undefined') {
      const timeoutId = setTimeout(handleNavigation, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading, session, status, router]);
  
  // 安全地訪問 sessionStorage
  let isLoggingOut = false;
  if (typeof window !== 'undefined') {
    try {
      isLoggingOut = sessionStorage.getItem('isLoggingOut') === 'true';
    } catch (e) {
      console.error('sessionStorage is not available:', e);
    }
  }

  if (isLoggingOut) {
    return null;
  }

  if (isLoading || status === 'loading') {
    return null;
  }

  if (!isAuthenticated && session?.backendToken) {
    return null;
  }

  if (!isAuthenticated && status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}