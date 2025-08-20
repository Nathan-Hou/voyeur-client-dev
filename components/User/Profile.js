"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Pencil, Trash2, Info, AlertCircle } from 'lucide-react';

import { showToast } from '@/components/shared/toast/Config';
import { useAuth } from '@/contexts/AuthContext';

import NewAccountService from '@/services/account-service';
import { STATUS_MESSAGES } from '@/utils/api-handlers/error-messages/http-status';
import { AccountManagement } from '@/utils/api-handlers/error-messages/400-error';

import s from "./Profile.module.scss";

const Profile = () => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      name: '',
      newPassword: '',
      newPasswordConfirm: ''
    }
  });

  const { userData, refreshUserData, updateUserData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
    
  // 用於頭像上傳和管理
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false); // 新增：追蹤是否已顯示過 toast
  const avatarInputRef = useRef(null);
  
  // 頁面載入時獲取個人資料並顯示提示
  useEffect(() => {
    if (userData) {
      setValue('name', userData.name || '');
      
      // 設置頭像如果存在
      if (userData.profilePicture) {
        setAvatarUrl(`${process.env.NEXT_PUBLIC_PHOTO_BASE_URL}${userData.profilePicture}`);
      }
    }
  }, [setValue, userData]);

  // 從完整的圖片URL中提取路徑部分的輔助函數
  const extractImagePath = (imageUrl) => {
    if (!imageUrl) return "";
    
    const basePath = process.env.NEXT_PUBLIC_PHOTO_BASE_URL;
    if (basePath && imageUrl.startsWith(basePath)) {
      return imageUrl.substring(basePath.length);
    }
    return imageUrl;
  };    
  
  // 處理表單提交 - 使用混合方式
  const onSubmit = async (data) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        name: data.name,
        profilePicture: extractImagePath(avatarUrl),
      };
      
      if (data.newPassword) {
        updateData.newPassword = data.newPassword;
        updateData.newPasswordConfirm = data.newPasswordConfirm;
      }
            
      // 樂觀更新
      const originalUserData = userData;
      updateUserData({
        name: data.name,
        profilePicture: extractImagePath(avatarUrl)
      });
      
      try {
        const response = await NewAccountService.update(updateData);
        
        if (response.data && Object.keys(response.data).length > 0) {
          updateUserData(response.data);
        } else {
          await refreshUserData();
        }
        
        showToast.success('資料已更新');
        
        // 清空密碼欄位
        // setValue('newPassword', '');
        // setValue('newPasswordConfirm', '');
                
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } catch (error) {
        updateUserData(originalUserData);
        throw error;
      }
      
    } catch (error) {
      console.error('更新資料失敗:', error);
      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 處理頭像上傳
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await NewAccountService.uploadImage(formData);
      
      if (res && res.data) {
        const newAvatarUrl = `${process.env.NEXT_PUBLIC_PHOTO_BASE_URL}${res.data}`;
        setAvatarUrl(newAvatarUrl);
        
        updateUserData({
          profilePicture: res.data
        });
        
        showToast.success('頭像已上傳');
      }
    } catch (error) {
      console.error('Error uploading profile. ', error);
      if (error?.response?.status === 400) {
        showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
      } else {
        showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      handleAvatarUpload(file);
    }
  };
  
  const handleAvatarClick = () => {
    avatarInputRef.current.click();
  };
  
  const deleteAvatar = async () => {
    if (window.confirm('確定要刪除頭像嗎？')) {
      try {
        const res = await NewAccountService.deleteImage();
        
        setAvatarUrl(null);
        updateUserData({
          profilePicture: null
        });
        
        showToast.success('頭像已刪除');
      } catch (error) {
        console.error('刪除頭像失敗:', error);
        if (error?.response?.status === 400) {
          showToast.error(AccountManagement[error?.response?.data?.errorCode] || AccountManagement["default"]);
        } else {
          showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
          console.error("Error deleting profile. ", error);
        }
      }
    }
  };
  
  const newPassword = watch('newPassword');
  
  return (
    <div className="responsive-form">
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-gray-300 border-r-transparent"></div>
          <p className="mt-2">載入中...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div 
                className="w-28 h-28 rounded-full overflow-hidden border border-white bg-black relative group cursor-pointer"
                onClick={handleAvatarClick}
              >
                {avatarUrl ? (
                  <>
                    <img 
                      src={avatarUrl} 
                      alt="頭像" 
                      className="w-full h-full object-cover absolute top-0 left-0" 
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarClick();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full mx-2"
                        title="修改"
                        disabled={isSaving}
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAvatar();
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full mx-2"
                        title="刪除"
                        disabled={isSaving}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Upload size={24} className="mx-auto text-white" />
                    <p className="mt-1 text-xs text-white">上傳頭像</p>
                  </div>
                )}
              </div>
              
              <input 
                type="file"
                ref={avatarInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange}
                disabled={isSaving}
              />
              
              {isSaving && (
                <div className="mt-2 text-center text-sm">
                  上傳中...
                </div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${s.form}`}>
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-24 mr-4 text-white">名稱</label>
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-[10px] p-2 input-focus-border"
                  {...register('name', { required: '請輸入名稱' })}
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm ml-32">{errors.name.message}</p>
              )}
            </div>
            
            <div className="border-t border-gray-200 !my-10"></div>
            
            <div>
              <h2 className="text-xl font-bold mb-6 text-white">更改密碼</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="w-24 mr-4 text-white">新密碼</label>
                  <input
                    type="password"
                    className="flex-1 border border-gray-300 rounded-[10px] p-2 input-focus-border"
                    {...register('newPassword', { 
                      minLength: {
                        value: 6,
                        message: '密碼長度至少為6個字符'
                      },
                      pattern: {
                        value: /^(?=.*[a-zA-Z]).{6,}$/,
                        message: '密碼必須至少6位數且包含至少一個英文字母'
                      }
                    })}
                    disabled={isSubmitting}
                    autoComplete='new-password'
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm ml-32">{errors.newPassword.message}</p>
                )}
                
                {/* 密碼要求提示 */}
                {newPassword && (
                  <div className="ml-32 text-sm">
                    <p className="text-gray-100 mb-1">密碼要求：</p>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${newPassword.length >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                        <span className={newPassword.length >= 6 ? 'mr-2' : 'mr-2.5'}>{newPassword.length >= 6 ? '✓' : '✕'}</span>
                        至少 6 個字符
                      </li>
                      <li className={`flex items-center ${/[a-zA-Z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'}`}>
                        <span className="mr-2">{/[a-zA-Z]/.test(newPassword) ? '✓' : '✕'}</span>
                        包含至少一個英文字母
                      </li>
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center">
                  <label className="w-24 mr-4 text-white">確認密碼</label>
                  <input
                    type="password"
                    className="flex-1 border border-gray-300 rounded-[10px] p-2 input-focus-border"
                    {...register('newPasswordConfirm', { 
                      validate: value => 
                        !newPassword || value === newPassword || '新密碼與確認密碼不一致'
                    })}
                    disabled={isSubmitting}
                    autoComplete='new-password'
                  />
                </div>
                {errors.newPasswordConfirm && (
                  <p className="text-red-500 text-sm ml-32">{errors.newPasswordConfirm.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`w-full py-3 rounded-[10px] transition btn-primary`}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? '儲存中...' 
                  : '儲存'
                }
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Profile;