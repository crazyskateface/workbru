import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthStateManager: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  // Query for auth state
  useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      console.log('[AuthProvider] Starting auth state fetch');
      try {
        setLoading(true);
        console.log('[AuthProvider] Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('[AuthProvider] Session result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error: sessionError
        });

        if (sessionError || !session?.user) {
          console.log('[AuthProvider] No valid session found');
          return null;
        }

        console.log('[AuthProvider] Fetching profile for user:', session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('[AuthProvider] Profile fetch result:', { 
          hasProfile: !!profile, 
          error: profileError 
        });

        if (profileError || !profile) {
          console.error('[AuthProvider] Profile error:', profileError || 'Profile not found');
          throw profileError || new Error('Profile not found');
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          role: profile.role || 'user',
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatar: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };

        console.log('[AuthProvider] Auth state fetch complete:', user);
        return user;
      } catch (error) {
        console.error('[AuthProvider] Error in auth state fetch:', error);
        return null;
      } finally {
        setLoading(false);
        console.log('[AuthProvider] Auth state fetch finished');
      }
    },
    onSuccess: (user) => {
      console.log('[AuthProvider] Auth query success, user:', user);
      setUser(user);
      if (!user) {
        console.log('[AuthProvider] No user, navigating to home');
        navigate('/', { replace: true });
      }
    },
    onError: (error) => {
      console.error('[AuthProvider] Auth query error:', error);
    }
  });

  // Subscribe to auth changes
  React.useEffect(() => {
    console.log('[AuthProvider] Setting up auth subscription');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', { 
        event, 
        email: session?.user?.email,
        userId: session?.user?.id 
      });

      if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] User signed out, clearing state');
        setUser(null);
        queryClient.setQueryData(['auth'], null);
        navigate('/', { replace: true });
        return;
      }

      if (event === 'SIGNED_IN') {
        console.log('[AuthProvider] User signed in, invalidating auth query');
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [queryClient, setUser, navigate]);

  return null;
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('[AuthProvider] Rendering AuthProvider');
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStateManager />
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

export default AuthProvider;