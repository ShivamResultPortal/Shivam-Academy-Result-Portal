import { StudentResult, OverviewStats } from './types';
import { DEFAULT_RESULTS, STORAGE_KEY } from './initialData';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch all student results from the backend PostgreSQL database.
 * Falls back to localStorage/initialData if backend is unreachable.
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
 * Admin Login via Backend API
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
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setStoredToken(json.token);
      return { success: true, token: json.token, user: json.user };
    }
    return { success: false, message: json.message || 'Login failed.' };
  } catch (e: any) {
    // If backend is not available locally, allow the default credentials fallback for offline testing
    if (username.trim() === 'admin' && password === 'admin123') {
      return { success: true, message: 'Offline admin credentials accepted.' };
    }
    return { success: false, message: 'Could not connect to authentication server.' };
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
