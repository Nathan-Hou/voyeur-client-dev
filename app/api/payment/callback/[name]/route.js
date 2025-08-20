// import { NextResponse } from 'next/server';

// export async function GET(request, { params }) {
//   // 重定向到頁面組件
//   return NextResponse.redirect(
//     new URL(`/`, request.url)
//   );
// }

// export async function POST(req) {
//     console.log("handler. req: ", req)

//     try {
//     //   console.log('Payment callback received');
//     //   console.log('Content-Type:', request.headers.get('content-type'));
      
//     //   let data = {};
//     //   const contentType = request.headers.get('content-type');
      
//     //   if (contentType?.includes('application/x-www-form-urlencoded')) {
//     //     // 表單資料
//     //     const formData = await request.formData();
//     //     for (const [key, value] of formData.entries()) {
//     //       data[key] = value;
//     //     }
//     //   } else if (contentType?.includes('application/json')) {
//     //     // JSON 資料
//     //     data = await request.json();
//     //   } else {
//     //     // 嘗試解析為表單資料
//     //     const formData = await request.formData();
//     //     for (const [key, value] of formData.entries()) {
//     //       data[key] = value;
//     //     }
//     //   }
      
//     //   // 印出所有收到的資料以便調試
//     //   console.log('Data received:', data);
      
//     //   const status = data.STATUS;
//     //   const projectSlug = data.projectSlug || 'default'; // 需要你在建立付款時傳入
      
//     //   // 取得基礎 URL
//     //   const baseUrl = new URL(request.url).origin;
      
//     //   if (status === 'success') {
//     //     console.log('Payment successful, redirecting...');
//     //     // 重導向到成功頁面
//     //     return NextResponse.redirect(`${baseUrl}/videos/${projectSlug}?payment=success`);
//     //   } else {
//     //     console.log('Payment failed, redirecting...');
//     //     // 重導向到失敗頁面
//     //     return NextResponse.redirect(`${baseUrl}/videos/${projectSlug}?payment=failed`);
//     //   }

//     NextResponse.redirect('/');
      
//     } catch (error) {
//       console.error('Payment callback error:', error);
      
//       // 發生錯誤時的處理
//       const baseUrl = new URL(request.url).origin;
//       return NextResponse.redirect(`${baseUrl}/videos?payment=error`);
//     }
// }




// import { NextResponse } from 'next/server';

// export async function GET(request, { params }) {
//   // 重定向到頁面組件
//   return NextResponse.redirect(
//     new URL(`/videos/${params.name}`, request.url)
//   );
// }


import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request, { params }) {
  try {
    // 記錄請求信息用於調試
    const headersList = headers();
    console.log('Request headers:', {
      origin: headersList.get('origin'),
      'x-forwarded-host': headersList.get('x-forwarded-host'),
      'user-agent': headersList.get('user-agent'),
    });

    // 直接讀取請求體，不依賴 Server Actions
    const body = await request.text();
    console.log('Raw request body:', body);

    // 解析 form data
    let paymentData = {};
    if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(body);
      paymentData = Object.fromEntries(params);
    } else if (request.headers.get('content-type')?.includes('application/json')) {
      paymentData = JSON.parse(body);
    }

    console.log('Payment callback data:', paymentData);
    console.log('Video name:', params.name);

    // 驗證付款狀態
    if (paymentData.Status === 'SUCCESS') {
      const redirectUrl = new URL(`/videos/${params.name}?payment=success`, request.url);
      return NextResponse.redirect(redirectUrl, 302);
    } else {
      const redirectUrl = new URL(`/videos/${params.name}?payment=failed`, request.url);
      return NextResponse.redirect(redirectUrl, 302);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    
    const redirectUrl = new URL(`/videos/${params.name}?payment=error`, request.url);
    return NextResponse.redirect(redirectUrl, 302);
  }
}