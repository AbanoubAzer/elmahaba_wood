import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { backendApi } from '../services/api';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  switchRole: (role: UserRole) => void; // dev only
  logout: () => void;
}

const TOKEN_KEY = 'elmahaba_access_token';

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await backendApi.login(email, password);
      // Store token in localStorage for persistent sessions
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      set({
        currentUser: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const message = err.message?.includes('401')
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : 'فشل الاتصال بالسيرفر — تحقق من الاتصال';
      set({ isLoading: false, error: message, isAuthenticated: false });
      return false;
    }
  },

  // Dev convenience only — direct role switch without backend
  switchRole: (role: UserRole) => {
    const mockNames: Record<UserRole, string> = {
      admin: 'أبانوب جرجس (المدير)',
      accountant: 'أحمد المحاسب',
      storekeeper: 'مينا المخزنجي',
    };
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, role, name: mockNames[role] }
        : null,
    }));
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ currentUser: null, isAuthenticated: false, error: null });
  },
}));

/** Get stored token for API requests */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Restore session on app start if token exists */
export async function restoreSession(): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const res = await backendApi.getMe();
    useAuthStore.setState({ currentUser: res, isAuthenticated: true });
    return true;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return false;
  }
}
