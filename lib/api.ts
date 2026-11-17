import { StudentResult, OverviewStats, AdminMember } from './types';
import { DEFAULT_RESULTS, STORAGE_KEY } from './initialData';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://shivam-academy-result-portal-production.up.railway.app';

const TOKEN_KEY = 'nsa_jwt_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, persist: boolean = true) {
  if (typeof window === 'undefined') return;
  if (persist) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if the Railway Node.js backend is active & reachable
 */
export async function checkBackendStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch all student results from the backend PostgreSQL database.
 */
export async function getStudentResults(
  searchQuery?: string,
  subject?: string
): Promise<{ data: StudentResult[]; fromBackend: boolean }> {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (subject && subject !== 'All') params.append('subject', subject);

    const url = `${API_BASE_URL}/api/results${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return { data: json.data, fromBackend: true };
      }
    }
  } catch (err) {
    console.warn('Backend not reachable, loading results from local fallback.', err);
  }

  // Fallback to localStorage or DEFAULT_RESULTS
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { data: JSON.parse(saved), fromBackend: false };
      } catch (e) {
        console.error(e);
      }
    }
  }
  return { data: DEFAULT_RESULTS, fromBackend: false };
}

/**
 * Fetch overview stats and top rankers
 */
export async function getOverviewStats(): Promise<{
  stats: OverviewStats | null;
  topScorers: StudentResult[];
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/results/stats/overview`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return { stats: json.stats, topScorers: json.topScorers };
      }
    }
  } catch (e) {
    console.warn('Could not fetch overview stats from backend', e);
  }
  return { stats: null, topScorers: [] };
}

/**
 * Admin Login via Backend API (Sets secure httpOnly cookie & returns user profile)
 */
export async function loginAdminApi(username: string, password: string): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      if (json.token) setStoredToken(json.token);
      return { success: true, token: json.token, user: json.user };
    }
    return { success: false, message: json.message || 'Login failed.' };
  } catch (e: any) {
    return { success: false, message: 'Could not connect to authentication server.' };
  }
}

/**
 * Admin Logout (Clears httpOnly cookie)
 */
export async function logoutAdminApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    clearStoredToken();
  }
}

/**
 * Change / Update Admin Credentials (Password & Username)
 */
export async function updateAdminCredentialsApi(
  currentPassword: string,
  newUsername?: string,
  newPassword?: string
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/auth/update-credentials`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        currentPassword,
        newUsername: newUsername?.trim() || undefined,
        newPassword: newPassword || undefined,
      }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      if (json.token) setStoredToken(json.token);
      return { success: true, message: json.message || 'Credentials updated successfully!', user: json.user };
    }
    return { success: false, message: json.message || 'Failed to update credentials.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error updating credentials.' };
  }
}

/**
 * Add a new result to the database
 */
export async function createStudentResultApi(
  result: Partial<StudentResult>
): Promise<{ success: boolean; data?: StudentResult; message?: string }> {
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/api/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(result),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to save to database.' };
  }
}

/**
 * Update an existing result in the database
 */
export async function updateStudentResultApi(
  id: string,
  result: Partial<StudentResult>
): Promise<{ success: boolean; data?: StudentResult; message?: string }> {
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/api/results/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(result),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to update in database.' };
  }
}

/**
 * Delete a result from the database
 */
export async function deleteStudentResultApi(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/api/results/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, message: json.message };
    }
    return { success: false, message: json.message };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to delete from database.' };
  }
}

/**
 * Fetch all administrator accounts (Protected, Admin only)
 */
export async function fetchAdminListApi(): Promise<{
  success: boolean;
  data: AdminMember[];
  message?: string;
}> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/auth/admins`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data || [] };
    }
    return { success: false, data: [], message: json.message || 'Failed to retrieve admin accounts.' };
  } catch (e: any) {
    return { success: false, data: [], message: e.message || 'Network error fetching admin list.' };
  }
}

/**
 * Create a new admin account (Protected, Admin only)
 */
export async function createAdminApi(payload: {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
  role?: string;
}): Promise<{ success: boolean; data?: AdminMember; message?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/auth/admins`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data, message: json.message };
    }
    return { success: false, message: json.message || 'Failed to create new admin account.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error creating admin account.' };
  }
}

/**
 * Delete / Revoke an admin account (Protected, Admin only)
 */
export async function deleteAdminApi(
  id: number | string
): Promise<{ success: boolean; message: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/auth/admins/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, message: json.message || 'Admin account deleted.' };
    }
    return { success: false, message: json.message || 'Failed to revoke admin account.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error deleting admin account.' };
  }
}

/**
 * Request password reset email via link
 */
export async function forgotPasswordApi(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return {
        success: true,
        message: json.message,
      };
    }
    return {
      success: false,
      message: json.message || 'Failed to request password reset.',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Network error sending password reset request.',
    };
  }
}

/**
 * Reset password using verification token
 */
export async function resetPasswordApi(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), newPassword }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, message: json.message };
    }
    return {
      success: false,
      message: json.message || 'Failed to reset password. The link may have expired.',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Network error resetting password.',
    };
  }
}
