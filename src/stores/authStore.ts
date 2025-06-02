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
      console.log('[AuthStore] Session exists:', !!session);
      console.log('[AuthStore] User exists:', !!session?.user);
      
      set({ isLoading: true });
      
      if (session?.user) {
        console.log('[AuthStore] Processing login with user...');
        
        try {
          console.log('[AuthStore] Getting current user...');
          const fullUser = await getCurrentUser();
          console.log('[AuthStore] Got full user profile:', fullUser);
          
          if (fullUser) {
            set({ user: fullUser, isLoading: false });
            console.log('[AuthStore] User set in store:', fullUser.email);
          } else {
            throw new Error('getCurrentUser returned null');
          }
        } catch (error) {
          console.error('[AuthStore] Error getting full user, using fallback:', error);
          
          // Fallback to basic user info from session
          const basicUser = {
            id: session.user.id,
            email: session.user.email!,
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            role: 'user',
            avatar: null,
            created_at: session.user.created_at,
            updated_at: new Date().toISOString()
          };
          
          console.log('[AuthStore] Setting fallback user:', basicUser);
          set({ user: basicUser, isLoading: false });
        }
      } else {
        console.log('[AuthStore] No user in session, clearing user state');
        set({ user: null, isLoading: false });
      }
    });

    return () => {
      console.log('[AuthStore] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  },
}));