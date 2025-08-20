import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function serverFetch(endpoint, options = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}