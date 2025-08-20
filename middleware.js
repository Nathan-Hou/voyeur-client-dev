import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const response = NextResponse.next();
  const currentPath = request.nextUrl.pathname;

  console.log("currentPath: ", currentPath);

  // ===== 根路徑重導向到首頁 =====
  if (currentPath === '/') {
    return NextResponse.redirect(new URL('/videos', request.url));
  }

  // ===== 特殊頁面允許訪問 =====
  if (currentPath === '/login' && request.nextUrl.searchParams.get('message') === 'account_deactivated') {
    return response;
  }

  // 允許訪問重導向和登入處理頁面
  if (currentPath === '/auth/redirect' || currentPath === '/auth/handle-login') {
    return response;
  }

  // ===== 取得認證狀態 =====
  const session = await getToken({ req: request });
  if (session?.isLoggingOut) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const googleToken = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  console.log("googleToken: ", googleToken);

  const localToken = request.cookies.get('auth_token');
  console.log("middleware. localToken: ", localToken);

  // ===== 公開路徑 =====
  const publicPaths = [
    '/videos',
    '/login',
    '/register',
    '/forgot-password',
  ];

  // 檢查是否為公開路徑
  const isPublicPath = publicPaths.some(path => currentPath === path) || 
                      currentPath.match(/^\/videos\/[^\/]+$/) || // 匹配 /videos/[name]
                      currentPath.match(/^\/resetpkey\/[^\/]+$/); // 匹配 /resetpkey/[token]

  // ===== Google 登入狀態處理 =====
  if (googleToken) {
    // 如果是認證相關頁面，允許訪問
    if (currentPath === '/login' || 
        currentPath === '/register' || 
        currentPath === '/auth/handle-login') {
      return response;
    }

    // 如果已經有 local token，允許訪問所有頁面
    if (localToken) {
      return response;
    }
    
    // 如果是公開路徑，允許訪問
    if (isPublicPath) {
      return response;
    }
    
    // 其他情況導向到 handle-login
    return NextResponse.redirect(new URL('/auth/handle-login', request.url));
  }

  // ===== 受保護路徑檢查 =====
  const protectedPaths = [
    '/user',  // 個人資料頁面
  ];

  // 檢查是否為受保護路徑
  const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path)) ||
                         currentPath.match(/^\/videos\/[^\/]+\/[^\/]+$/); // 匹配 /videos/[name]/[id]

  // 如果是受保護路徑但沒有 local token，重導向到登入頁
  if (isProtectedPath && !localToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ===== 已登入用戶訪問認證頁面的處理 =====
  if (localToken && (currentPath === '/login' || currentPath === '/register')) {
    // 已登入用戶訪問登入/註冊頁面時，重導向到首頁
    return NextResponse.redirect(new URL('/videos', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // 根路徑
    '/',
    // 認證相關頁面
    '/login',
    '/register', 
    '/forgot-password',
    '/resetpkey/:path*',
    '/auth/handle-login',
    '/auth/redirect',
    // 受保護的路徑
    '/user/:path*',
    // 公開但需要處理的路徑
    '/videos/:path*',
  ],
};