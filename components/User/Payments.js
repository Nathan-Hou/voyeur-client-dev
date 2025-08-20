"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Pencil, Trash2, Info, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

import { showToast } from '@/components/shared/toast/Config';
import { useAuth } from '@/contexts/AuthContext';

import NewAccountService from '@/services/account-service';
import NewProjectService from '@/services/project-service';
import { STATUS_MESSAGES } from '@/utils/api-handlers/error-messages/http-status';
import { AccountManagement } from '@/utils/api-handlers/error-messages/400-error';

import s from "./Payments.module.scss";

const Payments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();
  const [searchProject, setSearchProject] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleNavigate = (projectId) => {
    if (!projectId || !projectOptions || !projectOptions?.length) return;
    const targetProject = projectOptions.find((i) => projectId === i?.id);
    if (!targetProject.slug) return;
    router.push(`/videos/${targetProject.slug}`);
  }

  // 初次載入時執行，使用 Promise.all 同時呼叫兩個 API
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [paymentResponse, projectResponse] = await Promise.all([
        NewAccountService.getMyPayments(),
        NewProjectService.search(1, 10, "", "id", "Descending", true)
      ]);
      setPaymentData(paymentResponse?.data);
      setProjectOptions(projectResponse?.data?.data);      
    } catch (e) {
      console.error('Error fetching initial data. ', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 只執行 fetchPaymentData
  const fetchPaymentData = async () => {
    try {
      const res = await NewAccountService.getMyPayments(searchProject);
      setPaymentData(res?.data);
    } catch (e) {
      console.error('Error fetching payment data. ', e);
      setError(e.message);
    }
  };

  // 初次載入時執行
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 監聽 searchProject 變化，重新執行 fetchPaymentData
  useEffect(() => {
    if (searchProject !== null) {
      fetchPaymentData(searchProject);
    }
  }, [searchProject]);

  // 處理計畫選擇變化
  const handleProjectChange = (e) => {
    setSearchProject(e.target.value);
  };

  return (
    <div className={``}>
      <div className="">
        <div className="sticky top-0 pb-4 z-10 bg-black">
          
          {/* Search and filter controls */}
          <div className="space-y-4">
            <div className="flex justify-between">
            <h2 className="page-title">贊助紀錄</h2>
              <select
                id="projectSelect"
                value={searchProject ? searchProject?.title : ""}
                onChange={handleProjectChange}
                className="px-3 py-2 border border-gray-300 rounded-[10px] !bg-black"
                disabled={loading}
              >
                <option value="" className='!bg-black'>全部計畫</option>
                {projectOptions?.map(project => (
                  <option key={project.id} value={project?.slug} className='!bg-black'>
                    {project.title || `Project ${project.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading 狀態 */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-600">載入中...</div>
          </div>
        )}

        {/* Error 狀態 */}
        {/* {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">錯誤: {error}</span>
            </div>
          </div>
        )} */}

        {/* Payment list */}
        {paymentData && paymentData?.length > 0 && (
          <div className={`sticky top-0 max-sm:text-[15px]`}>
            {/* Table header */}
            <div className="flex items-center py-4 sm:px-4 border-b border-primaryLightest font-bold justify-between bg-black text-primaryLightest">
              <div className="flex-1 flex">
                <div className="w-[25%]">計畫名稱</div>
                <div className="w-[25%]">金額</div>
                {/* <div className="w-[20%]">付款狀態</div> */}
                <div className="w-[25%]">付款方式</div>
                <div className="w-[25%]">付款日期</div>
              </div>
            </div>

            {/* Table body */}
            <div className={`${s.tableContent} overflow-auto`}>
              {paymentData.map((payment, index) => (
                <button key={payment.id} className={`flex items-center py-4 sm:px-4 justify-between w-full text-start ${index === paymentData?.length - 1 ? "" : "border-b border-white/25"}`} onClick={() => handleNavigate(payment?.projectId)}>
                  <div className="flex-1 flex">
                    <div className="w-[25%] wrap-anywhere pr-4" style={{overflowWrap: "break-word"}}>{payment.projectTitle}</div>
                    <div className="w-[25%] wrap-anywhere pr-4" style={{overflowWrap: "break-word"}}>{payment.amount}</div>
                    {/* <div className="w-[20%] wrap-anywhere pr-4" style={{overflowWrap: "break-word"}}>{payment.status}</div> */}
                    <div className="w-[25%] wrap-anywhere pr-4" style={{overflowWrap: "break-word"}}>{payment.paymentMethod}</div>
                    <div className="w-[25%] wrap-anywhere" style={{overflowWrap: "break-word"}}>
                      {payment.paidAt.substring(0, 10)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 沒有資料時的提示 */}
        {!loading && paymentData && paymentData?.length === 0 && (
          <div className='flex flex-col'>
          <div className="text-center py-8">
            目前沒有贊助紀錄
          </div>
          <Link href={searchProject ? `/videos/${searchProject}` : `/videos`} className='btn-primary mt-5 self-center rounded-[10px] py-2 px-16 text-center'>查看計畫</Link>
          </div>
        )}
        
      </div>
    </div>
  )
};

export default Payments;