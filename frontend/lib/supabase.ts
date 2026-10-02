import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local session helper for local development fallback if Supabase keys are not yet provided
export const getActiveAuthToken = async (): Promise<string | null> => {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return session.access_token;
      }
    } catch (e) {
      console.warn("Could not get Supabase session:", e);
    }
  }
  
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nutri_local_token') || 'local-demo-token';
  }
  return null;
};
