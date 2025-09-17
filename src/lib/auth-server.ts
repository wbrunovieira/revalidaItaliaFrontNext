// Helper functions for server-side authentication
import { cookies } from 'next/headers';

interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'tutor' | 'student';
  exp?: number;
}

/**
 * Decode JWT token without verification (for server-side use)
 * Note: In production, you should verify the signature
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Get user role from cookie token
 */
export async function getUserRole(): Promise<'admin' | 'tutor' | 'student' | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token?.value) return null;

  const payload = decodeJWT(token.value);
  return payload?.role || null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Check if user is tutor
 */
export async function isTutor(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'tutor';
}

/**
 * Check if user is admin or tutor
 */
export async function isAdminOrTutor(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin' || role === 'tutor';
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token?.value) return false;

  const payload = decodeJWT(token.value);
  if (!payload) return false;

  // Check if token is expired
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return false;
  }

  return true;
}