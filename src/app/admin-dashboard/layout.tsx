'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { resolveUserRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  FileText, 
  LogOut,
  BookOpen,
  HelpCircle,
  Mic,
  Menu,
  Phone
} from "lucide-react";
import SessionGuard from "@/components/auth/SessionGuard";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const evolueWhatsapp = (process.env.NEXT_PUBLIC_EVOLUE_WHATSAPP ?? '').toString();
  const evolueUrl = evolueWhatsapp ? `https://wa.me/${evolueWhatsapp.replace(/[^0-9]/g, '')}` : '';

  // Reload if page is restored from BFCache to avoid showing stale protected content after logout + back
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if ((e as any).persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handler as any);
    return () => window.removeEventListener('pageshow', handler as any);
  }, []);

  useEffect(() => {
    async function checkAdminAccess() {
      console.log("🔍 Vérification de l'accès admin...");
      
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          console.error("Supabase client not available");
          return;
        }
        if (!supabase) {
          setError("Client Supabase non disponible");
          setLoading(false);
          return;
        }

        // Vérifier la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log("❌ Pas de session. Affichage de l'écran d'erreur avec action connexion.");
          setError("Session expirée ou invalide. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }

        console.log("✅ Session trouvée:", session.user.email);

        const roleResult = await resolveUserRole(supabase, session.user.id, {
          rpcTimeouts: [1200, 1600, 2000],
          profileTimeoutMs: 1400,
        });

        if (roleResult.errors.length) {
          console.warn('[admin-layout] resolveUserRole issues', roleResult.errors);
        }

        if (!roleResult.isAdmin) {
          console.log("❌ Utilisateur non admin, redirection vers dashboard");
          try { window.localStorage.removeItem('va_role'); } catch (_) {}
          router.push("/dashboard");
          return;
        }

        try { window.localStorage.setItem('va_role', 'admin'); } catch (_) {}

        // Définir un utilisateur minimal immédiatement (sans bloquer)
        const minimalUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: undefined,
          role: 'admin',
        };
        setUser(minimalUser);
        console.log("✅ Accès admin confirmé via resolveUserRole");

        // Optionnel: récupérer le profil pour enrichir l'affichage, sans bloquer l'accès
        (async () => {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', session.user.id)
              .maybeSingle();
            if (data) {
              setUser((prev) => prev ? { ...prev, full_name: data.full_name || prev.full_name, email: data.email || prev.email } : prev);
            }
          } catch {
            // ignore enrich errors
          }
        })();
      } catch (error) {
        console.error("❌ Erreur:", error);
        setError("Erreur lors de la vérification des permissions");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  // Persist last protected route for reliable BFCache back/forward redirects
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && pathname && pathname.startsWith('/admin-dashboard')) {
        const full = pathname + (window.location.search || '');
        window.sessionStorage.setItem('va_last_protected', full || '/admin-dashboard');
      }
    } catch (_) {}
  }, [pathname]);

  // Stop nav loading when the route changes
  useEffect(() => {
    if (!loading) {
      setNavLoading(false);
    }
  }, [pathname, loading]);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowser();
        if (!supabase) {
          console.error("Supabase client not available");
          return;
        }
        if (supabase) {
        await supabase.auth.signOut();
        router.replace("/login");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Navigation helper to show loading overlay during route change
  const go = (path: string) => {
    setNavLoading(true);
    router.push(path);
  };

  const isActiveRoute = (route: string) => {
    // Highlight on exact match or nested routes (e.g., /admin-dashboard/test-series/[id]/preview)
    return pathname === route || pathname.startsWith(route + "/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Vérification...</h2>
          <p className="text-gray-600">Vérification de votre accès administrateur</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-red-600">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/login")}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SessionGuard: force login redirect if session expired/invalid */}
      <SessionGuard />
      {/* Mobile Hamburger (floating) */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        {/* Header Sidebar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Administration</h1>
              <p className="text-sm text-gray-600">Vintage Académie</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">{user.full_name || 'Utilisateur'}</span>
            </div>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-600 uppercase">{user.role}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Gestion</h3>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/modules') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/modules')}
            >
              <BookOpen className="h-4 w-4 mr-3" />
              Modules
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/test-series') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/test-series')}
            >
              <FileText className="h-4 w-4 mr-3" />
              Séries de tests
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/questions') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/questions')}
            >
              <HelpCircle className="h-4 w-4 mr-3" />
              Questions
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/exam-blanc') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/exam-blanc')}
            >
              <FileText className="h-4 w-4 mr-3" />
              Examen blanc
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/expression-ecrite') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/expression-ecrite')}
            >
              <FileText className="h-4 w-4 mr-3" />
              Expression Écrite TCF
            </Button>

            {/* Lien vers Expression Orale (admin page) */}
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/expression-orale') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/expression-orale')}
            >
              <Mic className="h-4 w-4 mr-3" />
              Expression Orale TCF
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActiveRoute('/admin-dashboard/users') ? 'bg-orange-50 text-orange-700' : ''}`}
              onClick={() => go('/admin-dashboard/users')}
            >
              <Users className="h-4 w-4 mr-3" />
              Utilisateurs
            </Button>
          </div>
          
          {/* Analytics/Settings section removed as requested */}
        </nav>

        {/* Logout (pinned bottom by flex-col + h-screen) */}
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
          
        </div>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span className="font-semibold">Administration</span>
            </div>
            {/* User */}
            <div className="p-4 border-b border-gray-200 space-y-1 text-sm">
              <div className="font-medium">{user.full_name || 'Utilisateur'}</div>
              <div className="text-gray-600">{user.email}</div>
            </div>
            {/* Nav (scrollable) */}
            <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Gestion</h3>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/modules') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/modules'); }}>
                <BookOpen className="h-4 w-4 mr-3" /> Modules
              </Button>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/test-series') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/test-series'); }}>
                <FileText className="h-4 w-4 mr-3" /> Séries de tests
              </Button>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/questions') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/questions'); }}>
                <HelpCircle className="h-4 w-4 mr-3" /> Questions
              </Button>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/exam-blanc') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/exam-blanc'); }}>
                <FileText className="h-4 w-4 mr-3" /> Examen blanc
              </Button>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/expression-ecrite') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/expression-ecrite'); }}>
                <FileText className="h-4 w-4 mr-3" /> Expression Écrite TCF
              </Button>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/expression-orale') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/expression-orale'); }}>
                <Mic className="h-4 w-4 mr-3" /> Expression Orale TCF
              </Button>
              <Button variant="ghost" className={`w-full justify-start ${isActiveRoute('/admin-dashboard/users') ? 'bg-orange-50 text-orange-700' : ''}`} onClick={() => { setMobileOpen(false); go('/admin-dashboard/users'); }}>
                <Users className="h-4 w-4 mr-3" /> Utilisateurs
              </Button>
              <div className="pt-2 border-t border-gray-200">
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </Button>
                
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 lg:px-6 py-6 relative">
        {children}
        {navLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-900">Chargement…</h2>
              <p className="text-sm text-gray-700 mt-1">Merci de patienter pendant le chargement de la page.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}