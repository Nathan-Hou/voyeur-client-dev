'use client';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { updateServerToken, removeServerToken } from '@/app/actions/auth';
import { getStoredAuthToken, removeAuthToken, setAuthToken } from '@/utils/auth';
import NewAccountService from '@/services/account-service';

const TOKEN_DURATION = 3 * 60 * 1000; // 3 minutes

const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  userData: null,
  login: () => {},
  logout: () => {},
  refreshUserData: () => {}, // 新增：手動刷新用戶資料
  updateUserData: () => {}   // 新增：直接更新用戶資料
});

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const intervalId = useRef(null);

  // 獲取用戶資料的函數（提取出來以便重用）
  const fetchUserData = useCallback(async () => {
    try {
      const res = await NewAccountService.getDetails();
      setUserData(res?.data);
      return res?.data;
    } catch (e) {
      console.error("Failed to get profile. ", e);
      throw e;
    }
  }, []);

  // 手動刷新用戶資料的函數
  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated) return null;
    return await fetchUserData();
  }, [isAuthenticated, fetchUserData]);

  // 直接更新用戶資料的函數（用於樂觀更新）
  const updateUserData = useCallback((newData) => {
    setUserData(prevData => ({
      ...prevData,
      ...newData
    }));
  }, []);

  // 初始化檢查
  useEffect(() => {
    const checkAuth = () => {
      const authData = getStoredAuthToken();
      setIsAuthenticated(!!authData?.token);
      setIsLoading(false);
      // console.log("inside checkAuth. authData: ", authData);
    };

    checkAuth();
  }, []);

  // 當認證狀態改變時獲取用戶資料
  useEffect(() => {
    if (isAuthenticated) {
      // console.log("inside isAuthenticated useEffect. isAuthenticated is true.")
      fetchUserData();
    } else {
      // console.log("inside isAuthenticated useEffect. isAuthenticated is false.")
      setUserData(null);
    }
  }, [isAuthenticated, fetchUserData]);

  // 重試函數
  const refreshTokenWithRetry = async (retryCount = 0) => {
    // console.log("inside refreshTokenWithRetry. retryCount: ", retryCount);

    const auth = getStoredAuthToken();
    if (!auth) return false;

    try {
      const res = await NewAccountService.getDetails();
      if (res.data.token) {
        await setAuthToken(res.data.token);
        // await updateServerToken(JSON.stringify({expiresAt: Date.now() + TOKEN_DURATION, token: res.data.token}));
      }
      setUserData(res.data);
      return true;
    } catch (error) {
      console.error(`Token refresh attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < 10 - 1) {
        await delay(1000);
        return refreshTokenWithRetry(retryCount + 1);
      }
      
      console.error('All token refresh attempts failed');
      return false;
    }
  };

  // token 自動更新檢查
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiry = async () => {
      const auth = getStoredAuthToken();
      // console.log("inside checkTokenExpiry. auth: ", auth);
      if (!auth) return;

      // const tokenExpiryThreshold = 4 * 24 * 60 * 60 * 1000; // ４ 天 (ms)
      const tokenExpiryThreshold = 2 * 60 * 1000; // 2 minutes
      if (auth.expiresAt - Date.now() < tokenExpiryThreshold) {
        const refreshSuccess = await refreshTokenWithRetry();
        if (!refreshSuccess) {
          logout();
        }
      }
    };

    checkTokenExpiry();
    // intervalId.current = setInterval(checkTokenExpiry, 60 * 60 * 1000); // 1 小時 (ms)
    intervalId.current = setInterval(checkTokenExpiry, 10 * 1000); // 10 秒 (ms)
    
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [isAuthenticated]);

  const login = (token) => {
    // console.log("login. token: ", token);
    // console.log("AuthContext.js 159")
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      sessionStorage.setItem('isLoggingOut', 'true');
      await removeAuthToken(); // 客戶端清除
      await removeServerToken(); // 伺服器端清除
      setIsAuthenticated(false);
      setUserData(null);
      await signOut({ redirect: false });
      router.replace('/login');
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userData,
      isLoading,
      login,
      logout,
      refreshUserData,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);