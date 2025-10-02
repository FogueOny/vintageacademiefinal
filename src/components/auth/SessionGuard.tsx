"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser, ensureValidSession } from "@/lib/supabase/client";

/**
 * SessionGuard
 * - Empêche les chargements infinis si la session a expiré ou si le refresh échoue
 * - Redirige proprement vers /login?next=<page-courante>
 * - Réagit aux événements d'auth (SIGNED_OUT, TOKEN_REFRESHED)
 */
export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowser();

    (async () => {
      try {
        // Vérification proactive (rafraîchit si expiration < 5mn)
        const res = await ensureValidSession();
        if (!mounted) return;
        if (!res.valid) {
          const url = new URL('/login', window.location.origin);
          if (pathname) url.searchParams.set('next', pathname);
          router.replace(url.toString());
          return;
        }
      } catch (_) {
        if (!mounted) return;
        const url = new URL('/login', window.location.origin);
        if (pathname) url.searchParams.set('next', pathname);
        router.replace(url.toString());
        return;
      }
    })();

    // Écoute des changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        const url = new URL('/login', window.location.origin);
        if (pathname) url.searchParams.set('next', pathname);
        router.replace(url.toString());
      }
      // TOKEN_REFRESHED -> rien à faire, on reste sur place
    });

    // Sur retour d'onglet, réévaluer la session
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        ensureValidSession().then((res) => {
          if (!mounted) return;
          if (!res.valid) {
            const url = new URL('/', window.location.origin);
            window.location.assign(url.toString());
          }
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pathname, router]);

  return null;
}
