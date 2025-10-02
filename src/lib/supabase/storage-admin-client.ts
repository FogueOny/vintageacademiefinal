/**
 * Client Supabase spécifique pour les opérations d'administration du stockage
 * Ce client est utilisé pour contourner les politiques RLS pour l'upload de fichiers
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// Vérifie si on est côté client ou serveur
const isBrowser = typeof window !== 'undefined';

// Crée un client spécial pour administrer le stockage quand la clé de service est disponible
export const getStorageAdminClient = () => {
  // Ne renvoie le client admin que si une clé de service est configurée
  if (supabaseServiceKey && !isBrowser) {
    // Côté serveur uniquement avec clé service
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  
  // Dans tous les autres cas, renvoie null
  console.warn('Storage admin client unavailable: either running in browser or missing service key');
  return null;
};

export const isStorageAdminAvailable = () => {
  return !!supabaseServiceKey && !isBrowser;
};
