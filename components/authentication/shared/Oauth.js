'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setAuthToken } from '@/utils/auth';
import NewOAuthService from '@/services/authentication/oauth-service';
import { showToast } from '@/components/shared/toast/Config';
import { X } from 'lucide-react';

import FBIcon from "@/public/images/authentication/fb-icon.svg";
import GoogleIcon from "@/public/images/authentication/google-icon.png";

export default function Oauth() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { login } = useAuth();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (!session?.idToken) return;

            try {
                const isFacebookProvider = session.provider === 'facebook';
                if (isFacebookProvider) {
                    window.location.replace('/previous-years');
                } else if (session.provider === 'google') {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/LoginByGoogle.ashx`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: session.idToken
                        })
                    });
    
                    const data = await response.json();
    
                    // if (data.status === "3000") {
                    //     showToast.success("請先完成註冊");
                    //     router.replace('/register');
                    // } else if (data.status === "0" && data.token) {
                    //     await setAuthToken(data.token);
                    //     await login(data.token);
                    //     await signOut({ redirect: false });
                    //     window.location.replace('/tests/previous-years');
                    // }    
                }

                // 根據登入提供者選擇不同的 API
                // const apiEndpoint = session.provider === 'facebook' 
                //     ? '/LoginByFacebook.ashx' 
                //     : '/LoginByGoogle.ashx';

                // const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${apiEndpoint}`, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({
                //         token: session.idToken
                //     })
                // });

                // const data = await response.json();

                // if (data.status === "3000") {
                //     showToast.success("請先完成註冊");
                //     router.replace('/register');
                // } else if (data.status === "0" && data.token) {
                //     await setAuthToken(data.token);
                //     await login(data.token);
                //     await signOut({ redirect: false });
                //     window.location.replace('/tests/previous-years');
                // }
            } catch (error) {
                console.error(error);
                showToast.error('登入失敗，請稍後再試');
            }
        };

        if (status === 'authenticated') {
            checkAuth();
        }
    }, [session, status, router, login]);

    const handleGoogleLogin = () => {
        signIn('google', { redirect: false });
    };

    const handleFacebookLogin = () => {
        signIn('facebook', { redirect: false });
    };

    if (status === 'loading') return null;

    return (
        <div className="mt-5 2xl:mt-10 relative">
            <div className='relative h-[1px] bg-fourth'>
                <p className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-center px-3 text-white">或者</p>
            </div>
            <div className="mt-3 lg:mt-2.5 2xl:mt-5 flex justify-center">
                {/* <button onClick={handleFacebookLogin}>
                    <Image 
                        src={FBIcon} 
                        alt="fb icon" 
                        className="w-[70px] h-[70px] cursor-pointer" 
                    />
                </button> */}
                <button onClick={handleGoogleLogin} className="mt-2">
                    <Image 
                        src={GoogleIcon} 
                        alt="google icon" 
                        // className="ml-[70px] w-[80px] h-[80px] cursor-pointer" 
                        className="w-[40px] h-[40px] cursor-pointer" 
                    />
                </button>
                {/* <p className='text-white fixed bottom-0 right-0' onClick={handleGoogleLogin}>Google</p> */}
            </div>
        </div>
    );
}