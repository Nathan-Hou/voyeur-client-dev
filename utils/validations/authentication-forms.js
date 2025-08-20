import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 共用的基礎驗證規則
const commonValidations = {
  account: z
    .string()
    .min(1, '請輸入帳號')
    .max(50, '帳號不可超過 50 個字元'),
  
  email: z
    .string()
    .min(1, '請輸入電子信箱')
    .email('請輸入有效的電子信箱格式'),
  password: z
    .string()
    .min(6, '密碼至少需要 6 個字')
    .max(100, '密碼不可超過 100 個字元')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      '密碼需包含至少一個英文字母和一個數字'
    ),  
  confirmedPassword: z
    .string()
    .min(1, '請輸入確認密碼'),

  nickname: z
  .string()
  .min(1, '請輸入暱稱'),

  channelID: z
  .string()
  .min(1, '請輸入頻道 ID')
  .regex(
    /^[a-z0-9_-]{3,30}$/,
    '頻道 ID 只能包含小寫英文字母、數字、底線或連字符，且長度需介於 3-30 字元之間'
  ),

  phone: z
  .string()
  .min(1, '請輸入電話號碼')
  .regex(
    /^[\d()\-]{6,15}$/,
    '請輸入有效的電話號碼'
  ),
  
  verificationCode: z
    .string()
    .min(1, '請輸入驗證碼'),
    // .length(6, '驗證碼錯誤'),
  
  // agreeToTerms: z
  //   .boolean()
  //   .refine(val => val === true, {
  //     message: '請勾選同意《用户協議》與《隱私條款》'
  //   })
};

// 密碼確認的 refine 函數
const passwordMatchRefine = {
  refine: (data) => data.password === data.confirmedPassword,
  refinement: {
    message: "密碼與確認密碼不相符",
    path: ["confirmedPassword"]
  }
};

// 登入表單驗證模型
export const loginSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password,
});

// 註冊表單驗證模型
export const registerSchema = z.object({
  email: commonValidations.email,
  verificationCode: commonValidations.verificationCode,
  name: commonValidations.nickname, // 添加暱稱驗證
  // phone: commonValidations.phone, // 添加電話驗證
  password: commonValidations.password,
  confirmedPassword: commonValidations.confirmedPassword,
  // agreeToTerms: commonValidations.agreeToTerms
}).refine(
  (data) => data.password === data.confirmedPassword,
  {
    message: "密碼與確認密碼不相符",
    path: ["confirmedPassword"]
  }
);

// 重設密碼表單驗證模型
export const resetPasswordSchema = z.object({
  password: commonValidations.password,
  confirmedPassword: commonValidations.confirmedPassword,
}).refine(
  passwordMatchRefine.refine,
  passwordMatchRefine.refinement
);

// 導出常用的表單驗證配置
export const getFormValidationConfig = (schema) => ({
  resolver: zodResolver(schema),
  defaultValues: {
    // agreeToTerms: false,
    school: '',
    department: ''
  }
});