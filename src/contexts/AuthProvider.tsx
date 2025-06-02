import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.email);

      try {
        if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('is this happening???');
          setUser(null);
          navigate('/login', { replace: true });
          return;
        }

        console.log('wtf');
        // For SIGNED_IN and INITIAL_SESSION events, fetch the full profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        console.log('[AuthProvider] Fetched full profile:', profile);
        
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

        console.log('[AuthProvider] setting user', user);
        setUser(user);

        // Always redirect to /app after successful sign in
        if (event === 'SIGNED_IN') {
          navigate('/app', { replace: true });
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
  }, [setUser, setLoading, navigate]);

  return <>{children}</>;
};

export default AuthProvider;