import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();
  const navigate = useNavigate();
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');
    setLoading(true);

    const setupAuthListener = async () => {
      try {
        // Clean up any existing subscription
        if (authSubscriptionRef.current) {
          authSubscriptionRef.current.unsubscribe();
        }

        // Set up new subscription
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[AuthProvider] Auth state changed:', event, session?.user?.email);

          try {
            if (event === 'SIGNED_OUT' || !session?.user) {
              console.log('[AuthProvider] User signed out or no session');
              setUser(null);
              navigate('/', { replace: true });
              return;
            }

            // For SIGNED_IN and INITIAL_SESSION events, fetch the full profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            console.log('[AuthProvider] Fetched profile:', profile);

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

            console.log('[AuthProvider] Setting user:', user);
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

        // Store the subscription reference
        authSubscriptionRef.current = subscription;

      } catch (error) {
        console.error('[AuthProvider] Error setting up auth listener:', error);
        setLoading(false);
      }
    };

    setupAuthListener();

    // Cleanup function
    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, [setUser, setLoading, navigate]);

  return <>{children}</>;
};

export default AuthProvider;