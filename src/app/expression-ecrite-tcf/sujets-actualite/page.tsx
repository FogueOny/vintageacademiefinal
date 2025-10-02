"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { useState, useEffect } from "react";
import { getAllPeriods, getCombinationsByPeriod, getTasksByCombination } from "@/lib/supabase/expression-ecrite-utils";
import { ExpressionEcritePeriod } from "@/types/expression-ecrite";

// Type pour les données formatées pour l'affichage
type PeriodeFormatted = {
  id: string;
  month: string;
  year: number;
  slug: string;
  sujetsCount: number;
  correctionsCount: number;
  isRecent: boolean;
  topics: { task: number; title: string; difficulty: string }[];
};

export default function SujetsActualitePage() {
  const [loading, setLoading] = useState(true);
  const [sujetsParPeriode, setSujetsParPeriode] = useState<PeriodeFormatted[]>([]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  useEffect(() => {
    async function loadPeriodes() {
      try {
        setLoading(true);
        const { data: periods, error } = await getAllPeriods();
        
        if (error || !periods) {
          console.error("Erreur lors du chargement des périodes:", error);
          setLoading(false);
          return;
        }

        // Déterminer si une période est récente (dans les 3 derniers mois)
        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
        
        // Format des périodes pour l'affichage
        const formattedPeriods: PeriodeFormatted[] = await Promise.all(periods.map(async (period) => {
          // Récupérer les combinaisons pour cette période
          const { data: combinations } = await getCombinationsByPeriod(period.id);
          const combinationsCount = combinations?.length || 0;
          
          // Exemple de sujets pour affichage (limité à 3)
          // Note: dans une version plus complète, on récupérerait les vraies tâches
          const sampleTopics = [
            { task: 1, title: `Tâche 1 - ${period.month}`, difficulty: "Facile" },
            { task: 2, title: `Tâche 2 - ${period.month}`, difficulty: "Moyen" },
            { task: 3, title: `Tâche 3 - ${period.month}`, difficulty: "Difficile" }
          ];

          // Déterminer si la période est récente
          const periodDate = new Date(period.year, getMonthIndex(period.month), 1);
          const isRecent = periodDate >= threeMonthsAgo;
          
          // Calculer le nombre réel de corrections depuis la base de données
          // Pour l'instant, on utilise 0 jusqu'à ce que les corrections soient implémentées
          const realCorrectionsCount = 0; // À remplacer par une vraie requête vers expression_ecrite_corrections
          
          return {
            id: period.id,
            month: capitalizeFirstLetter(period.month),
            year: period.year,
            slug: period.slug,
            sujetsCount: combinationsCount * 3, // 3 tâches par combinaison
            correctionsCount: realCorrectionsCount, // Nombre réel de corrections
            isRecent,
            topics: sampleTopics
          };
        }));

        // Trier par année puis par mois (plus récents en premier)
        const sortedPeriods = formattedPeriods.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return getMonthIndex(b.month) - getMonthIndex(a.month);
        });

        setSujetsParPeriode(sortedPeriods);
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    }

    loadPeriodes();
  }, []);

  // Fonctions utilitaires
  function getMonthIndex(month: string): number {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return months.indexOf(month.toLowerCase());
  }

  function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Plus de filtres: on affiche directement toutes les périodes
  const filteredSujets = sujetsParPeriode;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Facile": return "green";
      case "Moyen": return "yellow"; 
      case "Difficile": return "red";
      default: return "gray";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {/* Breadcrumb et Header */}
        <section className="w-full py-8 bg-white border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/expression-ecrite-tcf" className="hover:text-orange-600">
                Expression Écrite TCF
              </Link>
              <span>/</span>
              <span className="text-gray-900">Sujets d'Actualité</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Link href="/expression-ecrite-tcf">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Sujets d'Actualité - Expression Écrite
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Entraînez-vous avec les sujets récents qui tombent fréquemment au TCF Canada. 
                Organisés par mois avec corrections détaillées.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Liste des sujets */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              {/* Liste des périodes */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des périodes...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {filteredSujets.map((periode, index) => (
                    <motion.div 
                      key={periode.id}
                      initial="hidden"
                      animate="visible"
                      variants={fadeIn}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              {periode.month} {periode.year}
                            </CardTitle>
                            {periode.isRecent && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Récent
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {periode.sujetsCount} sujets • {periode.correctionsCount} corrections
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-700">Exemples de sujets :</h4>
                            {periode.topics.map((topic, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex-1 overflow-hidden">
                                  <span className="text-gray-600 truncate block">{topic.title}</span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`ml-2 text-xs border-${getDifficultyColor(topic.difficulty)}-300 text-${getDifficultyColor(topic.difficulty)}-700`}
                                >
                                  {topic.difficulty}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <Link href={`/expression-ecrite-tcf/sujets-actualite/${periode.slug}`}>
                            <Button className="w-full">
                              Voir les sujets
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loading && filteredSujets.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun sujet disponible pour le moment
                  </h3>
                  <p className="text-gray-600">
                    Revenez plus tard. De nouvelles périodes seront ajoutées prochainement.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 bg-orange-600">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="text-center text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Besoin d'aide pour vous entraîner ?
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
                Nos formations personnalisées vous accompagnent dans votre préparation avec des corrections détaillées.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  asChild
                >
                  <Link href="/expression-ecrite-tcf/formations">
                    Découvrir nos formations
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-orange-600"
                  asChild
                >
                  <Link href="/expression-ecrite-tcf/methodologie">
                    Revoir la méthodologie
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}