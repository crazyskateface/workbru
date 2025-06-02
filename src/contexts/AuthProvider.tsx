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
      try {
        setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          return null;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
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

        return user;
      } catch (error) {
        console.error('[Auth] Error fetching auth state:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (user) => {
      setUser(user);
      if (!user) {
        navigate('/', { replace: true });
      }
    },
  });

  // Subscribe to auth changes
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        queryClient.setQueryData(['auth'], null);
        navigate('/', { replace: true });
        return;
      }

      if (event === 'SIGNED_IN') {
        // Invalidate and refetch auth query
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, setUser, navigate]);

  return null;
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStateManager />
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

export default AuthProvider;