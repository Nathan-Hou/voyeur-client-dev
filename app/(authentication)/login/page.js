"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Form from "@/components/authentication/login/Form";
import { useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/shared/ErrorBoundry";

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
                <div className="container flex justify-center items-center">
                        <ErrorBoundary>
                        <Form />
                        </ErrorBoundary>
                </div>
            )}
        </main>
    )
}