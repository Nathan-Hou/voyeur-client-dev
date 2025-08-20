"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import Form from "@/components/authentication/register/Form";
import { useAuth } from "@/contexts/AuthContext";

export default function Page() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    return (
        <SessionProvider>
        <main className={`main`}>
            {!isAuthenticated && (
            <div className="container">
                <div className="w-full py-4 2xl:py-8 flex justify-center">
                    <Suspense fallback={<div></div>}>
                        <Form />
                    </Suspense>
                </div>
            </div>
            )}
        </main>
        </SessionProvider>
    )
}