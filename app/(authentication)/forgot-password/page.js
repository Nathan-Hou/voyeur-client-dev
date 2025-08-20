'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import Form from "@/components/authentication/forgot-password/Form";

export default function Page() {
    const { userData } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (userData) {
            router.push('/');
        }
    }, [userData, router]);

    return (
        <main className={`main`}>
            {!userData && (
            <div className="container">
                <div className="w-full py-8 flex justify-center relative">
                    <Form />
                </div>
            </div>
            )}
        </main>
    )
}