"use client"; // 只在客戶端運行，確保可以正確顯示 toast

import { signOut } from "next-auth/react";
import axios from "axios";

import { showToast } from "@/components/shared/toast/Config";
import { setAuthToken } from "../auth";

// 定義每個 API 的狀態碼對應訊息
const LOGIN_STATUS_MESSAGES = {
  // 0: '登入成功',
  2000: '帳號或密碼錯誤',
  3000: '帳號已被禁用，請聯繫管理員解鎖',
  // 9999: '系統錯誤，請稍後再試'
};

const VERIFY_EMAIL_STATUS_MESSAGES = {
  // 0: '驗證碼已發送',
  1000: '操作失敗',
  2000: '信箱格式不正確',
  5000: '操作失敗，請稍後再試',
  9999: '系統錯誤，請稍後再試'
}

const REGISTER_STATUS_MESSAGES = {
  // 0: '註冊成功',
  4000: '信箱已被使用，請換一個信箱',
  5000: '推薦碼不存在',
  6000: '暱稱已被使用，請換一個暱稱',
  9999: '系統錯誤，請稍後再試'
};

// 忘記密碼的驗證信
const VERIFICATION_STATUS_MESSAGES = {
  // 0: '驗證碼已發送',
  1000: '信箱格式不正確',
  2000: '信箱格式不正確',
  3000: '查無此信箱',
  4000: '信箱格式不正確',
  9999: '系統錯誤，請稍後再試'
};

const RESET_PASSWORD_STATUS_MESSAGES = {
  1000: '重設密碼失敗，請稍後再試',
  2000: '驗證連結已失效，請重新獲取驗證信',
  5000: '重設密碼失敗，請稍後再試',
};


function base64Encode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode('0x' + p1);
  }));
}  

// 處理 API 回應的通用函數
const handleApiResponse = async (response, statusMessages, defaultErrorMsg, defaultSuccessMsg = null) => {
  try {
    const data = await response.json();
    // console.log("handleApiResponse");
    // console.log("data: ", data);
    
    // 檢查 response status 是否為 0 (成功)
    // if (data.status === "0") {
      if (defaultSuccessMsg) {
        showToast.success(defaultSuccessMsg);
      }
      return { success: true, data };
    // }
    
    // 根據 status 取得對應的錯誤訊息
    // const errorMessage = statusMessages[data.status] || defaultErrorMsg;
    // showToast.error(errorMessage);
    // return { success: false, error: errorMessage, status: data.status };
  } catch (error) {
    console.error('API response parsing error:', error);
    showToast.error('發生錯誤，請稍後再試');
    return { success: false, error: '發生錯誤，請稍後再試' };
  }
};

// 登入表單處理
export const handleLogin = async (data, router) => {
  const encodedEmail = base64Encode(data.email);
  const encodedPassword = base64Encode(data.password);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Account/Login?email=${encodedEmail}&abcd=${encodedPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // console.log("response: ", response);

    const result = await handleApiResponse(
      response,
      LOGIN_STATUS_MESSAGES,
      '登入失敗，請稍後再試'
    );

    // console.log("result: ", result);
    
    if (result.success) {
      // showToast.success(LOGIN_STATUS_MESSAGES[0]);  // 可選的成功提示
      return result.data;
    }

  } catch (error) {
    console.error('Login error:', error);
    showToast.error('發生錯誤，請稍後再試');
  }
};

// 獲取註冊驗證信
export const handleVerifyEmail = async (email, router, setVerificationStatus, setCountdown) => {
  // console.log("handleVerifyEmail. email: ", email);

  try {
    setVerificationStatus('sending');
    
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Account/GetVerifyCode`, {
      email
    });

    // console.log("handleVerifyEmail. ", response);

    // const result = await handleApiResponse(
    //   response,
    //   VERIFY_EMAIL_STATUS_MESSAGES,
    //   '驗證信發送失敗，請稍後重試',
    //   '請至信箱收取驗證信。如未看到，請檢查垃圾郵件'
    // );

    // console.log(result);
    
    if (result.success) {
      setVerificationStatus('sent');
    } else {
      setVerificationStatus('error');
    }
    return result?.data;
  } catch (error) {
    console.error('Send verification code error:', error);
    setVerificationStatus('error');
    // showToast.error('發生錯誤，請稍後再試');
    return Promise.reject(error);
  }
};


// 註冊表單處理
export const handleRegister = async (data, router, login) => {
  const { email, password, confirmedPassword, name, channelID } = data;

  const encodedEmail = base64Encode(email);
  const encodedPassword = base64Encode(password);
  const encodedConfirmedPassword = base64Encode(confirmedPassword);

  // console.log(encodedEmail, encodedPassword);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Account/Register?email=${encodedEmail}&pKey=${encodedPassword}&pKeyConfirm=${encodedConfirmedPassword}&name=${name}&channelID=${channelID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await handleApiResponse(
      response,
      REGISTER_STATUS_MESSAGES,
      '註冊失敗，請稍後再試',
      '註冊成功'
    );
    
    if (result.success) {
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }


    if (result.success) {
    }

  } catch (error) {
    console.error('Register error:', error);
    showToast.error('發生錯誤，請稍後再試');
  }
};

// 獲取重設密碼驗證信
export const handleGetVerificationCode = async (email, router, setVerificationStatus, setCountdown) => {

  if (!email || !email.includes('@')) {
    showToast.error('請輸入有效的電子信箱');
    return;
  }

  try {
    setVerificationStatus('sending');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Account/ForgetPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await handleApiResponse(
      response,
      VERIFICATION_STATUS_MESSAGES,
      '驗證信發送失敗，請稍後重試',
      '請至信箱收取驗證信。如未看到，請檢查垃圾郵件'
    );
    
    if (result.success) {
      setVerificationStatus('sent');
    } else {
      setVerificationStatus('error');
    }

  } catch (error) {
    console.error('Send verification code error:', error);
    setVerificationStatus('error');
    showToast.error('發生錯誤，請稍後再試');
  }
};

// 重設密碼
export const handleResetPassword = async (data, router) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/PwdReset.ashx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(
      response,
      RESET_PASSWORD_STATUS_MESSAGES,
      '密碼重設失敗，請稍後再試',
      '密碼重設成功'
    );
    
    if (result.success) {
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }

  } catch (error) {
    console.error('Reset password error:', error);
    showToast.error('發生錯誤，請稍後再試');
  }
};
