import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function getDebugSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getDebugSupabaseClient should only be called in browser');
  }

  console.log('🔍 Création du client Supabase de debug...');
  console.log('📊 localStorage avant création:', Object.keys(localStorage));
  console.log('📊 Cookies avant création:', document.cookie);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set');
  }

  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  console.log('✅ Client Supabase de debug créé');
  console.log('📊 localStorage après création:', Object.keys(localStorage));

  return client;
}

export async function debugSession() {
  const supabase = getDebugSupabaseClient();
  
  console.log('🔍 Debug de la session...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('📊 Résultat getSession:', {
      hasSession: !!session,
      error: error?.message,
      sessionDetails: session ? {
        user: session.user.email,
        expiresAt: session.expires_at,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token
      } : null
    });

    return { session, error };
  } catch (error) {
    console.error('❌ Erreur lors du debug de session:', error);
    return { session: null, error };
  }
} 