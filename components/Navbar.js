"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserRound } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import s from "./Navbar.module.scss";

export default function Navbar({ className, href = "/membership/profile" }) {
  const { logout, isAuthenticated, userData } = useAuth();
  const [ isMenuOpen, setIsMenuOpen ] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticationPage = /^\/(?:login|register|forgot-password|resetpkey\/[^\/]+)$/.test(pathname);
  const profileRef = useRef(null);

  const handleSearch = (searchTerm) => {
    // 導向搜尋頁面並傳遞搜尋參數
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleSearchStateChange = useCallback((isFocused, hasValue) => {
    setIsSearchExpanded(isFocused || hasValue);
  }, []);

  // 修改 toggleMenu 函數，添加事件參數和阻止冒泡
  const toggleMenu = (event) => {
    event.stopPropagation(); // 阻止事件冒泡
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event) => {
    // 確保點擊的不是觸發按鈕本身和選單內容
    if (menuRef.current && !menuRef.current.contains(event.target) && 
        profileRef.current && !profileRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
    
  return (
    <nav className={`fixed top-0 w-full ${className} py-4 z-[9000] h-[calc(44px+2rem)] flex items-center bg-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-gradient-to-r after:from-primary after:via-yellow-200 after:to-cyan-300`}>
      <div className="container flex justify-between items-center gap-8 md:gap-12 lg:gap-x-16">
        <Link 
          href="/videos" 
          className={`transition-all duration-300 ease-in-out ${
            isSearchExpanded ? 'md:block opacity-0 md:opacity-100 w-0 md:w-auto overflow-hidden' : 'opacity-100 w-auto'
          }`}
        >
          <h1>

              <img src="/images/shared/logo.png" alt="Voyeur" className="h-[30px] lg:h-[40px]" />
              <span className={s["sr-only"]}>Voyeur</span>

          </h1>
        </Link>

        <div className="flex-grow flex justify-end items-center">
          {/* <Link href="/videos">熱門影片</Link> */}
          <Link href="/videos" className="px-2 md:px-3 py-1 mr-2 md:ml-3">回到首頁</Link>

          {isAuthenticated && (
            <>
              <div className="flex items-center cursor-pointer flex-shrink-0 relative" onClick={toggleMenu} ref={profileRef}>
                <div className="h-[44px] w-[44px] flex justify-center items-center bg-white/15 relative rounded-full overflow-hidden">
                    {userData?.profilePicture ? (
                      <Image src={`${process.env.NEXT_PUBLIC_PHOTO_BASE_URL}${userData?.profilePicture}`} alt="" className="" fill></Image>
                    ) : (
                      <UserRound size={28} className='text-white' strokeWidth={1} />
                    )}
                </div>
                {/* <p className={`ml-2.5 text-sm transition-all duration-300 ease-in-out ${
                  isSearchExpanded 
                    ? 'w-0 md:w-fit md:max-w-40 overflow-hidden opacity-0 md:opacity-100' 
                    : 'w-8 lg:w-fit lg:max-w-40 overflow-hidden'
                } text-ellipsis whitespace-nowrap max-sm:hidden`}>
                  {userData?.name}
                </p> */}
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-14 mt-2 w-48 text-white bg-black rounded-lg border border-white/75 z-20 overflow-hidden"
                  >
                    <nav>
                      <ul className="">
                        <li className="px-4 pt-4 pb-2 hover:bg-white/15">
                          <Link href="/user/profile" className="block w-full">
                            個人資料
                          </Link>
                        </li>
                        {/* <li className="px-4 py-2 hover:bg-white/15">
                          <Link href={`/user/subscriptions`} className="block w-full">
                            訂閱方案
                          </Link>
                        </li> */}
                        <li className="px-4 pt-2 pb-4 hover:bg-white/15">
                          <Link href="/user/payments" className="block w-full">
                            贊助紀錄
                          </Link>
                        </li>
                        <li className="border-t border-gray-200 px-4 py-3 hover:bg-white/15">
                          <button onClick={handleLogout} className="block w-full text-start">
                            登出
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </>
          )}
          {!isAuthenticated && (
            <div className="flex items-center flex-shrink-0">
              <Link href="/login" className="text-white  border-white/50 rounded-full px-2 md:px-3 py-1">登入</Link>
              <Link href="/register" className="text-white  border-white/50 rounded-full px-2 md:px-3 py-1 ml-2 md:ml-3">註冊</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}