import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a separate admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function signInWithEmail(email: string, password: string) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error('No user data returned');
  }

  // Fetch user profile data including role
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  const user: User = {
    id: authData.user.id,
    email: authData.user.email!,
    role: profileData.role || 'user',
    firstName: profileData.first_name,
    lastName: profileData.last_name,
    avatar: profileData.avatar_url,
  };

  return { data: { user }, error: null };
}

export async function signUpWithEmail(
  email: string, 
  password: string,
  firstName?: string,
  lastName?: string
) {
  // First sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error('No user data returned');
  }

  // Wait a moment for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update the profile with additional information
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq('id', authData.user.id);

  if (profileError) {
    throw profileError;
  }

  const user: User = {
    id: authData.user.id,
    email: authData.user.email!,
    role: 'user',
    firstName,
    lastName,
  };

  return { data: { user }, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log('[getCurrentUser] Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[getCurrentUser] got session', session);
    if (sessionError) {
      console.error('[getCurrentUser] Session error:', sessionError);
      return null;
    }

    if (!session?.user) {
      console.log('[getCurrentUser] No session or user');
      return null;
    }

    console.log('[getCurrentUser] Got session, fetching profile...');
    
    // Fetch user profile data including role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('[getCurrentUser] Profile error:', profileError);
      return null;
    }

    if (!profile) {
      console.log('[getCurrentUser] No profile found');
      return null;
    }

    console.log('[getCurrentUser] Profile found:', profile);

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

    console.log('[getCurrentUser] Returning user:', user);
    return user;
  } catch (error) {
    console.error('[getCurrentUser] Unexpected error:', error);
    return null;
  }
}

export async function updateUser(userId: string, userData: Partial<User>) {
  try {
    // First update the user's email in auth.users if it has changed
    if (userData.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: userData.email }
      );

      if (authError) {
        throw new Error(`Error updating auth user: ${authError.message}`);
      }
    }

    // Use the database function to update the profile (bypasses RLS)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .rpc('admin_update_user', {
        user_id: userId,
        user_email: userData.email,
        p_first_name: userData.firstName,
        p_last_name: userData.lastName,
        user_role: userData.role
      });

    if (profileError) {
      throw new Error(`Error updating profile: ${profileError.message}`);
    }

    if (!profileData || profileData.length === 0) {
      throw new Error('Profile not found or update failed');
    }

    const profile = profileData[0];

    // Return the updated user data
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role || 'user',
      avatar: profile.avatar_url
    };
  } catch (error: any) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}