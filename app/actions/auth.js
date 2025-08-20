'use server';
import { cookies } from 'next/headers';

export async function updateServerToken(tokenData) {

  const cookieStore = cookies();
  
  // 解析 tokenData 來獲取正確的過期時間
  try {
    const parsed = JSON.parse(tokenData);
    const maxAgeInSeconds = Math.floor((parsed.expiresAt - Date.now()) / 1000);

    // console.log("maxAgeInSeconds: ", maxAgeInSeconds);
    
    cookieStore.set('auth_token', parsed.token, {
      path: '/',
      maxAge: Math.max(maxAgeInSeconds, 0), // 確保不是負數
      secure: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
  } catch (error) {
    console.error('Error setting server token:', error);
  }
}

export async function removeServerToken() {
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
}