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
      set({ isLoading: true });
      
      if (session?.user) {
        try {
          const user = await getCurrentUser();
          console.log('[AuthStore] Full user profile loaded:', user);
          set({ user, isLoading: false });
        } catch (error) {
          console.error('[AuthStore] Error getting full user profile:', error);
          // Fallback to basic user info if profile fetch fails
          set({ 
            user: {
              id: session.user.id,
              email: session.user.email!,
              firstName: session.user.user_metadata?.first_name,
              lastName: session.user.user_metadata?.last_name,
              role: 'user',
              avatar: session.user.user_metadata?.avatar_url
            },
            isLoading: false 
          });
        }
      } else {
        console.log('[AuthStore] No session, clearing user');
        set({ user: null, isLoading: false });
      }
    });

    return () => {
      console.log('[AuthStore] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  },
}));