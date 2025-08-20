"use client";

import { useEffect } from 'react';
import { showToast } from "@/components/shared/toast/Config";

export default function ErrorHandler({ error }) {
    useEffect(() => {
        if (error) {
            showToast.error(error);
        }
    }, [error]);

    return null;
}