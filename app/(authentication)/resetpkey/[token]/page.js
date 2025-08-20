import Form from "@/components/authentication/reset-password/Form";

export default async function Page({ params }) {
    // const { isAuthenticated } = useAuth();
    // const router = useRouter();
    const { token } = await params;

    // useEffect(() => {
    //     if (isAuthenticated) {
    //         router.push('/peekqube');
    //     }
    // }, [isAuthenticated, router]);

    return (
        <main className={`main`}>
            {/* {!isAuthenticated && ( */}
            <div className="container">
                <div className="w-full py-8 flex justify-center relative">
                    {/* <Suspense> */}
                        <Form token={token} />
                    {/* </Suspense> */}
                </div>
            </div>
            {/* )} */}
        </main>
    )
}