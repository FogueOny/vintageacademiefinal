"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MainNavigation } from "@/components/main-navigation";
import { Menu, X, User } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Vérifier la session et récupérer le rôle
    const init = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: sessionRes } = await supabase.auth.getSession();
        const hasSession = !!sessionRes?.session;
        setIsLoggedIn(hasSession);
        if (hasSession) {
          const { data: userRes } = await supabase.auth.getUser();
          const uid = userRes?.user?.id;
          if (uid) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', uid)
              .single();
            if (profile?.role) setUserRole(profile.role);
          }
        } else {
          setUserRole(null);
        }
        // Abonnement aux changements d'auth
        const { data: sub } = supabase.auth.onAuthStateChange(async () => {
          const { data: s2 } = await supabase.auth.getSession();
          const logged = !!s2?.session;
          setIsLoggedIn(logged);
          if (logged) {
            const { data: u2 } = await supabase.auth.getUser();
            const uid2 = u2?.user?.id;
            if (uid2) {
              const { data: p2 } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', uid2)
                .single();
              setUserRole(p2?.role ?? null);
            }
          } else {
            setUserRole(null);
          }
        });
        return () => {
          try { sub?.subscription?.unsubscribe(); } catch (_) {}
        };
      } catch (_) {
        // silencieux
      }
    };
    init();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Image 
            src="/images/logo.png" 
            alt="Vintage Académie" 
            width={40} 
            height={40}
            style={{ width: 'auto', height: 'auto' }} // Maintenir le ratio d'aspect 
          />
          <span className="hidden sm:inline-block font-bold text-lg">Vintage Académie</span>
        </Link>
        
        <div className="flex-1 hidden md:block">
          <MainNavigation />
        </div>
        
        <div className="flex items-center space-x-4">
          {!isLoggedIn ? (
            <div className="hidden sm:flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">Se connecter</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm">S'inscrire</Button>
              </Link>
            </div>
          ) : (
            <Link href={userRole === 'admin' ? "/admin-dashboard" : "/dashboard"} prefetch={false} className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          )}
          
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
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="container px-4 py-4 space-y-4">
            <nav className="space-y-3">
              <Link 
                href="/" 
                className={`block px-2 py-1 rounded-md ${pathname === "/" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Accueil
              </Link>
              <div className="space-y-2 pl-2 border-l border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Services</p>
                <Link 
                  href="/services/tcf" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/tcf" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  TCF
                </Link>
                <Link 
                  href="/services/tef" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/tef" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  TEF
                </Link>
                <Link 
                  href="/services/ice-certification" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/ice-certification" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ICE Certification
                </Link>
                <Link 
                  href="/services/marketing-digital" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/marketing-digital" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Marketing Digital
                </Link>
                <Link 
                  href="/services/immigration-canada" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/immigration-canada" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Immigration Canada
                </Link>
                <Link 
                  href="/services/immigration-allemagne" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/immigration-allemagne" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Immigration Allemagne
                </Link>
                <Link 
                  href="/services/developpement-web" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/developpement-web" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Développement Web
                </Link>
              </div>
              <Link 
                href="/about" 
                className={`block px-2 py-1 rounded-md ${pathname === "/about" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                À propos
              </Link>
              <Link 
                href="/contact" 
                className={`block px-2 py-1 rounded-md ${pathname === "/contact" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            
            {!isLoggedIn ? (
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/login" 
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">Se connecter</Button>
                </Link>
                <Link 
                  href="/register" 
                  className="w-full" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full">S'inscrire</Button>
                </Link>
              </div>
            ) : (
              <Link 
                href={userRole === 'admin' ? "/admin-dashboard" : "/dashboard"}
                prefetch={false}
                className="w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="bg-orange-500 hover:bg-orange-600 w-full">Mon tableau de bord</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
