import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Client global pour les composants côté client 
// Utilisation d'une variable globale pour éviter les instances multiples
let browserSupabase: ReturnType<typeof createBrowserClient<Database>> | null = null;
let hasLoggedCreation = false; // Pour éviter les logs répétitifs

export function getSupabaseBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowser should only be called in browser');
  }
  
  if (!browserSupabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are not set');
      }

      browserSupabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
      
      if (!hasLoggedCreation) {
        console.log('✅ Instance Supabase créée pour le navigateur avec auto-refresh');
        hasLoggedCreation = true;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du client Supabase:', error);
      throw new Error('Impossible de créer le client Supabase');
    }
  }
  
  return browserSupabase;
}

// Fonction utilitaire pour vérifier et renouveler la session
export async function ensureValidSession() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { valid: false, error: 'Client Supabase non disponible' };
  }
  
  try {
    console.log('🔄 Vérification de la session...');
    
    // Essayer de récupérer la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('⚠️ Erreur session:', sessionError.message);
      // Essayer de rafraîchir la session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.log('❌ Impossible de rafraîchir la session:', refreshError.message);
        return { valid: false, error: 'Session expirée' };
      }
      
      console.log('✅ Session rafraîchie avec succès');
      return { valid: true, session: refreshData.session };
    }
    
    if (!session) {
      console.log('❌ Aucune session trouvée');
      return { valid: false, error: 'Aucune session' };
    }
    
    // Vérifier si la session expire bientôt (dans les 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry < 300) { // 5 minutes
      console.log('⏰ Session expire bientôt, rafraîchissement...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.log('❌ Erreur rafraîchissement:', refreshError.message);
        return { valid: false, error: 'Impossible de rafraîchir' };
      }
      
      console.log('✅ Session rafraîchie préventivement');
      return { valid: true, session: refreshData.session };
    }
    
    console.log('✅ Session valide');
    return { valid: true, session };
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de session:', error);
    return { valid: false, error: 'Erreur technique' };
  }
}

// Export pour compatibilité avec le code existant
export const supabase = getSupabaseBrowser;

export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'https://vafinal.netlify.app/';
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  
  // Make sure to include trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  
  return url;
};
/*
  http://localhost:3000/
*/

// Helper: redirect user to login with next param
export function forceReauth(nextPath?: string) {
  if (typeof window === 'undefined') return;
  const next = nextPath || window.location.pathname + window.location.search;
  const url = new URL('/login', window.location.origin);
  if (next && next.startsWith('/')) url.searchParams.set('next', next);
  try {
    window.location.assign(url.toString());
  } catch (error) {
    try {
      window.location.assign('/login');
    } catch (fallbackError) {
      console.warn('[forceReauth] fallback navigation failed', fallbackError);
    }
  }
}