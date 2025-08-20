import Content from "@/components/Videos/[name]/Content";
import { getServerAuth } from "@/lib/server-auth";

export const revalidate = 0;

export default async function Page({ params, searchParams }) {

    const authenticationResult = await getServerAuth();
    // console.log("authenticationResult: ", authenticationResult);

    return (
        <main className="page-main">
            <div className="container mx-auto !max-w-[1000px]">
                <Content isAuthenticated={authenticationResult} />
            </div>
        </main>
    )
}