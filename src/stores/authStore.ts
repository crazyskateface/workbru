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
    
    // Get initial session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthStore] Initial session check:', session?.user?.email || 'null');
      
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          
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
          
          set({ user, isLoading: false });
        } catch (error) {
          console.error('[AuthStore] Error fetching initial profile:', error);
          set({ user: null, isLoading: false });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    });
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthStore] Auth state changed:', event, session?.user?.email || 'null');
      
      if (event === 'SIGNED_OUT') {
        set({ user: null, isLoading: false });
        return;
      }
      
      if (session?.user) {
        set({ isLoading: true });
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          
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
          
          set({ user, isLoading: false });
        } catch (error) {
          console.error('[AuthStore] Error fetching profile:', error);
          set({ user: null, isLoading: false });
        }
      }
    });

    return () => {
      console.log('[AuthStore] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  },
}));