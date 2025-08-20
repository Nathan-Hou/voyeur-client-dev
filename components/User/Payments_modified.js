"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Pencil, Trash2, Info, AlertCircle } from 'lucide-react';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
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
  const [selectedProject, setSelectedProject] = useState({ id: '', title: '全部計畫', slug: '' });
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
        NewAccountService.getMyPayments(""),
        NewProjectService.search(1, 10, "", "id", "Descending", true)
      ]);
      setPaymentData(paymentResponse?.data);
      const projects = projectResponse?.data?.data || [];
      setProjectOptions([
        { id: '', title: '全部計畫', slug: '' }, // 添加預設選項
        ...projects
      ]);      
    } catch (e) {
      console.error('Error fetching initial data. ', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 只執行 fetchPaymentData
  const fetchPaymentData = async (projectSlug) => {
    try {
      const res = await NewAccountService.getMyPayments(projectSlug || "");
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

  // 監聽 selectedProject 變化，重新執行 fetchPaymentData
  useEffect(() => {
    if (selectedProject && selectedProject.id !== undefined) {
      fetchPaymentData(selectedProject.slug || null);
    }
  }, [selectedProject]);

  // 處理計畫選擇變化
  const handleProjectChange = (project) => {
    setSelectedProject(project);
  };

  return (
    <div className={``}>
      <div className="">
        <div className="sticky top-0 pb-4 z-10 bg-black">
          
          {/* Search and filter controls */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <h2 className="page-title">贊助紀錄</h2>
              
              {/* Headless UI Listbox */}
              <div className="relative w-44 lg:w-60 shrink-1">
                <Listbox value={selectedProject} onChange={handleProjectChange} disabled={loading}>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-[10px] bg-black border border-gray-300 py-2 pl-3 pr-10 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="block truncate text-white">
                        {selectedProject?.title || '全部計畫'}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Listbox.Button>
                    
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[10px] bg-black border border-gray-300 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {projectOptions?.map((project) => (
                          <Listbox.Option
                            key={project.id || 'all'}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-3 pr-4 hover:bg-white/10`
                            }
                            value={project}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {project.title || `Project ${project.id}`}
                                </span>
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>
        </div>

        {/* Loading 狀態 */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="">載入中...</div>
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
          <Link href={selectedProject?.slug ? `/videos/${selectedProject.slug}` : `/videos`} className='btn-primary mt-5 self-center rounded-[10px] py-2 px-16 text-center'>查看計畫</Link>
          </div>
        )}
        
      </div>
    </div>
  )
};

export default Payments;