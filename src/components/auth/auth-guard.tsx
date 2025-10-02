"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        
        // TEMPORAIRE : Permettre l'accès sans authentification pour les tests
        console.log("Session trouvée:", !!session);
        
        if (!session) {
          console.log("Aucune session - accès temporairement autorisé");
          // router.push("/login"); // Désactivé temporairement
          // return;
        }
        
        setAuthenticated(true);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        // router.push("/login"); // Désactivé temporairement
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Le router s'occupera de la redirection
  }

  return <>{children}</>;
}
