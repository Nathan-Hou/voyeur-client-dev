"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { Eye, EyeOff } from "lucide-react";

import Oauth from '../shared/Oauth';
import { loginSchema, getFormValidationConfig } from '@/utils/validations/authentication-forms';
import { handleLogin } from '@/utils/api-handlers/authentication-forms';
import { setAuthToken } from '@/utils/auth';
import { useAuth } from '@/contexts/AuthContext';
import CustomCaptcha from './CustomCaptcha';
import { showToast } from '@/components/shared/toast/Config';
import { base64Encode } from '@/utils/base64';

import { STATUS_MESSAGES } from '@/utils/api-handlers/error-messages/http-status';
import { AccountManagement } from '@/utils/api-handlers/error-messages/400-error';
// import ErrorBoundary from '@/components/shared/ErrorBoundry';

import s from "@/components/authentication/shared/Form.module.scss";
import NewAccountService from '@/services/account-service';

const Form = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm(
    getFormValidationConfig(loginSchema)
  );

  // 處理表單提交
  const onSubmit = async (data) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // 檢查驗證碼
      if (!isCaptchaValid) {
        showToast.error('驗證碼錯誤');
        return;
      }

      const { email, password } = data;
      const encodedEmail = base64Encode(email);
      const encodedPassword = base64Encode(password)

      const res = await NewAccountService.login({ encodedEmail, encodedPassword });
      const response = await login(res.data?.token);

      router.push("/");

    } catch (error) {
      console.error('登入失敗:', error);

      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
      return;

      // 這裡只處理真正未預期的錯誤
      // console.error('Unexpected error:', error);
      // showToast.error('發生未預期的錯誤');

    } finally {
      setIsSubmitting(false);
    }
  }

  // login page
  useEffect(() => {
    sessionStorage.removeItem('isLoggingOut');
      
    // 檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    // 如果存在 account_deactivated 參數，顯示 toast
    if (message === 'account_deactivated') {
      showToast.warning('帳號已被禁用，請聯繫管理員解鎖');
    }
  }, []);

  return (
    <SessionProvider>
    <section className={`responsive-form`}>
      <div className="flex justify-center items-center text-2xl">
        <p className="ms-4 text-white">登入</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className={`${s.loginForm} !text-base`}>
        {/* 信箱輸入框 */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.email ? 'border-red-500' : ''}`}>
            <label htmlFor="email" className='text-nowrap whitespace-nowrap'>
              信箱
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder='請輸入信箱'
            />
          </div>
          {errors.email && (
            <p>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* 密碼輸入框 */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.password ? 'border-red-500' : ''}`}>
            <label htmlFor="password" className='text-nowrap whitespace-nowrap'>
              密碼
            </label>
            <div className='relative grow'>
              <input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                {...register('password')}
                placeholder='請輸入密碼'
                className={`${s.pwdInput}`}
              />
              {
                isPasswordVisible ? (
                  <Eye className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-fourth mr-1.5" size={20} onClick={() => setIsPasswordVisible(false)} />
                ) : (
                  <EyeOff className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-fourth mr-1.5" size={20}  onClick={() => setIsPasswordVisible(true)} />
                )
              }
            </div>
          </div>
          {errors.password && (
            <p>
              {errors.password.message}
            </p>
          )}
        </div>

        <CustomCaptcha onValidate={setIsCaptchaValid} />

        {/* 送出按鈕 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${s.mainBtn} btn-primary mt-2.5 2xl:mt-5
            ${isSubmitting 
              ? 'primary-button-disabled' 
              : ''
            }
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600`}
        >
          {isSubmitting ? '登入中...' : '登入'}
        </button>
      </form>
      <div className="mt-2.5 flex justify-between">
        <Link href="/register" className='text-primary'>立即註冊</Link>
        <Link href="/forgot-password" className='text-primary'>忘記密碼</Link>
      </div>
      {/* <Oauth /> */}
    </section>
    </SessionProvider>
  );
};

export default Form;