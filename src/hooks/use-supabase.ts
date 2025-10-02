import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/**
 * Hook qui retourne l'instance Supabase singleton pour les composants React
 * Utilise la fonction getSupabaseBrowser du fichier client.ts pour éviter
 * les instances multiples de GoTrueClient
 */
type BrowserSupabaseClient = ReturnType<typeof getSupabaseBrowser>;

export const useSupabase = (): BrowserSupabaseClient => {
  // Avoid calling the browser-only factory during SSR/prerender
  if (typeof window === 'undefined') {
    // Return a lightweight proxy that prevents accidental server usage
    return new Proxy({} as BrowserSupabaseClient, {
      get() {
        throw new Error('Supabase client is only available in the browser');
      }
    });
  }
  // In the browser, lazily initialize and reuse the singleton
  return getSupabaseBrowser();
};
