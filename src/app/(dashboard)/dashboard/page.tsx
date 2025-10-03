"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowser, ensureValidSession } from "@/lib/supabase/client";
// Nettoyage des imports inutilisés

import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { fetchJsonWithAuth } from "@/lib/fetch-with-auth";
import SessionGuard from "@/components/auth/SessionGuard";

interface Module {
  id: string;
  name: string;
  description: string;
  type: string;
  slug: string;
  icon: string;
}

type DashboardStats = {
  subscription: string;
  expiryDate: string;
  testsCompleted: string | number;
  averageScore: string | number;
};

type DashboardProfile = {
  is_suspended?: boolean | null;
} | null;

type OverviewStats = {
  subscriptionStatus: string | null;
  subscriptionExpiry: string | null;
  testsCompleted: number;
  averageScore: number | null;
};

type OverviewResponse = {
  user: User | null;
  profile: DashboardProfile;
  credits: number;
  stats: OverviewStats;
  isAdmin: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DashboardProfile>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Navigation désormais vers des pages dédiées pour chaque module (plus de rendu in-page)
  const [stats, setStats] = useState<DashboardStats>({
    subscription: '—',
    expiryDate: '—',
    testsCompleted: '—',
    averageScore: '—',
  });

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (e) {
      console.error("Erreur lors du logout:", e);
    }
  }

  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if ((e as any).persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handler as unknown as EventListener);
    return () => window.removeEventListener('pageshow', handler as unknown as EventListener);
  }, []);

  // Filet de sécurité anti-spinner infini: si loading persiste trop longtemps, on lève le drapeau
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      console.warn('⏱️ Timeout loading atteint - forçage loading=false');
      setLoading(false);
    }, 8000); // Augmenté à 8 secondes
    return () => clearTimeout(t);
  }, [loading]);

  // Persist last protected route for reliable BFCache back/forward redirects
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const full = window.location.pathname + (window.location.search || '');
        if (full.startsWith('/dashboard')) {
          window.sessionStorage.setItem('va_last_protected', full || '/dashboard');
        }
      }
    } catch (_) {}
  }, []);

  const loadDashboardData = useCallback(async () => {
    let aborted = false;
    try {
      console.log('📊 Début chargement dashboard...');
      setLoading(true);

      // Timeout pour ensureValidSession
      const sessionCheckPromise = ensureValidSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      );
      
      const sessionCheck = await Promise.race([sessionCheckPromise, timeoutPromise]) as Awaited<ReturnType<typeof ensureValidSession>>;
      console.log('🔐 Session check:', sessionCheck.valid);
      if (!sessionCheck.valid) {
        try { window.localStorage.removeItem('va_role'); } catch (_) {}
        router.replace('/login?next=/dashboard');
        return;
      }

      console.log('📡 Appel API /api/dashboard/overview...');
      const overview = await fetchJsonWithAuth<OverviewResponse>(
        '/api/dashboard/overview',
        { timeoutMs: 8000 }
      );

      if (aborted) return;

      console.log('✅ Données reçues:', { user: overview.user?.email, isAdmin: overview.isAdmin });
      setUser(overview.user);
      setProfile(overview.profile);

      if (overview.isAdmin) {
        setIsAdmin(true);
        try { window.localStorage.setItem('va_role', 'admin'); } catch (_) {}
        router.replace('/admin-dashboard');
        return;
      }

      setIsAdmin(false);
      try { window.localStorage.removeItem('va_role'); } catch (_) {}

      const subscriptionLabel = overview.stats?.subscriptionStatus ?? 'Aucun';
      let expiryDateStr = '—';
      if (overview.stats?.subscriptionExpiry) {
        const d = new Date(overview.stats.subscriptionExpiry);
        if (!isNaN(d.getTime())) {
          expiryDateStr = d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        }
      }

      const completed = overview.stats?.testsCompleted ?? 0;
      const average = overview.stats?.averageScore;

      setCredits(typeof overview.credits === 'number' ? overview.credits : 0);
      setStats({
        subscription: subscriptionLabel,
        expiryDate: expiryDateStr,
        testsCompleted: completed > 0 ? completed : '—',
        averageScore: average != null ? `${average}` : '—',
      });

      try {
        const payload = await fetchJsonWithAuth<{ data: Module[] }>(
          '/api/modules',
          { timeoutMs: 12000 }
        );
        if (!aborted) {
          setModules(payload?.data || []);
        }
      } catch (modulesError: unknown) {
        if (!aborted) {
          console.error('Erreur chargement modules via API:', modulesError);
          // Retry une fois avec un timeout plus long
          try {
            const retryPayload = await fetchJsonWithAuth<{ data: Module[] }>(
              '/api/modules',
              { timeoutMs: 15000 }
            );
            if (!aborted) {
              setModules(retryPayload?.data || []);
            }
          } catch (retryError) {
            console.error('Retry modules échoué:', retryError);
          }
        }
      }
    } catch (error: unknown) {
      console.error('❌ Erreur chargement dashboard:', error);
      
      // Si timeout de session check, essayer quand même de charger
      if (error instanceof Error && error.message === 'Session check timeout') {
        console.log('⚠️ Session check timeout - tentative de chargement direct...');
        try {
          const overview = await fetchJsonWithAuth<OverviewResponse>(
            '/api/dashboard/overview',
            { timeoutMs: 8000 }
          );
          
          console.log('✅ Données reçues (bypass session check):', { user: overview.user?.email });
          setUser(overview.user);
          setProfile(overview.profile);
          
          if (overview.isAdmin) {
            setIsAdmin(true);
            try { window.localStorage.setItem('va_role', 'admin'); } catch (_) {}
            router.replace('/admin-dashboard');
            return;
          }
          
          setIsAdmin(false);
          const subscriptionLabel = overview.stats?.subscriptionStatus ?? 'Aucun';
          let expiryDateStr = '—';
          if (overview.stats?.subscriptionExpiry) {
            const d = new Date(overview.stats.subscriptionExpiry);
            if (!isNaN(d.getTime())) {
              expiryDateStr = d.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });
            }
          }
          
          const completed = overview.stats?.testsCompleted ?? 0;
          const average = overview.stats?.averageScore;
          
          setCredits(typeof overview.credits === 'number' ? overview.credits : 0);
          setStats({
            subscription: subscriptionLabel,
            expiryDate: expiryDateStr,
            testsCompleted: completed > 0 ? completed : '—',
            averageScore: average != null ? `${average}` : '—',
          });
          
          // Charger modules
          try {
            const payload = await fetchJsonWithAuth<{ data: Module[] }>(
              '/api/modules',
              { timeoutMs: 12000 }
            );
            setModules(payload?.data || []);
          } catch (_) {
            console.error('Erreur chargement modules');
          }
          
          setLoading(false);
          return;
        } catch (bypassError) {
          console.error('❌ Bypass échoué:', bypassError);
        }
      }
      
      if (typeof error === 'object' && error !== null && 'status' in error && (error as { status?: number }).status === 401) {
        try { window.localStorage.removeItem('va_role'); } catch (_) {}
        router.replace('/login?next=/dashboard');
        return;
      }
      console.error('Erreur chargement overview dashboard:', error);
    } finally {
      if (!aborted) {
        console.log('🏁 Fin chargement - setLoading(false)');
        setLoading(false);
      }
    }

    return () => {
      aborted = true;
    };
  }, [router]);

  useEffect(() => {
    let abortCleanup: (() => void) | undefined;
    let mounted = true;

    console.log('🚀 useEffect dashboard monté');
    
    // Toujours charger les données au montage du composant
    loadDashboardData().then((cleanup) => {
      if (mounted) {
        abortCleanup = cleanup;
      }
    }).catch((err) => {
      console.error('❌ Erreur dans loadDashboardData:', err);
    });

    try {
      const supabase = getSupabaseBrowser();
      const { data: subscriptionListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setCredits(0);
          setStats({ subscription: '—', expiryDate: '—', testsCompleted: '—', averageScore: '—' });
          setModules([]);
          setIsAdmin(false);
          try { window.localStorage.removeItem('va_role'); } catch (_) {}
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          loadDashboardData();
        }
      });
      return () => {
        mounted = false;
        abortCleanup?.();
        subscriptionListener.subscription?.unsubscribe();
      };
    } catch (_error) {
      return () => {
        mounted = false;
        abortCleanup?.();
      };
    }
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Chargement de votre espace...</p>
      </div>
    );
  }

  // Garde d'accès: compte suspendu
  if (user && profile?.is_suspended) {
    const adminWa = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP;
    const text = encodeURIComponent(
      `Bonjour, mon compte (${user?.email}) est suspendu sur Vintage Académie. Pouvez-vous le réactiver ?`
    );
    const waLink = adminWa ? `https://wa.me/${adminWa}?text=${text}` : null;
    return (
      <div className="container py-16 max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-red-700">Compte suspendu</h1>
          <p className="mt-2 text-red-800">
            Votre compte a été suspendu par un administrateur. Vous ne pouvez pas accéder au tableau de bord pour le moment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                Contacter l&apos;admin via WhatsApp
              </a>
            )}
            <button onClick={handleLogout} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
              Se déconnecter
            </button>
          </div>
          {!waLink && (
            <p className="mt-3 text-sm text-red-700">
              Astuce: définissez la variable d'environnement <code className="font-mono">NEXT_PUBLIC_ADMIN_WHATSAPP</code> pour activer le bouton WhatsApp.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Code à l'origine utilisé pour les activités récentes a été retiré
  
  return (
    <>
    {/* SessionGuard: force login redirect if session expired/invalid */}
    <SessionGuard />
    <div className="container mx-auto px-4 py-12 md:py-16">
          {/* Local navbar (logo + name + logout) */}
          <header className="mb-10">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <img src="/images/logo.png" alt="Vintage Académie" className="h-10 w-10 rounded-md object-cover" />
                <span className="text-xl md:text-2xl font-bold">Vintage Académie</span>
              </Link>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href="/admin-dashboard" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-orange-50">
                    <span className="font-medium text-orange-700">Admin</span>
                  </Link>
                )}
                <Link href="/simulateur" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-orange-50">
                  <span className="font-medium text-orange-700">Simulateur</span>
                  <span className="rounded-full bg-orange-600 text-white px-2 py-0.5 text-xs">
                    {credits === null ? '…' : credits}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                  aria-label="Se déconnecter"
                >
                  <span className="hidden sm:inline">Se déconnecter</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3-3m0 0l3 3m-3-3v12"/></svg>
                </button>
              </div>
            </div>
          </header>

          {/* Hero section (aligned with homepage) */}
          <section className="py-0 md:py-2 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="text-primary">Bienvenue</span>
                  {user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  {/* CTA Card 1 */}
                  <div className="bg-primary text-primary-foreground rounded-lg p-6 transform transition-transform hover:scale-105">
                    <h2 className="text-2xl font-bold mb-4">Entraînements TCF</h2>
                    <p className="mb-2">Séries réalistes CO/CE avec niveaux A2 → C1.</p>
                    <ul className="mb-4 text-sm list-disc list-inside opacity-95">
                      <li>Correction automatique et explications</li>
                      <li>Chronométrage proche des conditions r eeles</li>
                    </ul>
                    <Link
                      href="/dashboard/tests/comprehension-orale"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-white text-primary font-bold py-3 px-4 rounded text-center cursor-pointer"
                    >
                      Commencer
                    </Link>
                  </div>

                  {/* CTA Card 2 - Examen Blanc */}
                  <div className="bg-primary text-primary-foreground rounded-lg p-6 transform transition-transform hover:scale-105">
                    <h2 className="text-2xl font-bold mb-4">Examen Blanc</h2>
                    <p className="mb-2">Mix CO/CE + EE/EO (39 Q + 3 E + 2 EO).</p>
                    <ul className="mb-4 text-sm list-disc list-inside opacity-95">
                      <li>Conditions réelles d&apos;examen</li>
                      <li>Évaluation complète des 4 compétences</li>
                    </ul>
                    <Link
                      href="/dashboard/exam-blanc"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-white text-primary font-bold py-3 px-4 rounded text-center cursor-pointer"
                    >
                      Démarrer
                    </Link>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <img
                  src="/images/hero2.png"
                  alt="Préparation TCF"
                  width={600}
                  height={450}
                  className="rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Statistiques utilisateur retirées à la demande */}

          {/* Entraînements TCF */}
          <section className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Entraînements TCF</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card: Compréhension Orale (TCF) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-primary"></div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Compréhension Orale (TCF)</h3>
                  <p className="text-gray-600 mb-3">Séries d&apos;entraînement inspirées des pages TCF.</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">A2–C1</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Audio natif</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Chronométré</span>
                  </div>
                  <Link
                    href="/dashboard/tests/comprehension-orale"
                    onClick={() => setIsNavigating(true)}
                    className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                  >
                    Commencer
                  </Link>
                </div>
              </div>

              {/* Card: Compréhension Écrite (TCF) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-primary"></div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Compréhension Écrite (TCF)</h3>
                  <p className="text-gray-600 mb-3">Textes authentiques, questions progressives et feedback.</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">A2–C1</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Analyse de réponses</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Mode examen</span>
                  </div>
                  <Link
                    href="/dashboard/tests/comprehension-ecrite"
                    onClick={() => setIsNavigating(true)}
                    className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                  >
                    Commencer
                  </Link>
                </div>
              </div>

              {/* Card: Expression Écrite (TCF) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-primary"></div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Expression Écrite (TCF)</h3>
                  <p className="text-gray-600 mb-3">Dédié aux utilisateurs connectés.</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">Tâches 1, 2, 3</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Corrections</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Formations</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                      href="/expression-ecrite-tcf/repondre/choisir-sujet?task=1"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                    >
                      Tâche 1
                    </Link>
                    <Link
                      href="/expression-ecrite-tcf/repondre/choisir-sujet?task=2"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                    >
                      Tâche 2
                    </Link>
                    <Link
                      href="/expression-ecrite-tcf/repondre/choisir-sujet?task=3"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                    >
                      Tâche 3 (2 docs)
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card: Expression Orale (TCF) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-primary"></div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Expression Orale (TCF)</h3>
                  <p className="text-gray-600 mb-3">Choisissez la période et le sujet, enregistrez votre audio et envoyez-le par email.</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">Tâches 1, 2, 3</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Enregistrement</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Email</span>
                  </div>
                  <Link
                    href="/dashboard/examen-orale"
                    onClick={() => setIsNavigating(true)}
                    className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                  >
                    Découvrir
                  </Link>
                </div>
              </div>

              {/* Card: Examen Blanc (TCF) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-primary"></div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Examen Blanc (TCF)</h3>
                  <p className="text-gray-600 mb-3">Mix CO/CE + EE/EO (39 Q + 3 E + 2 EO).</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">4 compétences</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Conditions réelles</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Évaluation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/dashboard/exam-blanc"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded text-center hover:bg-primary/90 transition-colors"
                    >
                      Démarrer
                    </Link>
                    <Link
                      href="/dashboard/mes-examens"
                      onClick={() => setIsNavigating(true)}
                      className="inline-block w-full bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded text-center hover:bg-gray-200 transition-colors"
                    >
                      Mes résultats
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
      </div>
      {/* Instant blur overlay during navigation */}
      {isNavigating && (
        <div className="fixed inset-0 z-[2000]">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm" />
          <div className="relative h-full w-full flex items-center justify-center">
            <div className="rounded-2xl border border-white/30 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md shadow-2xl p-6 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-primary/80 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">Préparation de la page…</p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton WhatsApp flottant pour contacter l'admin */}
      <FloatingWhatsAppButton />
      {/* Footer professionnel avec mention 'Développé par Evolue' */}
      <ProfessionalFooter />
    </>
  );
}