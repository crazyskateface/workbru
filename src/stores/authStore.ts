import { create } from 'zustand';
import { User } from '../types';
import { getCurrentUser } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const user = await getCurrentUser();
      set({ user });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));