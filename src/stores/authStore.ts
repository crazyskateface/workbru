import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => {
        console.log('[AuthStore] Setting user:', user);
        set({ user });
      },
      setLoading: (loading) => {
        console.log('[AuthStore] Setting loading:', loading);
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => {
        console.log('[AuthStore] Rehydrating storage');
        return (state) => {
          console.log('[AuthStore] Storage rehydrated:', state);
        };
      },
    }
  )
);