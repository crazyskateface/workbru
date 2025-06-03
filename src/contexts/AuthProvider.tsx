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
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always refetch on mount
    },
  },
});

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthStateManager: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();

  // add a state to force refetch
  const [authKey, setAuthKey] = React.useState(0);

  // Query for auth state
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', authKey], // Include authKey to force refetch
    queryFn: async () => {
      console.log('[AuthProvider] Starting auth state fetch');
      
        
        try {
          console.log('[AuthProvider] Getting session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.log('[AuthProvider] No valid session found');
            throw sessionError;
          }

          if (!session?.user) {
            console.log('[AuthProvider] No valid session found');
            return null;
          }

          console.log('[AuthProvider] Fetching profile for user:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError || !profile) {
            console.error('[AuthProvider] Profile error:', profileError || 'Profile not found');
            // if profile doesn't exist. create a basic user object from session data
            // this handles the case where user just signed up and profile hasn't been created yet
            const basicUser: User = {
              id: session.user.id,
              email: session.user.email!,
              role: 'user', // default role
              firstName: session.user.user_metadata?.firstName || null, 
              lastName: session.user.user_metadata?.lastName || null, 
              avatar: session.user.user_metadata?.avatar_url || null, 
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at
            };

            console.log('[AuthProvider] Using basic user data from session:', basicUser);
            return basicUser;
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
        console.error('[AuthPovider] Error in auth state fetch:', error);
        throw error;
      }
    },
    // Key addition: Enable background refetching
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Subscribe to auth state changes
  React.useEffect(() => {
    console.log('[AuthProvider] Setting up auth state listener');

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);

        // For SIGNED_OUT, immediately clear the user before invalidating queries
        if ( event === 'SIGNED_OUT') {
          console.log('[AuthProvider] Signing out - clearing user state');
          setUser(null);
          setLoading(false);
          // clear the query cache
          queryClient.setQueryData(['auth'], null);
          navigate('/');
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('[AuthProvider] User signed in, forcing auth query refetch');
          
            console.log('[AuthProvider] Auth event, invalidating query');
            // await queryClient.invalidateQueries({ queryKey: ['auth'] });
            setAuthKey(prev => prev + 1); // Increment authKey to force refetch
            // const result = await refetch();
        }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth state listener');
      subscription?.unsubscribe();
    };
  }, []);

  // Update auth store when query state changes
  React.useEffect(() => {
    console.log('[AuthProvider] Query state changed:', { 
      hasUser: !!user, 
      isLoading, 
      hasError: !!error,
      authKey
    });
    setUser(user || null);
    setLoading(isLoading);
  }, [user, isLoading, error, setUser, setLoading, authKey]);

    //Handle navigation separately to avoid infinite loops
  React.useEffect(() => {
    if (!isLoading && !error) {
      const currentPath = window.location.pathname;

      if (user && (currentPath === '/login' || currentPath === '/signup' || currentPath === '/')) {
        console.log('[AuthProvider] User authenticated, redirecting to /app');
        navigate('/app');
      } else if (!user && currentPath.startsWith('/app')) {
        console.log('[AuthProvider] User not authenticated, redirecting to /');
        navigate('/');
      }
    }
  }, [user, isLoading, error, navigate]);

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