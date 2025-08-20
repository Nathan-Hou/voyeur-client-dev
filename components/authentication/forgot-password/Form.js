"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { handleGetVerificationCode } from '@/utils/api-handlers/authentication-forms';
import s from "@/components/authentication/shared/Form.module.scss";
import NewAccountService from '@/services/account-service';
import { showToast } from '@/components/shared/toast/Config';
import { STATUS_MESSAGES } from '@/utils/api-handlers/error-messages/http-status';
import { AccountManagement } from '@/utils/api-handlers/error-messages/400-error';

// 定義表單驗證 schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: '請輸入信箱' })
    .email({ message: '請輸入有效的信箱格式' })
});

const Form = () => {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const email = watch('email');

  const onSubmit = async (data) => {
    try {
      // await handleGetVerificationCode(
      //   data.email, 
      //   router, 
      //   setVerificationStatus, 
      // );
      const res = await NewAccountService.forgotPassword(data?.email);
      showToast.success("請至信箱收取驗證信，若未收到請檢查垃圾信件。")
    } catch (error) {
      // setError('email', {
      //   type: 'manual',
      //   message: '驗證信發送失敗，請稍後再試'
      // });
      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
    }
  };

  return (
    <section className={`responsive-form relative`}>
      <Link href={`/login`} className="border border-primary bg-black rounded-full flex items-center justify-center w-[50px] h-[50px] mr-[-50px] absolute top-0 left-0 -translate-y-[8px]" >
          <ArrowLeft
              className="text-primary" 
              size={32} 
          />
      </Link>
      <div className="flex justify-center items-center text-2xl">
        <p className="ms-4 text-white">忘記密碼</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className={`${s.loginForm} !text-base`}>
        <div className={`${s.formItem} !mt-10`}>
          <div className={`${errors.email ? 'border-red-500' : ''}`}>
            <label htmlFor="email">信箱</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder='請輸入信箱'
              className={`${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || verificationStatus === 'sending'}
          className={`${s.mainBtn} btn-primary mt-4 lg:mt-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600
            ${(isSubmitting || verificationStatus === 'sending') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {verificationStatus === 'sending' ? '發送中...' : '獲取驗證信'}
        </button>
      </form>
    </section>
  );
};

export default Form;