"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { checkAdminStatus, emergencyProfileRecovery } from "@/lib/supabase/user-utils";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Settings, Users, Database, FileText, BarChart3, LogOut, AlertTriangle } from "lucide-react";

export default function AdminClientPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminPermissions() {
      console.log("🔍 Début de la vérification des permissions admin...");
      
      // Diagnostic des cookies et localStorage
      console.log("🔍 Diagnostic du stockage local...");
      console.log("📊 localStorage keys:", Object.keys(localStorage));
      console.log("📊 Cookies:", document.cookie);
      
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          console.error("❌ Supabase client not available");
          router.push("/login");
          return;
        }

        console.log("✅ Client Supabase disponible");

        // Vérifier la session utilisateur
        console.log("🔍 Vérification de la session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("📊 Résultat getSession:", { 
          session: !!session, 
          error: sessionError,
          sessionDetails: session ? {
            user: session.user.email,
            expiresAt: session.expires_at,
            accessToken: !!session.access_token
          } : null
        });
        
        if (sessionError) {
          console.error("❌ Erreur session:", sessionError);
          router.push("/login");
          return;
        }
        
        if (!session) {
          console.error("❌ Pas de session utilisateur");
          console.log("🔄 Tentative de rafraîchissement de session...");
          
          // Essayer de rafraîchir la session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("❌ Erreur rafraîchissement:", refreshError);
            console.log("🔄 Redirection vers login...");
            router.push("/login");
            return;
          }
          
          if (!refreshData.session) {
            console.error("❌ Pas de session après rafraîchissement");
            console.log("🔄 Redirection vers login...");
            router.push("/login");
            return;
          }
          
          console.log("✅ Session rafraîchie avec succès");
          setUser(refreshData.session.user);
        } else {
          console.log("✅ Session utilisateur trouvée:", session.user.email);
          console.log("👤 Détails utilisateur:", { id: session.user.id, email: session.user.email });
          setUser(session.user);
        }

        // Utiliser la nouvelle fonction de vérification admin
        console.log("🔍 Vérification du statut admin...");
        const { isAdmin: adminStatus, profile, error: adminError } = await checkAdminStatus();

        if (adminError) {
          console.error("❌ Erreur lors de la vérification admin:", adminError);
          
          // Tentative de récupération si pas encore essayée
          if (!recoveryAttempted) {
            console.log("🔄 Tentative de récupération du profil...");
            setRecoveryAttempted(true);
            
            const recoveryResult = await emergencyProfileRecovery();
            if (recoveryResult.success) {
              console.log("✅ Récupération réussie, nouvelle tentative...");
              // Relancer la vérification
              setTimeout(() => {
                checkAdminPermissions();
              }, 1000);
              return;
            } else {
              console.error("❌ Récupération échouée:", recoveryResult.error);
              setError("Impossible de récupérer le profil utilisateur");
              setLoading(false);
              return;
            }
          } else {
            setError("Problème avec le profil utilisateur");
            setLoading(false);
            return;
          }
        }

        if (adminStatus && profile) {
          console.log("✅ Utilisateur admin confirmé");
          setIsAdmin(true);
          // Get current session for user data
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setUser({ ...currentSession.user, ...profile });
          } else {
            setUser({ ...profile });
          }
        } else {
          console.log("❌ Utilisateur non admin, redirection vers dashboard");
          router.push("/dashboard");
          return;
        }

      } catch (error) {
        console.error("❌ Erreur lors de la vérification des permissions:", error);
        setError("Erreur lors de la vérification des permissions");
      } finally {
        console.log("🏁 Fin de la vérification des permissions");
        setLoading(false);
      }
    }

    checkAdminPermissions();
  }, [router, recoveryAttempted]);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowser();
      if (supabase) {
        await supabase.auth.signOut();
        router.push("/login");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleRetry = () => {
    setError(null);
    setRecoveryAttempted(false);
    setLoading(true);
    // Relancer la vérification
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Vérification des permissions...</h2>
              <p className="text-gray-600">Vérification de votre accès administrateur</p>
              
              {/* Debug info */}
              <div className="mt-4 p-3 bg-gray-50 rounded text-left text-xs">
                <p><strong>Debug:</strong></p>
                <p>• Loading: {loading ? 'Oui' : 'Non'}</p>
                <p>• Is Admin: {isAdmin ? 'Oui' : 'Non'}</p>
                <p>• User: {user ? user.email : 'Aucun'}</p>
                <p>• Recovery Attempted: {recoveryAttempted ? 'Oui' : 'Non'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Erreur de permissions</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Réessayer
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
                  Aller au dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // La redirection est gérée dans useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Admin */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-orange-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
                  <p className="text-sm text-gray-600">
                    {user?.email} • {user?.role || 'Admin'} • Gestion du contenu
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGoToDashboard}
                className="text-gray-600 hover:text-gray-900"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir le site
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-6 py-8">
        <AdminDashboard />
      </div>
    </div>
  );
}
