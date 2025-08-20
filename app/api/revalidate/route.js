// app/api/revalidate/route.js
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
    try {
        const { path } = await request.json()
        
        // 從請求中獲取 token
        const cookieStore = cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!path) {
            return NextResponse.json(
                { message: 'Path parameter is required' },
                { status: 400 }
            )
        }

        // 重新驗證指定路徑
        revalidatePath(path)
        
        return NextResponse.json({
            revalidated: true,
            now: Date.now()
        })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error revalidating' },
            { status: 500 }
        )
    }
}