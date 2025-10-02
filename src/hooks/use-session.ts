import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    let refreshAttempted = false;
    const SAFETY_TIMEOUT_MS = 7000;
    const safetyTimer = setTimeout(() => {
      if (!mounted) return;
      console.warn('[Auth][useSession] Safety timeout reached; forcing loading=false');
      setSessionState((s) => ({ ...s, loading: false, error: s.error ?? 'Timeout session' }));
    }, SAFETY_TIMEOUT_MS);

    async function checkSession() {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          if (mounted) {
            setSessionState({
              user: null,
              loading: false,
              error: 'Client Supabase non disponible'
            });
          }
          return;
        }

        console.log('[Auth][useSession] 🔄 Vérification de la session...');

        // Récupérer la session actuelle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth][useSession] ❌ Erreur session:', sessionError);
          if (mounted) {
            setSessionState({
              user: null,
              loading: false,
              error: 'Erreur de session'
            });
          }
          return;
        }

        if (!session) {
          console.log('[Auth][useSession] 🔄 Pas de session, tentative de rafraîchissement...');

          // Essayer de rafraîchir la session (une seule fois)
          if (refreshAttempted) {
            console.warn('[Auth][useSession] Refresh déjà tenté, on arrête.');
            if (mounted) {
              setSessionState({ user: null, loading: false, error: 'Aucune session valide' });
            }
            return;
          }
          refreshAttempted = true;
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('[Auth][useSession] ❌ Erreur rafraîchissement:', refreshError);
            const msg = refreshError instanceof Error ? refreshError.message : '';
            // Si refresh token invalide: nettoyer localStorage mais ne pas forcer signOut ici
            if (msg.toLowerCase().includes('invalid refresh token')) {
              console.warn('[Auth][useSession] Refresh token invalide — nettoyage localStorage (pas de signOut agressif)');
              try {
                Object.keys(window.localStorage).forEach((k) => {
                  if (k.startsWith('sb-')) {
                    console.log('[Auth][useSession] Clearing', k);
                    window.localStorage.removeItem(k);
                  }
                });
              } catch {}
            }
            if (mounted) {
              setSessionState({
                user: null,
                loading: false,
                error: 'Session expirée'
              });
            }
            return;
          }

          if (refreshData.session) {
            console.log('[Auth][useSession] ✅ Session rafraîchie avec succès');
            if (mounted) {
              setSessionState({
                user: refreshData.session.user,
                loading: false,
                error: null
              });
            }
            return;
          } else {
            console.log('[Auth][useSession] ❌ Pas de session après rafraîchissement');
            if (mounted) {
              setSessionState({
                user: null,
                loading: false,
                error: 'Aucune session valide'
              });
            }
            return;
          }
        }

        console.log('[Auth][useSession] ✅ Session valide trouvée:', session.user.email);
        if (mounted) {
          setSessionState({
            user: session.user,
            loading: false,
            error: null
          });
        }

      } catch (error: unknown) {
        console.error('[Auth][useSession] ❌ Erreur lors de la vérification de session:', error);
        if (mounted) {
          setSessionState({
            user: null,
            loading: false,
            error: 'Erreur technique'
          });
        }
      }
    }

    // Écouter les changements de session
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          console.log('[Auth][useSession] 🔄 Changement d\'état d\'authentification:', event);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session) {
              if (mounted) {
                setSessionState({
                  user: session.user,
                  loading: false,
                  error: null
                });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            if (mounted) {
              setSessionState({
                user: null,
                loading: false,
                error: null
              });
            }
          }
        }
      );

      checkSession();

      return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(safetyTimer);
      };
    }

    setSessionState({
      user: null,
      loading: false,
      error: 'Client Supabase non disponible'
    });
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  return sessionState;
}