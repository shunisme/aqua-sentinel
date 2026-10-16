import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '../types';

const STORAGE_KEYS = {
  SUPABASE_URL: 'aqua_sentinel_supabase_url',
  SUPABASE_ANON_KEY: 'aqua_sentinel_supabase_anon_key',
};

// Retrieve configured Supabase credentials from localStorage or Vite environment variables
export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const customUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const customKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: customUrl || envUrl || '',
    anonKey: customKey || envKey || '',
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && !url.includes('your-project'));
};

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  if (url) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  }

  if (anonKey) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  }

  // Re-initialize client
  initSupabaseClient();
};

let supabaseInstance: SupabaseClient | null = null;

export const initSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();

  if (url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
};

// Initialize on module load
initSupabaseClient();

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseInstance) {
    initSupabaseClient();
  }
  return supabaseInstance;
};

// Helper: Map Supabase Auth User to Aqua Sentinel UserProfile
export const mapSupabaseUserToProfile = (sbUser: SupabaseUser, fallbackRole: UserRole = 'admin'): UserProfile => {
  const meta = sbUser.user_metadata || {};
  const role: UserRole = (meta.role as UserRole) || fallbackRole;

  const roleTitles: Record<UserRole, string> = {
    admin: 'Facility Admin',
    technician: 'Repair Worker',
    resident: 'Resident',
  };

  const name = meta.name || meta.full_name || sbUser.email?.split('@')[0] || 'Aqua Sentinel User';
  const initials = name
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AS';

  return {
    name,
    email: sbUser.email || '',
    role,
    roleTitle: meta.roleTitle || roleTitles[role] || 'Authenticated User',
    avatarInitials: initials,
    assignedBuildingId: meta.assignedBuildingId || (role === 'resident' ? 'BLD-102' : undefined),
    isGuest: false,
  };
};

/**
 * Sign in existing user with Supabase Auth
 */
export const signInWithSupabase = async (
  email: string,
  password: string
): Promise<{ user: UserProfile | null; session: Session | null; error: string | null }> => {
  const client = getSupabase();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Supabase client is not configured. Please supply your Supabase Project URL and Anon Key.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, session: null, error: 'User not found.' };
    }

    const profile = mapSupabaseUserToProfile(data.user);
    return { user: profile, session: data.session, error: null };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err.message || 'An unexpected error occurred during sign in.',
    };
  }
};

/**
 * Sign up new user with Supabase Auth and assign selected role
 */
export const signUpWithSupabase = async (
  email: string,
  password: string,
  role: UserRole,
  fullName: string,
  assignedBuildingId?: string
): Promise<{ user: UserProfile | null; session: Session | null; error: string | null; emailConfirmationRequired: boolean }> => {
  const client = getSupabase();
  if (!client) {
    return {
      user: null,
      session: null,
      error: 'Supabase client is not configured. Please supply your Supabase Project URL and Anon Key.',
      emailConfirmationRequired: false,
    };
  }

  const roleTitles: Record<UserRole, string> = {
    admin: 'Facility Admin',
    technician: 'Repair Worker',
    resident: 'Resident',
  };

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name: fullName,
          roleTitle: roleTitles[role],
          assignedBuildingId: assignedBuildingId || (role === 'resident' ? 'BLD-102' : undefined),
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message, emailConfirmationRequired: false };
    }

    if (!data.user) {
      return { user: null, session: null, error: 'Failed to create user.', emailConfirmationRequired: false };
    }

    const profile = mapSupabaseUserToProfile(data.user, role);
    const emailConfirmationRequired = !data.session;

    return {
      user: profile,
      session: data.session,
      error: null,
      emailConfirmationRequired,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err.message || 'An unexpected error occurred during sign up.',
      emailConfirmationRequired: false,
    };
  }
};

/**
 * Sign out of Supabase
 */
export const signOutSupabase = async (): Promise<{ error: string | null }> => {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: any) {
    return { error: err.message || 'Failed to sign out.' };
  }
};

/**
 * Listen for Supabase Auth state changes
 */
export const onSupabaseAuthStateChange = (
  callback: (event: string, session: Session | null, profile: UserProfile | null) => void
) => {
  const client = getSupabase();
  if (!client) return () => {};

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    const profile = session?.user ? mapSupabaseUserToProfile(session.user) : null;
    callback(event, session, profile);
  });

  return () => {
    subscription.unsubscribe();
  };
};
