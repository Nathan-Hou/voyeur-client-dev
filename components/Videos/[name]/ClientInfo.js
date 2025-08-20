"use client";

import { useEffect, useState } from "react";

import DonationInfo from "./DonationInfo";
import { useAuth } from "@/contexts/AuthContext";

import NewProjectService from "@/services/project-service";
import NewPaymentOrderService from "@/services/payment-order-service";
import { showToast } from "@/components/shared/toast/Config";
import { PaymentOrder } from "@/utils/api-handlers/error-messages/400-error";
import { STATUS_MESSAGES } from "@/utils/api-handlers/error-messages/http-status";

const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_MODE_BASE_URL;

export default function ClientInfo({ projectId, projectSlug, setIsLoginToDonateModalOpen, minPrice, isPublicPaymentAmount, onHideAmountChange }) {
    const { isAuthenticated, userData } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [projectPaymentSummary, setProjectPaymentSummary] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState(null);

    const parsePaymentHtml = (html) => {
      // 創建一個臨時的 DOM 元素來解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const form = doc.querySelector('form');
      
      if (form) {
        const formData = {
          action: form.getAttribute('action'),
          method: form.getAttribute('method'),
          inputs: {}
        };
        
        // 提取所有 input 的值
        const inputs = form.querySelectorAll('input[type="hidden"]');
        inputs.forEach(input => {
          formData.inputs[input.name] = input.value;
        });
        
        return formData;
      }
      return null;
    };

    const handleDonationSubmit = async (data) => {
      if (!isAuthenticated) {
        setIsLoginToDonateModalOpen(true);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const res = await NewPaymentOrderService.create({
          projectId,
          amount: data.amount,
          returnURL: `${baseUrl}/api/payment/callback/${projectSlug}`
        });
        const formData = parsePaymentHtml(res?.data?.htmlForm);
        setPaymentFormData(formData);
      } catch (error) {
        console.error('支持錯誤:', error);
        if (error?.response?.status === 400) {
          showToast.error(PaymentOrder[error?.response?.data?.errorCode] || PaymentOrder["default"]);
        } else {
          showToast.error(STATUS_MESSAGES[error?.response?.status] || STATUS_MESSAGES["default"]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpenLineQRCode = () => {
      window.open('https://line.me/ti/g2/tiiWa6WNYjdkA1TgvbNc-RdGuV9pwPPzYwLKvA', '_blank', 'noopener,noreferrer');
    }

    useEffect(() => {
      const fetchData = async () => {
        if (!projectSlug) return;
        try {
          const res = await NewProjectService.getPaymentSummary(projectSlug);
          setProjectPaymentSummary(res?.data);
        } catch (e) {
          console.error("Error fetching project payment summary. ", e);
          showToast.error(STATUS_MESSAGES[e?.response?.status] || STATUS_MESSAGES["default"]);
        }
      }
      fetchData();
    }, [projectSlug]);

    // 當 paymentFormData 設定後，自動提交表單
    useEffect(() => {
      if (paymentFormData) {
        // 創建隱藏的表單並提交
        const form = document.createElement('form');
        form.action = paymentFormData.action;
        form.method = paymentFormData.method;
        form.style.display = 'none';
        
        // 添加所有隱藏字段
        Object.entries(paymentFormData.inputs).forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      }
    }, [paymentFormData]);

    return (
        <div className="mt-[80px] flex flex-col">
      <DonationInfo
        userHasSupported={isAuthenticated && projectPaymentSummary?.myTotalAmount ? true : false}
        totalSupporters={projectPaymentSummary?.uniquePayerCount}
        totalAmount={projectPaymentSummary?.totalAmount}
        onSubmit={handleDonationSubmit}
        isLoading={isLoading}
        userDonationAmount={projectPaymentSummary?.myTotalAmount}
        userName={userData?.name || userData?.email}
        minPrice={minPrice}
        averageAmount={projectPaymentSummary?.medianAmount}
        projectSlug={projectSlug}
        isPublicPaymentAmount={isPublicPaymentAmount}
        onHideAmountChange={onHideAmountChange}
        userId={userData?.email}
      />
            {!!projectPaymentSummary?.myTotalAmount && (
              <div className="max-sm:px-4 flex justify-end">
                <button className="border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 ease-in-out lg:mt-5 w-full sm:w-fit self-end rounded-[10px] px-3 py-1.5 sm:py-1" onClick={handleOpenLineQRCode}>加入 VIP LINE 社群</button>
              </div>
            )}
        </div>
    )
}