"use client";

import { getSupabaseBrowser } from './client';

// Cette fonction fournit un client Supabase qui fonctionne partout
// Dans les environnements Pages Router, App Router, et à la fois côté client et serveur
export async function getSupabaseHybrid() {
  // Toujours utiliser le client navigateur - compatible partout
  return getSupabaseBrowser();
}
