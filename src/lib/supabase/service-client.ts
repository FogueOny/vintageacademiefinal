import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Client Supabase avec la clé de service pour ignorer les politiques RLS
// À utiliser uniquement dans des composants qui nécessitent un accès complet aux données
// Note: Ce client ne devrait être utilisé que lorsque nécessaire, car il contourne les mesures de sécurité

// Instance singleton pour éviter les instances multiples côté serveur
let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase service client must not be instantiated in the browser');
  }

  if (!serviceClient) {
    serviceClient = createServiceClient();
  }

  return serviceClient;
}

export const supabaseServiceClient = getSupabaseServiceClient();
