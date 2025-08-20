import { Suspense } from "react";

import Payments from "@/components/User/Payments_modified";

export default function Page() {
    return (
        <Suspense>
            <main className="page-main !mb-0">
                <div className="container">
                    <Payments />
                </div>
            </main>
        </Suspense>
    )
}