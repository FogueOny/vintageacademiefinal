"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, ChevronRight, Clock } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { useState, useEffect } from "react";
import { getPeriodBySlugWithContent } from "@/lib/supabase/expression-ecrite-utils";
import { ExpressionEcriteCombination, ExpressionEcritePeriod, ExpressionEcriteTask } from "@/types/expression-ecrite";

type TaskWithType = ExpressionEcriteTask & {
  taskType: string;
  difficulty: string;
};

type CombinationWithTasks = {
  id: string;
  title: string; // Le titre ne peut pas être undefined dans notre interface
  combinationNumber: number;
  tasks: TaskWithType[];
};

export default function PeriodDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ExpressionEcritePeriod | null>(null);
  const [combinations, setCombinations] = useState<CombinationWithTasks[]>([]);
  const [error, setError] = useState("");

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Fonctions utilitaires
  const getTaskTypeLabel = (taskNumber: number): string => {
    switch (taskNumber) {
      case 1: return "Courriel";
      case 2: return "Blog/Forum";
      case 3: return "Argumentation";
      default: return "Tâche";
    }
  };

  const getDifficultyLabel = (taskNumber: number): string => {
    switch (taskNumber) {
      case 1: return "Facile";
      case 2: return "Moyen";
      case 3: return "Difficile";
      default: return "Niveau non défini";
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "Facile": return "green";
      case "Moyen": return "yellow";
      case "Difficile": return "red";
      default: return "gray";
    }
  };

  const getFormattedTitle = (month?: string, year?: number): string => {
    if (!month || typeof month !== "string") {
      return typeof year === "number" && year > 0 ? `${year}` : "Période";
    }
    const m = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return typeof year === "number" && year > 0 ? `${m} ${year}` : m;
  };

  useEffect(() => {
    async function loadPeriodDetails() {
      try {
        setLoading(true);
        
        // Récupérer la période avec combinaisons et tâches en un appel
        const { data, error } = await getPeriodBySlugWithContent(slug);

        if (error || !data) {
          console.error("Erreur lors du chargement de la période:", error);
          setError("Période introuvable. Veuillez vérifier l'URL ou contacter notre équipe.");
          setLoading(false);
          return;
        }

        setPeriod({
          id: data.id,
          month: data.month,
          year: data.year,
          slug: data.slug,
          title: (data as any).title ?? null,
          description: (data as any).description ?? null,
          is_active: (data as any).is_active ?? true,
          total_combinations: (data as any).total_combinations ?? data.combinations?.length ?? 0,
          created_at: (data as any).created_at,
          updated_at: (data as any).updated_at,
        });

        const mapped = (data.combinations || []).map((combination) => ({
          id: combination.id,
          title: combination.title || `Combinaison ${combination.combination_number}`,
          combinationNumber: combination.combination_number,
          tasks: (combination.tasks || []).map((task) => ({
            ...task,
            taskType: getTaskTypeLabel(task.task_number),
            difficulty: getDifficultyLabel(task.task_number),
          })) as TaskWithType[],
        }));

        setCombinations(mapped);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Une erreur est survenue lors du chargement des données. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    }

    if (slug) {
      loadPeriodDetails();
    }
  }, [slug]);

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
              <Link href="/expression-ecrite-tcf/sujets-actualite" className="hover:text-orange-600">
                Sujets d'Actualité
              </Link>
              <span>/</span>
              <span className="text-gray-900">
                {period ? getFormattedTitle(period.month, period.year) : "Chargement..."}
              </span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Link href="/expression-ecrite-tcf/sujets-actualite">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux sujets
                </Button>
              </Link>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              {loading ? (
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Chargement des sujets...
                </h1>
              ) : error ? (
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Erreur
                </h1>
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Sujets de {getFormattedTitle(period?.month, period?.year)}
                </h1>
              )}
              <p className="text-xl text-gray-600 max-w-3xl">
                {loading ? (
                  "Récupération des détails des sujets d'expression écrite..."
                ) : error ? (
                  error
                ) : (
                  `${combinations.length} combinaisons de sujets disponibles pour cette période. Chaque combinaison contient 3 tâches de niveaux différents.`
                )}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contenu principal */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des sujets...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Erreur de chargement
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error}
                  </p>
                  <Button 
                    variant="outline"
                    asChild
                  >
                    <Link href="/expression-ecrite-tcf/sujets-actualite">
                      Retour aux sujets
                    </Link>
                  </Button>
                </div>
              ) : combinations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun sujet disponible
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Cette période ne contient pas encore de sujets d'expression écrite.
                  </p>
                  <Button 
                    variant="outline"
                    asChild
                  >
                    <Link href="/expression-ecrite-tcf/sujets-actualite">
                      Retour aux sujets
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-12">
                  {combinations.map((combination, index) => (
                    <div key={combination.id} className="border rounded-lg p-6 bg-white shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Combinaison {combination.combinationNumber} - {combination.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {combination.tasks.map((task) => (
                          <Card key={task.id}>
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                  Tâche {task.task_number}
                                </CardTitle>
                                <Badge variant="secondary" className={`bg-${getDifficultyColor(task.difficulty)}-100 text-${getDifficultyColor(task.difficulty)}-700`}>
                                  {task.difficulty}
                                </Badge>
                              </div>
                              <CardDescription>
                                {task.taskType} • {task.word_count_min}-{task.word_count_max} mots
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-sm text-gray-700 mb-2">Titre du sujet :</h4>
                                  <p className="text-gray-800">{task.title}</p>
                                </div>
                                
                                <Link href={`/expression-ecrite-tcf/taches/${task.id}`} legacyBehavior>
                                  <a
                                    aria-label={`Voir le sujet complet pour la tâche ${task.task_number}`}
                                    className="block w-full no-underline select-none rounded-full py-4 px-5 text-center font-medium text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md hover:shadow-lg transition-all duration-200 group"
                                  >
                                    <span className="inline-flex items-center justify-center gap-2">
                                      Voir le sujet complet
                                      <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </span>
                                  </a>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
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