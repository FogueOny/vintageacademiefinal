"use client";

import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * AuthReset
 * - Force la déconnexion supabase
 * - Nettoie le storage local (clés sb-... et caches app usuels)
 * - Optionnellement rafraîchit le routeur pour un état propre
 */
export function AuthReset() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowser();
        // 1) Déconnexion explicite
        await supabase.auth.signOut();
      } catch (e) {
        // noop: continuer le cleanup même si signOut échoue
      }

      try {
        // 2) Nettoyage localStorage des clés supabase et caches potentiels
        if (typeof window !== "undefined") {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || "";
            if (
              key.startsWith("sb-") || // tokens supabase-js
              key.includes("supabase") ||
              key.includes("auth") ||
              key.includes("session")
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));

          // Nettoyage basique de sessionStorage aussi
          const sKeys: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i) || "";
            if (key.includes("supabase") || key.includes("auth") || key.includes("session")) {
              sKeys.push(key);
            }
          }
          sKeys.forEach((k) => sessionStorage.removeItem(k));
        }
      } catch (_) {}

      // 3) Petit délai puis refresh pour repartir proprement
      setTimeout(() => {
        try {
          router.refresh();
        } catch (_) {}
      }, 50);
    };

    run();
    // On veut l'exécuter une seule fois à l'arrivée sur les pages d'auth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // composant utilitaire invisible
}
