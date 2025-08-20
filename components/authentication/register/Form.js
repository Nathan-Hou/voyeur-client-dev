"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Eye, EyeOff, RefreshCw, Edit3 } from "lucide-react";
import { showToast } from '@/components/shared/toast/Config';
import { useSession } from 'next-auth/react';
import { Info } from 'lucide-react';

import Oauth from '../shared/Oauth';
import { registerSchema, getFormValidationConfig } from '@/utils/validations/authentication-forms';
import { useAuth } from '@/contexts/AuthContext';
import { AgreementModal, TermsContent, PrivacyContent } from './Modals';
import { Tooltip } from '@/components/shared/Tooltip';
import { generateRandomUsername } from '@/utils/constants/register-username';

import s from "@/components/authentication/shared/Form.module.scss";

import NewAccountService from '@/services/account-service';
import { STATUS_MESSAGES } from '@/utils/api-handlers/error-messages/http-status';
import { AccountManagement } from '@/utils/api-handlers/error-messages/400-error';
import { base64Encode } from '@/utils/base64';

const Form = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { login } = useAuth();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [initialData, setInitialData] = useState(null); // handleGetProfile 得到的資料
  const nameInputRef = useRef(null); // 暱稱輸入框的 ref

  // Add new states for verification
  const [countdown, setCountdown] = useState(0);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const timerRef = useRef(null);
  // const [code, setCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch
  } = useForm(
    getFormValidationConfig(registerSchema)
  );

  const emailValue = watch('email');

  // 初始化時生成隨機暱稱
  useEffect(() => {
    const randomUsername = generateRandomUsername();
    setValue('name', randomUsername);
  }, [setValue]);

  // 重新生成暱稱
  const handleRegenerateUsername = () => {
    const newUsername = generateRandomUsername();
    setValue('name', newUsername);
  };

  // 自行輸入暱稱
  const handleCustomInput = () => {
    setValue('name', '');
    // 使用 setTimeout 確保 setValue 完成後再 focus
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 0);
  };

  // Handle verification code request
  const handleVerificationRequest = async () => {
    if (countdown > 0) {
      showToast.info('請稍後再試');
      return;
    }

    if (verificationAttempts >= 5) {
      showToast.error('已超過最大請求次數');
      return;
    }

    if (!emailValue) {
      showToast.error('請先輸入信箱');
      return;
    }

    try {
      setVerificationStatus("sending");
      const res = await NewAccountService.getVerifyCode(emailValue);
      showToast.success('請至信箱收取驗證信。如未看到，請檢查垃圾郵件');
      setVerificationAttempts(prev => prev + 1);
      startCountdown();
      if (res?.data) {
        localStorage.setItem("email_verify", JSON.stringify(res?.data));
      }
    } catch (error) {
      console.error("Registration Error. ", error);
      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
    } finally {
      setVerificationStatus("idle");
    }
  };

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const onSubmit = async (data) => {
    const { email, name, password, confirmedPassword, verificationCode } = data;

    if (password.trim() !== confirmedPassword.trim() || password.trim() === '' || confirmedPassword.trim() === '') {
      showToast.error('密碼格式錯誤或不一致');
      return;
    }

    const code = localStorage.getItem("email_verify") ? JSON.parse(localStorage.getItem("email_verify")) : "";

    if (!code || code.toString() !== data.verificationCode?.trim()) {
      showToast.error("驗證失敗，請重新輸入驗證碼");
      return;
    }

    const encodedEmail = base64Encode(email);
    const encodedPassword = base64Encode(password);
    const encodedConfirmedPassword = base64Encode(confirmedPassword);

    try {
      const res = await NewAccountService.register({
        encodedEmail,
        encodedPassword,
        encodedConfirmedPassword,
        name,
      });
      localStorage.removeItem("email_verify");
      showToast.success("註冊成功!");
      router.push("/login");
    } catch (error) {
      console.error("Registration Error. ", error);
      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
    }

  //   const res = await handleRegister({
  //     email: email,
  //     name: name.trim(),
  //     password,
  //     confirmedPassword
  //   }, router, login);
  };

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'google_register_required') {
      showToast.success('請註冊一個本地帳號以完成 Google 帳號綁定');
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user?.email) {
      setValue('email', session.user.email);
    }
  }, [session, setValue]);

  return (
    <section className={`${s.formSection} responsive-form`}>
      <div className="flex justify-center items-center text-2xl">
        {/* <div className="w-20 h-14 rounded-[0.75rem] bg-[#919191] text-white text-lg flex items-center justify-center">LOGO</div> */}
        {/* <img src="/images/shared/logo.png" className="w-12 h-12"></img> */}
        <p className="ms-4 text-white">註冊</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className={`${s.registerForm} !text-base flex flex-wrap justify-between`}>
        {/* Email input with verification button */}
        <div className={`${s.formItem}`}>
          <div className={`flex items-center ${errors.email ? 'border-red-500' : ''} flex gap-2`}>
            <div className="grow flex">
              <label htmlFor="email">信箱</label>
              <input
                id="email"
                type="text"
                {...register('email')}
                placeholder='請輸入信箱'
              />
            </div>
            <button
              type="button"
              onClick={handleVerificationRequest}
              disabled={countdown > 0 || verificationAttempts >= 5 || verificationStatus === 'sending'}
              className={`px-4 py-1.5 rounded-[10px] btn-primary text-white disabled:cursor-not-allowed whitespace-nowrap`}
            >
              {verificationStatus === 'sending'
                ? '發送中...'
                : countdown > 0 
                  ? `${countdown}秒後重試` 
                  : verificationAttempts > 0 
                    ? '重獲驗證碼'
                    : '獲取驗證碼'
              }
            </button>
          </div>
          {errors.email && <p>{errors.email.message}</p>}
        </div>

        {/* Verification code input */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.verificationCode ? 'border-red-500' : ''}`}>
            <label htmlFor="verificationCode">驗證碼</label>
            <input
              id="verificationCode"
              type="text"
              {...register('verificationCode')}
              placeholder='請輸入驗證碼'
            />
          </div>
          {errors.verificationCode && <p>{errors.verificationCode.message}</p>}
        </div>

        {/* Name input with random username buttons */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.name ? 'border-red-500' : ''}`}>
            <label htmlFor="name">暱稱</label>
            <input
              id="name"
              type="text"
              ref={nameInputRef}
              {...register('name')}
              placeholder='請輸入暱稱'
            />
          </div>
          {/* 暱稱操作按鈕 */}
          <div className="flex gap-4 mt-1 pl-4 sm:pl-6">
            <button
              type="button"
              onClick={handleRegenerateUsername}
              className="flex items-center gap-1 text-sm text-primary rounded-md transition-colors"
            >
              <RefreshCw size={14} />
              重新產生
            </button>
            <button
              type="button"
              onClick={handleCustomInput}
              className="flex items-center gap-1 text-sm text-primary rounded-md transition-colors"
            >
              <Edit3 size={14} />
              自行輸入
            </button>
          </div>
          {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
        </div>

        {/* Password input */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.password ? 'border-red-500' : ''}`}>
            <label htmlFor="password">密碼</label>
            <div className='relative grow'>
              <input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                {...register('password')}
                placeholder='6位數以上，包含英數字'
                className={`${s.pwdInput}`}
              />
              {isPasswordVisible ? (
                <Eye className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white/75 -mr-1 sm:mr-1.5" size={20} onClick={() => setIsPasswordVisible(false)} />
              ) : (
                <EyeOff className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white/75 -mr-1 sm:mr-1.5" size={20} onClick={() => setIsPasswordVisible(true)} />
              )}
            </div>
          </div>
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        {/* Confirm password input */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.confirmedPassword ? 'border-red-500' : ''}`}>
            <label htmlFor="confirmedPassword">確認密碼</label>
            <div className='relative grow'>
              <input
                id="confirmedPassword"
                type={isPasswordVisible ? 'text' : 'password'}
                {...register('confirmedPassword')}
                placeholder='6位數以上，包含英數字'
                className={`${s.pwdInput}`}
              />
              {isPasswordVisible ? (
                <Eye className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white/75 -mr-1 sm:mr-1.5" size={20} onClick={() => setIsPasswordVisible(false)} />
              ) : (
                <EyeOff className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white/75 -mr-1 sm:mr-1.5" size={20} onClick={() => setIsPasswordVisible(true)} />
              )}
            </div>
          </div>
          {errors.confirmedPassword && <p>{errors.confirmedPassword.message}</p>}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || verificationStatus === "sending"}
          className={`${s.mainBtn} btn-primary mt-2.5 2xl:mt-4 ${isSubmitting ? 'primary-button-disabled' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600`}
        >
          {isSubmitting ? '註冊中...' : '註冊'}
        </button>
      </form>

      {/* Modals */}
      <AgreementModal 
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="隱私權政策"
      >
        <PrivacyContent />
      </AgreementModal>

      <div className="mt-2.5 2xl:mt-3 flex justify-end">
        <Link href="/login" className='text-primary'>已有帳號，前往登入</Link>
      </div>
      {/* <Oauth /> */}
    </section>
  );
};

export default Form;