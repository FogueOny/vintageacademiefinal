"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { MainNavigation, PUBLIC_LINKS } from "@/components/main-navigation";
import { toast } from "sonner";

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('va_role');
        if (cached === 'admin' || cached === 'user') return cached;
      } catch (_) {}
    }
    return 'user';
  });
  const [roleReady, setRoleReady] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        // Activer l'UI rapidement: utiliser le rôle courant (éventuellement du cache) en attendant le profil
        setRoleReady(true);
        
        // Récupérer le rôle de l'utilisateur
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileData && profileData.role) {
          setUserRole(profileData.role);
          try { window.localStorage.setItem('va_role', profileData.role); } catch (_) {}
          setRoleReady(true);
        } else {
          // Par défaut si aucun rôle explicite trouvé
          setUserRole('user');
          setRoleReady(true);
        }
      }
    }

    // Init à partir du cache (si dispo)
    try {
      const cached = window.localStorage.getItem('va_role');
      if (cached === 'admin' || cached === 'user') { setUserRole(cached); setRoleReady(true); }
    } catch (_) {}
    getUser();

    const supabase = getSupabaseBrowser(); // S'assurer d'avoir l'instance correcte
        const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          // Activer l'UI immédiatement; le libellé s'ajustera quand le rôle arrive
          setRoleReady(true);
          // Récupérer le rôle de l'utilisateur lors du changement d'état d'authentification
          // Réutiliser la même instance supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (profileData && profileData.role) {
            setUserRole(profileData.role);
            try { window.localStorage.setItem('va_role', profileData.role); } catch (_) {}
            setRoleReady(true);
          } else {
            setUserRole('user'); // Valeur par défaut
            try { window.localStorage.setItem('va_role', 'user'); } catch (_) {}
            setRoleReady(true);
          }
        } else {
          setUserRole('user'); // Réinitialiser le rôle si l'utilisateur est déconnecté
          try { window.localStorage.removeItem('va_role'); } catch (_) {}
          setRoleReady(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Filet de sécurité: si le rôle tarde à arriver, débloquer l'UI après 2s pour éviter un spinner infini
  useEffect(() => {
    if (user && !roleReady) {
      const t = setTimeout(() => setRoleReady(true), 2000);
      return () => clearTimeout(t);
    }
  }, [user, roleReady]);

  const [isPending, startTransition] = useTransition();
  // Résout la route dashboard au clic, pour éviter un mauvais lien avant que le rôle soit chargé
  const resolveDashboardPath = () => (userRole === 'admin' ? '/admin-dashboard' : '/dashboard');
  const dashboardLabel = roleReady ? (userRole === 'admin' ? 'Tableau de bord (Admin)' : 'Tableau de bord') : 'Chargement…';
  const goToDashboard = async () => {
    try {
      // 1) Utiliser l'état courant si fiable
      if (userRole === 'admin') { router.push('/admin-dashboard'); return; }
      if (userRole === 'user') { router.push('/dashboard'); return; }
      // 2) Fallback sur le cache local
      try {
        const cached = window.localStorage.getItem('va_role');
        if (cached === 'admin') { setUserRole('admin'); router.push('/admin-dashboard'); return; }
        if (cached === 'user') { setUserRole('user'); router.push('/dashboard'); return; }
      } catch (_) {}
      // 3) Vérification rapide DB (non bloquante longtemps)
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      const role = (data as any)?.role;
      if (role === 'admin') { setUserRole('admin'); try{window.localStorage.setItem('va_role','admin');}catch(_){}; router.push('/admin-dashboard'); return; }
      setUserRole('user'); try{window.localStorage.setItem('va_role','user');}catch(_){}; router.push('/dashboard');
    } catch (_) {
      router.push('/dashboard');
    }
  };
  const handleSignOut = async () => {
    if (isPending) return;
    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowser();
        console.log('[Auth] Attempting signOut...');
        // Précharger la page login pour accélérer la navigation
        try { router.prefetch('/login'); } catch (_) {}
        const toastId = toast.loading('Déconnexion en cours…');
        await supabase.auth.signOut();
        console.log('[Auth] signOut success, redirecting to /login');
        toast.success('Déconnexion réussie', { id: toastId, duration: 1000 });
        // Laisser le temps au toast de s'afficher puis le fermer proprement avant navigation
        await new Promise((r) => setTimeout(r, 250));
        try { toast.dismiss(toastId); } catch (_) {}
        setUser(null);
        setUserRole('user');
        try {
          // Nettoyage clés locales éventuelles
          window.localStorage.removeItem('va_role');
          window.sessionStorage.removeItem('va_last_protected');
          Object.keys(window.localStorage).forEach((k) => {
            if (k.startsWith('sb-')) {
              window.localStorage.removeItem(k);
            }
          });
        } catch (e) {
          console.warn('[Auth] Failed to clear local storage', e);
        }
        // Utiliser un remplacement dur pour éviter tout état zombie
        try {
          router.replace('/login');
          router.refresh();
        } catch (_) {
          window.location.assign('/login');
        }
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    });
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo.png" 
              alt="Vintage Académie Logo" 
              width={50} 
              height={50}
              style={{ width: 'auto', height: '50px' }} 
              className="mr-3"
              priority
            />
          </Link>
          
          {/* Navigation principale (uniquement si non connecté pour éviter conflits) */}
          {!user && (
            <div className="hidden md:block ml-6">
              <MainNavigation />
            </div>
          )}
        </div>
        
        {/* Quand connecté: barre d'action simple (desktop) */}
        {user && (
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Link
              href={resolveDashboardPath()}
              prefetch={false}
              onClick={(e) => { e.preventDefault(); goToDashboard(); }}
            >
              <Button variant="outline" size="sm" disabled={!roleReady || isPending} aria-busy={!roleReady}>
                {!roleReady ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin h-3 w-3 rounded-full border-2 border-orange-500 border-t-transparent"></span>
                    Chargement…
                  </span>
                ) : (
                  dashboardLabel
                )}
              </Button>
            </Link>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleSignOut} disabled={isPending} aria-busy={isPending}>
              {isPending ? 'Déconnexion…' : 'Se déconnecter'}
            </Button>
          </div>
        )}
        <div className="flex items-center space-x-4">
          {/* Boutons d'authentification */}
          {!user ? (
            <div className="hidden sm:flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">Se connecter</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm">S'inscrire</Button>
              </Link>
            </div>
          ) : (
            // Quand connecté sur petit écran, on garde les actions dans le menu mobile uniquement
            <div className="hidden sm:block" />
          )}
          
          {/* Bouton menu mobile */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Menu mobile  */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="container px-4 py-4 space-y-4">
            <nav className="space-y-3">
              {!user ? (
                <>
                  {PUBLIC_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-2 py-2 rounded-md ${pathname === item.href ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <Link 
                    href={resolveDashboardPath()} 
                    prefetch={false}
                    className={`block px-2 py-2 rounded-md ${pathname === (userRole === 'admin' ? "/admin-dashboard" : "/dashboard") ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                    onClick={(e) => { e.preventDefault(); if (!roleReady) return; setMobileMenuOpen(false); goToDashboard(); }}
                  >
                    {dashboardLabel}
                  </Link>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 w-full"
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    disabled={isPending}
                    aria-busy={isPending}
                  >
                    {isPending ? 'Déconnexion…' : 'Se déconnecter'}
                  </Button>
                </>
              )}
            </nav>
            
            {/* Section utilisateur dans le menu mobile */}
            {!user ? (
              <div className="flex flex-col space-y-2">
                <Link href="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Se connecter</Button>
                </Link>
                <Link href="/register" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full">S'inscrire</Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {/* Overlay de chargement pendant la déconnexion */}
      {isPending && (
        <div className="fixed inset-0 z-[9999] bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-3"></div>
            <p className="text-sm text-gray-700">Déconnexion en cours…</p>
          </div>
        </div>
      )}
    </header>
  );
}
// 