"use client";

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  subscription_status: string;
  subscription_expiry: string | null;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
}

// Cache global pour éviter les requêtes multiples
let globalAuthState: AuthState | null = null;
let authPromise: Promise<AuthState> | null = null;

export function useAuthUnified() {
  const [authState, setAuthState] = useState<AuthState>(() => 
    globalAuthState || {
      user: null,
      profile: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      hasActiveSubscription: false,
    }
  );

  const checkAuth = useCallback(async (): Promise<AuthState> => {
    // Si une vérification est déjà en cours, attendre son résultat
    if (authPromise) {
      return authPromise;
    }

    authPromise = (async () => {
      try {
        const supabase = getSupabaseBrowser();
        
        // Timeout pour éviter les blocages réseau (augmenté pour réduire les faux négatifs)
        const authTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 12000)
        );

        // Vérifier l'utilisateur avec timeout
        const userResult = await Promise.race([
          supabase.auth.getUser(),
          authTimeout
        ]);

        const user = userResult?.data?.user || null;
        let profile: UserProfile | null = null;
        let hasActiveSubscription = false;

        // Si utilisateur connecté, récupérer le profil
        if (user) {
          try {
            const profileTimeout = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 6000)
            );

            const profileResult = await Promise.race([
              supabase.from('profiles').select('*').eq('id', user.id).single(),
              profileTimeout
            ]);

            if (profileResult.data && !profileResult.error) {
              profile = profileResult.data as UserProfile;
              
              // Vérifier l'abonnement
              const now = new Date();
              const expiryDate = profile.subscription_expiry ? new Date(profile.subscription_expiry) : null;
              hasActiveSubscription = profile.subscription_status === 'active' && 
                                   !!expiryDate && 
                                   expiryDate > now;
            }
          } catch (profileError) {
            console.warn('Erreur profil, continuation sans profil:', profileError);
          }
        }

        const newState: AuthState = {
          user,
          profile,
          loading: false,
          error: null,
          isAuthenticated: !!user,
          hasActiveSubscription,
        };

        // Mettre à jour le cache global
        globalAuthState = newState;
        return newState;

      } catch (error) {
        console.warn('Erreur auth, conservation de l\'état précédent si disponible:', error);
        
        // Si on a déjà un état global (ex: utilisateur connu), ne pas flasher en anonyme
        if (globalAuthState) {
          const preserved: AuthState = { ...globalAuthState, loading: false };
          globalAuthState = preserved;
          return preserved;
        }

        // Sinon, fallback anonyme
        const errorState: AuthState = {
          user: null,
          profile: null,
          loading: false,
          error: null, // Pas d'erreur visible, juste mode anonyme
          isAuthenticated: false,
          hasActiveSubscription: false,
        };

        globalAuthState = errorState;
        return errorState;
      } finally {
        authPromise = null;
      }
    })();

    return authPromise;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Si on a déjà un état en cache et qu'il n'est pas en loading, l'utiliser
    if (globalAuthState && !globalAuthState.loading) {
      if (mounted) {
        setAuthState(globalAuthState);
      }
      return;
    }

    // Sinon, vérifier l'auth
    checkAuth().then((newState) => {
      if (mounted) {
        setAuthState(newState);
      }
    });

    // Écouter les changements d'auth
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Changement d\'état:', event);
        
        if (event === 'SIGNED_OUT') {
          const loggedOutState: AuthState = {
            user: null,
            profile: null,
            loading: false,
            error: null,
            isAuthenticated: false,
            hasActiveSubscription: false,
          };
          globalAuthState = loggedOutState;
          if (mounted) {
            setAuthState(loggedOutState);
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Invalider le cache et re-vérifier
          globalAuthState = null;
          authPromise = null;
          
          // Appliquer immédiatement la session connue pour éviter les flashs anonymes
          if (session?.user) {
            const immediate: AuthState = {
              user: session.user,
              profile: null,
              loading: true,
              error: null,
              isAuthenticated: true,
              hasActiveSubscription: false,
            };
            globalAuthState = immediate;
            if (mounted) setAuthState(immediate);
          }

          checkAuth().then((newState) => {
            if (mounted) {
              setAuthState(newState);
            }
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  // Fonction pour forcer un refresh
  const refreshAuth = useCallback(async () => {
    globalAuthState = null;
    authPromise = null;
    
    setAuthState(prev => ({ ...prev, loading: true }));
    
    const newState = await checkAuth();
    setAuthState(newState);
    
    return newState;
  }, [checkAuth]);

  // Fonction pour se déconnecter
  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      
      // Nettoyer le cache
      globalAuthState = null;
      authPromise = null;
      
      const loggedOutState: AuthState = {
        user: null,
        profile: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        hasActiveSubscription: false,
      };
      
      setAuthState(loggedOutState);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }, []);

  return {
    ...authState,
    refreshAuth,
    signOut,
  };
}

// Hook simplifié pour juste savoir si l'utilisateur est connecté
export function useIsAuthenticated() {
  const { isAuthenticated, loading } = useAuthUnified();
  return { isAuthenticated, loading };
}

// Hook pour vérifier l'abonnement
export function useSubscription() {
  const { hasActiveSubscription, profile, loading } = useAuthUnified();
  return { hasActiveSubscription, profile, loading };
}
