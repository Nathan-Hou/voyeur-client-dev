'use client'

import Cookies from 'js-cookie';

const TOKEN_STORAGE_KEY = 'auth_token';
// const TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天 (ms)
const TOKEN_DURATION = 3 * 60 * 1000; // 3 minutes

export const setAuthToken = async (token) => {
  // console.log("inside setAuthToken. token: ", token);

  // const { token } = token;
  // console.log("auth.js 13. token: ", token)

  try {
    const authData = {
      token: token,
      expiresAt: Date.now() + TOKEN_DURATION
    };

    // 設置 localStorage
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authData));

    // 設置 cookie
    const isProduction = process.env.NODE_ENV === 'production';
    Cookies.set('auth_token', token, {
      expires: new Date(Date.now() + TOKEN_DURATION),
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      secure: true
    });

    // console.log("setAuthToken. success");
    // 立即檢查設定結果
    // console.log("Specific cookie:", Cookies.get('auth_token'));
    // console.log(new Date(Date.now() + TOKEN_DURATION))
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
};

export const getStoredAuthToken = () => {
  // console.log("inside getStoredAuthToken.");
  try {
    // 先檢查 localStorage
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      // 如果 localStorage 沒有，檢查 cookie
      const cookieToken = Cookies.get('auth_token');
      // console.log("inside getStoredAuthToken. cookieToken: ", cookieToken);
      if (!cookieToken) return null;
      
      // 如果只有 cookie 有，重新同步到 localStorage
      const authData = {
        token: cookieToken,
        expiresAt: Date.now() + TOKEN_DURATION
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authData));
      return authData;
    }

    const authData = JSON.parse(stored);
    if (authData.expiresAt <= Date.now()) {
      removeAuthToken();
      return null;
    }

    // 確保 cookie 也存在
    const cookieToken = Cookies.get('auth_token');
    if (!cookieToken) {
      // 如果 cookie 不存在但 localStorage 存在，重新設置 cookie
      // console.log("auth.js 71")
      setAuthToken(authData.token)
    }

    return authData;
  } catch (error) {
    console.error('Error getting auth token:', error);
    removeAuthToken();
    return null;
  }
};

export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    Cookies.remove('auth_token', {
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// 檢查是否有有效的 token
export const hasValidToken = () => {
  const authData = getStoredAuthToken();
  return !!authData?.token;
};