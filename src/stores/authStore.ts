import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
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

  setupAuthListener: () => {
    console.log('[AuthStore] Setting up auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthStore] Auth state changed:', event, session?.user?.email || 'null');
      
      set({ isLoading: true });
      
      if (session?.user) {
        console.log('[AuthStore] User logged in, fetching profile directly...');
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('[AuthStore] Profile error:', profileError);
            throw profileError;
          }
          
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            role: profile?.role || 'user',
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            avatar: profile?.avatar_url,
            created_at: profile?.created_at,
            updated_at: profile?.updated_at
          };
          
          console.log('[AuthStore] Setting user from profile:', user);
          set({ user, isLoading: false });
          
        } catch (error) {
          console.error('[AuthStore] Error fetching profile, using basic user:', error);
          
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email!,
            role: 'user',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            avatar: null,
            created_at: session.user.created_at,
            updated_at: new Date().toISOString()
          };
          
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