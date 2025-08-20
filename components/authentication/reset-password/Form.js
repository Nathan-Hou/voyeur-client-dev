"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { showToast } from '@/components/shared/toast/Config';

import { resetPasswordSchema, getFormValidationConfig } from '@/utils/validations/authentication-forms';
import { handleResetPassword } from '@/utils/api-handlers/authentication-forms';
import { useAuth } from '@/contexts/AuthContext';

import s from "@/components/authentication/shared/Form.module.scss";
import NewAccountService from '@/services/account-service';
import { STATUS_MESSAGES } from '@/utils/api-handlers/error-messages/http-status';
import { AccountManagement } from '@/utils/api-handlers/error-messages/400-error';

const Form = ({ token }) => {
  const router = useRouter();
  const { userData } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch
  } = useForm(
    getFormValidationConfig(resetPasswordSchema)
  );

  useEffect(() => {
    if (userData) {
      router.push("/");
    }
  }, [userData]);

  // 處理表單提交
  const onSubmit = async (data) => {
    const { password, confirmedPassword } = data;
    if (password.trim() !== confirmedPassword.trim() || password.trim() === '' || confirmedPassword.trim() === '') {
      showToast.error('密碼格式錯誤');
      return;
    }

    try {
      const res = await NewAccountService.resetPassword(password, token);
      showToast.success("密碼已變更");
      router.push("/login");
  
    } catch (error) {
      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        console.error("Reset Password Error. ", error);
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
    }
  };
  
  return (
    <section className={`responsive-form`}>
      <div className="flex justify-center items-center text-2xl">
        <p className="ms-4 text-white">重設密碼</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className={`${s.registerForm} !text-base`}>

        {/* 密碼輸入框 */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.password ? 'border-red-500' : ''}`}>
            <label htmlFor="password">
              密碼
            </label>
            <div className='relative grow'>
              <input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                {...register('password')}
                placeholder='6位數以上，包含英數字'
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

        {/* 確認密碼輸入框 */}
        <div className={`${s.formItem}`}>
          <div className={`${errors.confirmedPassword ? 'border-red-500' : ''}`}>
            <label htmlFor="confirmedPassword">
              確認密碼
            </label>
            <div className='relative grow'>
              <input
                id="confirmedPassword"
                type={isPasswordVisible ? 'text' : 'password'}
                {...register('confirmedPassword')}
                placeholder='6位數以上，包含英數字'
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
          {errors.confirmedPassword && (
            <p>
              {errors.confirmedPassword.message}
            </p>
          )}
        </div>

        {/* 送出按鈕 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${s.mainBtn} btn-primary mt-4
            ${isSubmitting 
              ? 'primary-button-disabled' 
              : ''
            }
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600`}
        >
          {isSubmitting ? '重設中...' : '重設密碼'}
        </button>
      </form>

      <div className="mt-3 flex justify-end">
        <Link href="/forgot-password" className='text-primary'>重新獲取驗證信</Link>
      </div>
    </section>
  );
};

export default Form;