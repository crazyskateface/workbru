import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.email);

      try {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          localStorage.removeItem('lastRoute');
          if (location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
            navigate('/login', { replace: true });
          }
          return;
        }

        // For SIGNED_IN and INITIAL_SESSION events, fetch the full profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('[AuthProvider] Error fetching profile:', profileError);
          setUser(null);
          navigate('/login', { replace: true });
          return;
        }

        const user = {
          id: session.user.id,
          email: session.user.email!,
          role: profile.role || 'user',
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatar: profile.avatar_url,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };

        setUser(user);

        // Handle navigation after successful sign in
        if (event === 'SIGNED_IN') {
          const attemptedRoute = localStorage.getItem('attemptedRoute');
          const lastRoute = localStorage.getItem('lastRoute');
          
          if (attemptedRoute) {
            localStorage.removeItem('attemptedRoute');
            navigate(attemptedRoute, { replace: true });
          } else if (lastRoute && location.pathname === '/') {
            navigate(lastRoute, { replace: true });
          } else if (location.pathname === '/login' || location.pathname === '/register') {
            navigate('/app', { replace: true });
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, navigate, location.pathname]);

  return <>{children}</>;
};

export default AuthProvider;