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

// Assurez-vous que le client Supabase est correctement initialisé
const supabaseCheck = "Supabase client OK";
console.log("Statut du client Supabase:", supabaseCheck);

export default function TEFPage() {
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
    const fetchModules = async () => {
      try {
        console.log("Début de la récupération des modules TEF...");
        
        const { data, error } = await supabase()
          .from('modules')
          .select('*')
          .eq('type_module', 'tef');
        
        console.log("Résultat de la requête Supabase:", { data, error });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Modules TEF récupérés avec succès:", data);
          setModules(data);
        } else {
          console.log("Aucun module TEF trouvé dans la base de données");
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-orange-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-4"
              >
                <motion.h1 
                  variants={fadeIn}
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                >
                  Test d'Évaluation de Français (TEF)
                </motion.h1>
                <motion.p 
                  variants={fadeIn}
                  className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                >
                  Préparez-vous au TEF avec notre programme complet, conçu par des experts pour maximiser vos chances de réussite.
                </motion.p>
                <motion.div
                  variants={fadeIn}
                  className="flex flex-col sm:flex-row gap-4 mt-2"
                >
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600" 
                    size="lg"
                  >
                    <Link href="/contact">Nous contacter</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                  >
                    <Link href="/services">Découvrir nos autres services</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto aspect-video overflow-hidden rounded-xl"
            >
              <Image 
                src="/images/tef-certification.jpg" 
                alt="Test d'Évaluation de Français" 
                width={600} 
                height={400}
                className="object-cover w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Section des modules */}
      <section className="w-full py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter mb-2">Nos modules TEF</h2>
            <p className="text-gray-600 max-w-[800px]">
              Choisissez le module qui correspond à vos besoins spécifiques pour l'immigration ou les études.
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement des modules...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Réessayer
                </Button>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">Aucun module TEF n'est disponible actuellement.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {modules.map((module, index) => {
                  // Les features sont stockées sous forme de string dans la base de données,
                  // ou peuvent ne pas exister du tout
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
                            onClick={() => window.location.href = `/tests/${module.slug}`} 
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
                    <p className="text-gray-600 text-sm">Nous organisons des sessions de test TEF chaque mois. Contactez-nous pour connaître les prochaines dates disponibles.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Reconnaissance officielle</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Le TEF est reconnu par les autorités canadiennes et françaises pour les procédures d'immigration et d'études.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Préparation complète</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Nos programmes incluent des cours théoriques, des exercices pratiques et des simulations d'examen.</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Taux de réussite</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Plus de 90% de nos candidats obtiennent le score requis pour leurs démarches d'immigration ou d'études.</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8 text-center">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Link href="/contact">Demander plus d'informations</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      
      <ProfessionalFooter />
      <FloatingWhatsAppButton />
    </div>
  );
}
