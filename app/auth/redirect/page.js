'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RedirectPage() {
  const { isAuthenticated } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // 如果已經嘗試重定向過，就不要再執行
    if (hasRedirected) return;

    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('to');

    if (!redirectTo) {
      window.location.href = '/';
      setHasRedirected(true);
      return;
    }

    if (isAuthenticated) {
      setHasRedirected(true);
      window.location.replace(redirectTo);  // 使用 replace 而不是 href
    }
  }, [isAuthenticated, hasRedirected]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
        <p className="text-lg">登入中，請稍候...</p>
      </div>
    </div>
  );
}