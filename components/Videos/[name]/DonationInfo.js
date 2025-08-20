"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import NewProjectService from '@/services/project-service';

export default function DonationInfo({ 
  userHasSupported = false, 
  userName,
  totalSupporters = 0,
  totalAmount = 0,
  userDonationAmount = 0,
  onSubmit,
  isLoading = false,
  minPrice = 0,
  averageAmount,
  projectSlug,
  isPublicPaymentAmount,
  onHideAmountChange,
  userId
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues, setError, clearErrors, trigger } = useForm({
    defaultValues: {
      amount: String(minPrice || 0),
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  const [isHideAmount, setIsHideAmount] = useState(false);
  const [isUpdatingHideStatus, setIsUpdatingHideStatus] = useState(false);

  const watchAmount = watch("amount");

  useEffect(() => {
    setIsHideAmount(!isPublicPaymentAmount);
  }, [isPublicPaymentAmount]);

  const handleHideAmountChange = async (checked) => {
    if (!projectSlug) return;

    setIsUpdatingHideStatus(true);
    try {
        const res = await NewProjectService.toggleProjectPaymentVisibility(projectSlug, checked);
        setIsHideAmount(checked);
        
        // 🆕 延遲觸發，確保後端處理完成
        if (onHideAmountChange) {
            setTimeout(() => {
                if (!userId) return;
                onHideAmountChange(userId, checked);
            }, 800); // 給後端 800ms 時間處理
        }
    } catch (error) {
        console.error('更新隱藏狀態失敗:', error);
        // 如果失敗，恢復原來的狀態
        setIsHideAmount(!checked);
    } finally {
        setIsUpdatingHideStatus(false);
    }
  };

  // 當 minPrice 改變時，更新表單的預設值
  useEffect(() => {
    if (minPrice > 0) {
      setValue('amount', String(minPrice), { 
        shouldValidate: false, 
        shouldDirty: false,
        shouldTouch: false 
      });
    }
  }, [minPrice, setValue]);

  // 全形數字轉半形數字的函數
  const convertFullWidthToHalfWidth = (str) => {
    return str.replace(/[０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
  };

  // 檢測是否包含非數字字符（除了全形數字）
  const hasNonNumericChars = (str) => {
    return /[^0-9０-９]/.test(str);
  };

  const handleDonationSubmit = (data) => {
    // 提交前轉換並驗證
    const convertedAmount = convertFullWidthToHalfWidth(data.amount);
    const numericAmount = parseInt(convertedAmount, 10);
    
    if (onSubmit) {
      onSubmit({ ...data, amount: numericAmount });
    }
  };

  // 處理輸入變化 - 修復版本
  const handleInputChange = async (e) => {
    const value = e.target.value;
    
    // 先更新值到 form state
    setValue('amount', value, { 
      shouldValidate: false, // 先不觸發驗證
      shouldDirty: true,
      shouldTouch: true 
    });
    
    // 然後觸發驗證
    setTimeout(async () => {
      await trigger('amount');
    }, 0);
    
    // 如果是純數字（包含全形），再進行轉換
    if (!hasNonNumericChars(value)) {
      const convertedValue = convertFullWidthToHalfWidth(value);
      
      // 如果轉換後的值和原值不同，再次更新
      if (convertedValue !== value) {
        setValue('amount', convertedValue, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true 
        });
      }
    }
  };

  return (
    <div className="donation-widget" id="support">
        <div className="support-container text-white p-4 pt-0 sm:px-0 sm:pt-4">
            <form onSubmit={handleSubmit(handleDonationSubmit)} className="support-form">
                <div className="support-header flex justify-between text-2xl lg:text-3xl tracking-[2px] max-sm:flex-col max-sm:gap-4">
                    <button 
                        type="submit" 
                        className="support-button bg-primary text-white rounded-[10px] flex sm:flex-grow sm:max-w-[40%] justify-center py-1 xl:py-2 hover:bg-primaryLightest hover:text-primary font-bold transition-colors"
                        disabled={isLoading || errors.amount}
                    >
                        {isLoading ? '處理中...' : userHasSupported ? '加碼支持' : '支持本計畫'}
                    </button>
                    <div className="amount-input-container flex items-center md:flex-grow md:max-w-[50%]">
                        <span className="currency mr-2">NT$</span>
                        <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9０-９]*"
                        className={`amount-input text-black inline-block px-2 py-1 xl:py-2 rounded-[10px] text-end flex-grow max-sm:max-w-[calc(100%-3.5rem)] ${errors.amount ? 'error' : ''}`}
                        {...register("amount", {
                            validate: {
                                required: (value) => {
                                if (!value || value?.trim() === '') {
                                    return "請輸入金額";
                                }
                                return true;
                                },
                                validFormat: (value) => {
                                if (hasNonNumericChars(value)) {
                                    return "請輸入數字";
                                }
                                return true;
                                },
                                validRange: (value) => {
                                // 如果格式不正確，跳過範圍檢查
                                if (hasNonNumericChars(value)) {
                                    return true; // 讓 validFormat 處理格式錯誤
                                }
                                
                                const convertedValue = convertFullWidthToHalfWidth(value);
                                const numericValue = parseInt(convertedValue, 10);
                                
                                if (isNaN(numericValue)) {
                                    return "請輸入有效的數字";
                                }
                                
                                if (numericValue < minPrice) {
                                    return `最低支持金額為 ${minPrice} 元`;
                                }
                                                                
                                return true;
                                }
                            }
                        })}
                        onChange={handleInputChange}
                        placeholder={minPrice}
                        />
                    </div>
                </div>
            </form>

            {errors.amount && (
                <div className="error-message text-red-400 text-end mt-2">
                {errors.amount.message}
                </div>
            )}

            <div className='mt-8 sm:mt-6'>
                {userHasSupported && (
                    <>
                        <div className="thank-you-message flex items-center justify-between">
                            <p>Hi，{userName}，感謝你的支持</p>
                            <div className='max-sm:hidden'>
                              <label className="custom-checkbox-container">
                                <input 
                                  type="checkbox" 
                                  checked={isHideAmount}
                                  onChange={(e) => handleHideAmountChange(e.target.checked)}
                                  disabled={isUpdatingHideStatus}
                                  className="custom-checkbox"
                                />
                                <span className="checkmark"></span>
                                <span className='ml-1 text-primary'>在排行榜上隱藏金額</span>
                              </label>
                            </div>
                        </div>
                        
                        <div className="user-donation mb-2 sm:mb-4">
                            <span className="donation-label">你的累積金額</span>
                            <span className="donation-amount">NT$ {userDonationAmount.toLocaleString()}</span>
                        </div>

                        <div className='sm:hidden flex justify-end'>
                          <label className="custom-checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={isHideAmount}
                              onChange={(e) => handleHideAmountChange(e.target.checked)}
                              disabled={isUpdatingHideStatus}
                              className="custom-checkbox"
                            />
                            <span className="checkmark"></span>
                            <span className='ml-1 text-primary'>在排行榜上隱藏金額</span>
                          </label>
                        </div>
                        
                        <div className="divider"></div>
                    </>
                )}
            
                <div className="stats">
                    <div className="stat-item">
                    <span className="stat-label">累積支持人數</span>
                    <span className="stat-value">{totalSupporters.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                    <span className="stat-label">總累積金額</span>
                    <span className="stat-value">NT$ {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="stat-item text-primary">
                    <span className="stat-label">解鎖 BONUS 金額</span>
                    <span className="stat-value !text-primary">
                      NT$ {averageAmount?.toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}
                    </span>
                    </div>
                </div>
            </div>
        </div>

      
      <style jsx>{`
        .support-button:disabled {
          cursor: not-allowed;
          transform: none;
        }
                                                                           
        .thank-you-message {
          margin-bottom: 16px;
          padding-top: 8px;
        }
        
        .user-donation {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .donation-label {
          font-size: 16px;
        }
        
        .donation-amount {
          font-weight: 600;
        }
        
        .divider {
          height: 1px;
          background: white;
          margin: 16px 0;
        }
        
        .stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
                
        .stat-value {
          font-weight: 600;
          color: white;
        }

        .custom-checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
        }

        .custom-checkbox {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          width: 20px;
          height: 20px;
        }

        .custom-checkbox:disabled {
          cursor: not-allowed;
        }

        .checkmark {
          position: relative;
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 1px solid #FF00D5;
          border-radius: 2px;
          background: transparent;
          transition: all 0.2s ease;
        }

        .custom-checkbox:checked + .checkmark {
          background: #FF00D5;
          border: 2px solid #FF00D5;
        }

        .custom-checkbox:checked + .checkmark:after {
          content: "";
          position: absolute;
          display: block;
          left: 3px;
          top: 0px;
          width: 6px;
          height: 10px;
          border: solid black;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .custom-checkbox:disabled + .checkmark {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .custom-checkbox:hover:not(:disabled) + .checkmark {
          border-color: #FF00D5;
        }
      `}</style>
    </div>
  );
};