"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Award, BookOpen, Clock, ArrowRight, Flag } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Module = {
  id: string;
  name: string;
  description: string;
  slug: string;
  type_module: string;
  created_at: string;
  price?: number;
  duration?: string;
  features?: string | string[];
  icon?: string;
  is_free?: boolean;
}

export default function TCFPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  useEffect(() => {
    // Check Supabase client status only on client side
    const supabaseCheck = supabase() ? "Supabase client OK" : "Supabase client NOT INITIALIZED";
    console.log("Statut du client Supabase:", supabaseCheck);

    const fetchModules = async () => {
      try {
        console.log("Début de la récupération des modules TCF...");
        const supabaseClient = supabase();
        const { data, error } = await supabaseClient
          .from('modules')
          .select('*')
          .eq('type_module', 'tcf');
        
        console.log("Résultat de la requête Supabase:", { data, error });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Modules TCF récupérés avec succès:", data);
          setModules(data);
        } else {
          console.log("Aucun module TCF trouvé dans la base de données");
          setModules([]);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des modules:", err);
        setError("Impossible de charger les modules. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Client-side guard: redirect authenticated users away from this public page
  useEffect(() => {
    const hardRedirect = (target: string) => {
      try {
        console.log('[TCF Guard] Navigating to', target, 'via router.replace');
        router.replace(target);
        setTimeout(() => {
          if (window.location.pathname !== target) {
            console.log('[TCF Guard] router.replace ignored, forcing location.replace to', target);
            window.location.replace(target);
          }
        }, 0);
      } catch (e) {
        console.log('[TCF Guard] router.replace threw, forcing location.replace', e);
        window.location.replace(target);
      }
    };

    const resolveTargetIfLogged = async () => {
      try {
        const supabaseClient = supabase();
        if (!supabaseClient) return null;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return null;
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user?.id) return '/dashboard';
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        const role = profileData?.role || 'user';
        const target = role === 'admin' ? '/admin-dashboard' : '/dashboard';
        return target;
      } catch (e) {
        return '/dashboard';
      }
    };

    const redirectIfLogged = async () => {
      let cachedRole: string | null = null;
      try { cachedRole = window.localStorage.getItem('va_role'); } catch (_) {}
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const isBack = (nav?.type === 'back_forward');
      const hasAdminCache = cachedRole === 'admin';

      if (isBack && !hasAdminCache) {
        try {
          const last = window.sessionStorage.getItem('va_last_protected');
          if (last && last.startsWith('/')) {
            console.log('[TCF Guard] back_forward: redirecting to last protected path', last);
            hardRedirect(last);
            return;
          }
        } catch (_) {}
        console.log('[TCF Guard] back_forward detected with cachedRole=', cachedRole, '— resolving target before redirect');
        const target = await resolveTargetIfLogged();
        const finalTarget = target || '/dashboard';
        hardRedirect(finalTarget);
        return;
      }

      // Immediate redirect based on cached role, then refine
      const initialTarget = hasAdminCache ? '/admin-dashboard' : '/dashboard';
      console.log('[TCF Guard] Immediate redirect to', initialTarget, 'based on cached role =', cachedRole);
      const target = await resolveTargetIfLogged();
      if (target && target !== initialTarget) {
        hardRedirect(target);
      } else {
        hardRedirect(initialTarget);
      }
    };

    // initial attempt on mount
    redirectIfLogged();

    const onPageShow = (evt: PageTransitionEvent) => {
      const persisted = (evt as any)?.persisted;
      console.log('[TCF Guard] pageshow event. persisted=', persisted);
      if (persisted) {
        redirectIfLogged();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const isBack = (nav?.type === 'back_forward');
        console.log('[TCF Guard] visibilitychange visible. back_forward=', isBack);
        if (isBack) redirectIfLogged();
      }
    };

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router]);

  // Helper function pour obtenir une icône appropriée selon le slug du module
  const getModuleIcon = (slug: string) => {
    if (slug.includes('canada')) {
      return <Image src="/images/canada-flag.png" alt="Canada" width={40} height={24} className="object-cover rounded-sm" />;
    } else if (slug.includes('quebec')) {
      return <Image src="/images/quebec-flag.png" alt="Québec" width={40} height={24} className="object-cover rounded-sm" />;
    } else if (slug.includes('irn') || slug.includes('france')) {
      return <Image src="/images/france-flag.png" alt="France" width={40} height={24} className="object-cover rounded-sm" />;
    } else {
      return <Flag className="h-10 w-10 text-orange-500" />;
    }
  };

  // Fonction pour déterminer l'URL de redirection selon le type de module
  const getModuleRedirectUrl = (module: Module) => {
    const slug = module.slug.toLowerCase();
    
    if (slug.includes('comprehension-orale') || slug.includes('comprehension-oral')) {
      return '/comprehension-orale';
    } else if (slug.includes('comprehension-ecrite') || slug.includes('comprhension-crite')) {
      return '/comprehension-ecrite';
    } else if (slug.includes('expression-ecrite')) {
      return '/expression-ecrite';
    } else if (slug.includes('expression-orale')) {
      return '/expression-orale';
    }
    
    // Fallback vers la page générique des tests 
    return '/tests';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {/* En-tête bref */}
        <section className="w-full py-12 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium text-sm mb-4">
                Test de Connaissance du Français
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                Test TCF - Modules Disponibles
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                Choisissez le module TCF qui correspond à votre projet d'immigration ou d'études.
              </p>
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1"}
              >
                Contactez-nous pour vous inscrire
              </Button>
            </div>
          </div>
        </section>

        {/* Cartes dédiées Expression Écrite / Orale */}
        <section className="w-full py-8 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-t-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Expression Écrite TCF</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Méthodologie, sujets d’actualité, corrections et accompagnement
                    pour réussir l’épreuve écrite du TCF.
                  </p>
                  <Link href="/expression-ecrite-tcf">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Découvrir
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Expression Orale TCF</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Méthodologie, sujets, et corrections pour s’entraîner à l’oral
                    selon les 3 tâches officielles du TCF Canada.
                  </p>
                  <Link href="/expression-orale-tcf">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Découvrir
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section des modules TCF */}
        <section className="w-full py-10 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                >
                  Réessayer
                </Button>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">Aucun module TCF n'est disponible actuellement.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {modules.map((module, index) => {
                  // Les features sont stockées sous forme de string dans la base de données,
                  // ou peuvent ne pas exister du tout les modules on bien apparue, l 
                  let features = ["Compréhension orale", "Compréhension écrite", "Expression orale", "Expression écrite"];
                  
                  if (module.features) {
                    if (typeof module.features === 'string') {
                      try {
                        features = JSON.parse(module.features);
                      } catch (e) {
                        console.warn("Impossible de parser les features:", e);
                      }
                    } else if (Array.isArray(module.features)) {
                      features = module.features;
                    }
                  }
                    
                  return (
                    <motion.div 
                      key={module.id} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 border-t-4 border-orange-500">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="rounded-full p-2 bg-orange-50 flex items-center justify-center">
                              {getModuleIcon(module.slug)}
                            </div>
                            <h3 className="text-xl font-bold">{module.name}</h3>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{module.description}</p>
                          
                          <div className="mb-4"></div>
                          
                          <Button 
                            onClick={() => {
                              // Utiliser window.location pour assurer que l'URL est relative au domaine actuel
                              window.location.href = getModuleRedirectUrl(module);
                            }} 
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                          >
                            Lancer le test
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        
        {/* Section d'informations complémentaires */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Informations importantes</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Dates des sessions</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Nous organisons des sessions de test TCF chaque mois. Contactez-nous pour connaître les prochaines dates disponibles.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Validité des résultats</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Les résultats du TCF sont valables 2 ans à compter de la date de passage du test.</p>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Préparation recommandée</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Pour maximiser vos chances de réussite, nous vous recommandons vivement de suivre nos modules de préparation. Contactez-nous pour plus d'informations sur nos formules de coaching personnalisé.</p>
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                        onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite des informations sur les modules de préparation au TCF"}
                      >
                        En savoir plus sur nos préparations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section CTA simplifiée */}
        <section className="w-full py-12 bg-orange-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold mb-4">Besoin d'aide pour votre TCF ?</h2>
              <p className="text-gray-600 max-w-lg mb-6">
                Contactez notre équipe pour vous inscrire à une session ou pour recevoir des conseils personnalisés
              </p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1"} 
                  className="bg-orange-500 hover:bg-orange-600" 
                >
                  Nous contacter sur WhatsApp <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link href="/contact">
                  <Button variant="outline">
                    Formulaire de contact
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer professionnel */}
      <ProfessionalFooter />
      
      {/* Bouton WhatsApp flottant */}
      <FloatingWhatsAppButton />
    </div>
  );
}
