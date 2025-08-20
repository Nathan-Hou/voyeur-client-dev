// // validation-schemas/profile.js
// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';

// // Profile 表單的驗證 schema
// export const profileSchema = z.object({
//   nickName: z.string().max(50, '暱稱不可超過 50 個字元').nullable(),
//   email: z.union([
//     z.string().max(100, '信箱不可超過 100 個字元')
//       .email('請輸入有效的電子信箱格式'),
//     z.literal('')  // 允許空字串
//   ]),
//   newPassword: z.string().optional(),
//   confirmedPassword: z.string().optional()
// }).refine(
//   // 確保 nickName 和 email 至少填寫一個
//   (data) => {
//     const hasNickName = data.nickName && data.nickName.trim() !== '';
//     const hasEmail = data.email && data.email.trim() !== '';
//     return hasNickName || hasEmail;
//   },
//   {
//     message: "暱稱和信箱請至少填寫一個",
//     path: ["nickName"] // 這個錯誤會顯示在暱稱欄位
//   }
// ).refine(
//   // 確保密碼一致
//   (data) => {
//     if (!data.newPassword && !data.confirmedPassword) return true;
//     return data.newPassword === data.confirmedPassword;
//   },
//   {
//     message: "密碼與確認密碼不相符",
//     path: ["confirmedPassword"]
//   }
// );

// // 導出表單驗證配置
// export const getProfileFormConfig = () => ({
//   resolver: zodResolver(profileSchema),
//   defaultValues: {
//     nickName: '',
//     email: '',
//     newPassword: '',
//     confirmedPassword: ''
//   }
// });


// validation-schemas/profile.js
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Profile 表單的驗證 schema
export const profileSchema = z.object({
  nickName: z.string().max(50, '暱稱不可超過 50 個字元').nullable(),
  email: z.union([
    z.string().max(100, '信箱不可超過 100 個字元')
      .email('請輸入有效的電子信箱格式'),
    z.literal('')
  ]),
  // newPassword: z.string()
  // .min(8, '密碼至少需要 8 個字')
  // .max(100, '密碼不可超過 100 個字元')
  // .regex(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  //   '密碼需包含至少一個大寫字母、一個小寫字母和一個數字'
  // ),

  // // 檢查密碼是否一致
  // if (data.newPassword || data.confirmedPassword) {
  //   if (data.newPassword !== data.confirmedPassword) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: "密碼與確認密碼不相符",
  //       path: ["confirmedPassword"]
  //     });
  //   }
  // }
});

// 導出表單驗證配置
export const getProfileFormConfig = () => ({
  resolver: zodResolver(profileSchema),
  defaultValues: {
    nickName: '',
    email: '',
    newPassword: '',
    confirmedPassword: ''
  },
  mode: 'onChange'
});