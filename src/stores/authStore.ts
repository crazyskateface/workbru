import { create } from 'zustand';
import { User } from '../types';
import { getCurrentUser, supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  setupAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  
  setUser: (user) => {
    console.log('[AuthStore] Setting user:', user?.email || 'null');
    set({ user });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  initializeAuth: async () => {
    try {
      console.log('[AuthStore] Initializing auth...');
      set({ isLoading: true });
      const user = await getCurrentUser();
      console.log('[AuthStore] Initial user:', user?.email || 'null');
      set({ user });
    } catch (error) {
      console.error('[AuthStore] Error initializing auth:', error);
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setupAuthListener: () => {
    console.log('[AuthStore] Setting up auth listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthStore] Auth state changed:', event, session?.user?.email || 'null');
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        try {
          const user = await getCurrentUser();
          console.log('[AuthStore] Updated user data:', user?.email || 'null');
          set({ user, isLoading: false });
        } catch (error) {
          console.error('[AuthStore] Error getting user data:', error);
          set({ user: null, isLoading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthStore] User signed out');
        set({ user: null, isLoading: false });
      }
    });

    return () => {
      console.log('[AuthStore] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  },
}));