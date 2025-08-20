// lib/server-auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getServerAuth() {
  const cookieStore = cookies();
  const authData = cookieStore.get('auth_token'); // 根據你的 cookie 名稱調整
  
  if (!authData) {
    return null;
  }

  console.log("getServerAuth. authData: ", authData);
  console.log("authData.value: ", authData.value);
  
  try {
    // 這裡可以做簡單的 token 驗證
    // const tokenData = JSON.parse(authData.value);
    const tokenData = authData.value;
    console.log("inside getServerAuth. tokenData: ", tokenData);
    
    // 檢查是否過期
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      console.log("token expired.");
      return null;
    }
    
    return tokenData;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const auth = await getServerAuth();
  console.log("inside requireAuth. auth: ", auth);
  
  if (!auth) {
    redirect('/login');
  }
  
  return auth;
}