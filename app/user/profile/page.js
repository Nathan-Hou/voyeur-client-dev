import { Suspense } from "react";

import Profile from "@/components/User/Profile";

export default function Page() {
    return (
        <Suspense>
            <main className="page-main">
                <div className="container">
                    <Profile />
                </div>
            </main>
        </Suspense>
    )
}