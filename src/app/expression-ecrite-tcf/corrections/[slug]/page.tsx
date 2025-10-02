"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Target, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { getAllPeriods, getPeriodBySlug } from "@/lib/supabase/expression-ecrite-utils";
import { getCorrectionsByCombination } from "@/lib/supabase/expression-ecrite-corrections-utils";
import { ExpressionEcriteCorrection, ExpressionEcritePeriod } from "@/types/expression-ecrite";
import { generatePeriodSlug } from "@/lib/utils/slug-utils";

// Types locaux pour l'interface

interface Correction {
  id: string;
  title?: string;
  content: string;
  correction_type: string;
  corrector_name?: string;
  is_public: boolean;
  created_at: string;
}

interface Task {
  task_number: number;
  task_title: string;
  task_description: string;
  task_type: string;
  correction?: Correction;
}

interface Combination {
  combination_number: number;
  tasks: Task[];
};

export default function PeriodeCorrectionsPage() {
  // Récupérer le slug depuis les params côté client
  const params = useParams<{ slug: string }>();
  const slug = (params?.slug ?? "").toString();
  
  const [period, setPeriod] = useState<ExpressionEcritePeriod | null>(null);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Réinitialiser les erreurs précédentes
        
        // Utiliser le slug extrait plutôt que params.slug directement
        console.log(`Recherche de la période avec slug: ${slug}`);
        let foundPeriod: ExpressionEcritePeriod | null = null;
        
        // Récupérer les infos de la période par son slug
        const { data: periodData, error: periodError } = await getPeriodBySlug(slug);
        
        // Si on trouve directement la période par son slug, on l'utilise
        if (!periodError && periodData && periodData.length > 0) {
          console.log(`Période trouvée directement par slug:`, periodData[0]);
          foundPeriod = periodData[0] as ExpressionEcritePeriod;
        } 
        // Si on ne trouve pas la période directement, on essaie une approche plus souple
        else {
          console.log(`Période non trouvée directement, recherche alternative...`);
          
          // Récupérer toutes les périodes
          const { data: allPeriods, error: allPeriodsError } = await getAllPeriods();
          
          if (allPeriodsError || !allPeriods) {
            console.error(`Erreur lors de la récupération des périodes:`, allPeriodsError);
            setError("Erreur lors du chargement des périodes");
            setLoading(false);
            return;
          }
          
          // Essayer de parser le slug pour extraire le mois et l'année
          // Format attendu: "mois-annee" (ex: "janvier-2023")
          const slugParts = slug.split('-');
          let month, year;
          
          if (slugParts.length >= 2) {
            // Le mois pourrait être le premier élément ou une combinaison des premiers éléments sauf le dernier
            month = slugParts.slice(0, -1).join('-'); 
            year = parseInt(slugParts[slugParts.length - 1], 10);
            
            console.log(`Tentative de correspondance avec: mois="${month}", année=${year}`);
            
            // Chercher une période correspondant au mois et à l'année (ignore la casse et les accents)
            const normalizedSlug = slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            const matchingPeriod = allPeriods.find(p => {
              // Vérifier si le slug de la période correspond
              if (p.slug.toLowerCase() === slug.toLowerCase()) return true;
              
              // Vérifier si le mois et l'année correspondent
              const generatedSlug = generatePeriodSlug(p.month, p.year);
              return generatedSlug === normalizedSlug;
            });
            
            if (matchingPeriod) {
              console.log(`Période trouvée par correspondance alternative:`, matchingPeriod);
              foundPeriod = matchingPeriod;
            } else {
              console.error(`Aucune période correspondante trouvée`);
              setError("Période non trouvée");
              setLoading(false);
              return;
            }
          } else {
            console.error(`Format de slug invalide: ${slug}`);
            setError("Format de période invalide");
            setLoading(false);
            return;
          }
        }
        
        // À ce stade, foundPeriod contient la période trouvée (soit directement, soit par recherche alternative)
        if (!foundPeriod) {
          console.error("Période non trouvée après toutes les tentatives de recherche");
          setError("Période introuvable");
          setLoading(false);
          return;
        }
        
        // Mettre à jour l'état avec la période trouvée
        setPeriod(foundPeriod);
        
        console.log(`Traitement des corrections pour la période: ${foundPeriod.month} ${foundPeriod.year} (ID: ${foundPeriod.id})`);
        
        // Récupérer toutes les corrections pour cette période et les organiser par combinaison et tâche
        const combinationsMap = new Map<number, Combination>();
        
        const processCorrectionsByCombination = async (combinationNumber: number) => {
          const { data: corrections } = await getCorrectionsByCombination(foundPeriod!.id, combinationNumber, true);
          
          if (!corrections || corrections.length === 0) return;
          
          const tasks = new Map<number, Task>();
          
          // Regrouper les corrections par tâche (ne garder que la plus récente)
          corrections.forEach(correction => {
            const taskNumber = correction.task_number;
            
            // Si la tâche n'existe pas encore ou si cette correction est plus récente
            if (!tasks.has(taskNumber) || new Date(correction.created_at) > new Date(tasks.get(taskNumber)!.correction!.created_at)) {
              tasks.set(taskNumber, {
                task_number: taskNumber,
                task_title: correction.task_title || `Tâche ${taskNumber}`,
                task_description: correction.task_description || '',
                task_type: correction.task_type || 'standard',
                correction: {
                  id: correction.id,
                  title: correction.title,
                  content: correction.content ?? '',
                  correction_type: correction.correction_type,
                  corrector_name: correction.corrector_name,
                  is_public: correction.is_public,
                  created_at: correction.created_at
                }
              });
            }
          });
          
          // Créer l'objet combinaison avec la liste de ses tâches
          if (tasks.size > 0) {
            combinationsMap.set(combinationNumber, {
              combination_number: combinationNumber,
              tasks: Array.from(tasks.values())
            });
          }
        };
        
        // Récupérer les combinaisons 1 à 10 (on pourrait remplacer par une requête pour récupérer dynamiquement la liste)
        const combinationsPromises = [];
        for (let i = 1; i <= 10; i++) {
          combinationsPromises.push(processCorrectionsByCombination(i));
        }
        
        await Promise.all(combinationsPromises);
        
        // Trier les combinaisons par numéro
        const sortedCombinations = Array.from(combinationsMap.values())
          .sort((a, b) => a.combination_number - b.combination_number);
        
        setCombinations(sortedCombinations);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError("Une erreur est survenue lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug]);

  const getTaskTypeLabel = (type: string): string => {
    switch (type) {
      case 'email': return 'Courriel';
      case 'letter': return 'Lettre';
      case 'narrative': return 'Récit';
      case 'argumentative': return 'Argumentation';
      default: return type;
    }
  };

  const getDifficultyLabel = (level: string): string => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return level;
    }
  };

  const getCorrectionTypeLabel = (type: string): string => {
    switch (type) {
      case 'example': return 'Exemple type';
      case 'user_specific': return 'Correction personnalisée';
      case 'model_answer': return 'Réponse modèle';
      case 'official': return 'Correction officielle';
      case 'community': return 'Contribution communautaire';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="container max-w-5xl px-4 py-10">
        <div className="flex justify-center py-12">
          <div className="animate-pulse flex space-x-4 w-full">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-8 bg-slate-200 rounded w-1/4"></div>
              <div className="h-12 bg-slate-200 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-64 bg-slate-200 rounded"></div>
                <div className="h-64 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !period) {
    return (
      <div className="container max-w-5xl px-4 py-10">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Erreur</h2>
          <p className="text-slate-600 mb-6">{error || "Une erreur s'est produite"}</p>
          <Link href="/expression-ecrite-tcf/corrections">
            <Button>Retour à la liste des périodes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-5xl px-4 py-6 md:py-10">
        {/* Titre et navigation */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-6"
        >
          <Link 
            href="/expression-ecrite-tcf/corrections" 
            className="text-slate-600 hover:text-slate-900 flex items-center text-sm mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Retour aux corrections
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Corrections {period.month.charAt(0).toUpperCase() + period.month.slice(1)} {period.year}
          </h1>
          <p className="mt-2 text-slate-600 md:text-lg max-w-3xl">
            Exemples de corrections pour les tâches d'expression écrite de cette période.
          </p>
        </motion.div>

        {/* Liste des combinaisons avec leurs tâches */}
        {combinations.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-slate-800 mb-2">Aucune combinaison trouvée</h3>
            <p className="text-slate-600">Cette période ne contient pas encore de combinaisons</p>
          </div>
        ) : (
          <div className="space-y-10 mt-8">
            {combinations.map((combo) => (
              <motion.div
                key={`combo-${combo.combination_number}`}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="border rounded-lg p-6 bg-white shadow-sm"
              >
                <h2 className="text-2xl font-bold mb-6">Combinaison {combo.combination_number}</h2>
                
                {combo.tasks && combo.tasks.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {combo.tasks.map((task) => {
                      const hasCorrection = !!task.correction;
                      
                      return (
                        <AccordionItem 
                          key={`task-${combo.combination_number}-${task.task_number}`} 
                          value={`task-${combo.combination_number}-${task.task_number}`}
                          className="border rounded-md overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:bg-slate-50">
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <h3 className="font-medium text-lg text-left">
                                  Tâche {task.task_number}: {task.task_title}
                                </h3>
                                <div className="flex gap-3 mt-1">
                                  <Badge variant="outline">{getTaskTypeLabel(task.task_type)}</Badge>
                                </div>
                              </div>
                              
                              {hasCorrection ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                  Correction disponible
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500 text-amber-700">
                                  Pas de correction
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          
                          <AccordionContent className="px-0">
                            <div className="border-t">
                              <Tabs defaultValue="task" className="w-full">
                                <TabsList className="w-full grid grid-cols-2">
                                  <TabsTrigger value="task">Énoncé</TabsTrigger>
                                  <TabsTrigger 
                                    value="correction" 
                                    disabled={!hasCorrection}
                                  >
                                    Correction
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="task" className="p-4">
                                  <h4 className="font-medium mb-2">Description:</h4>
                                  <div className="text-slate-800 whitespace-pre-wrap">{task.task_description}</div>
                                </TabsContent>
                                
                                <TabsContent value="correction" className="p-4">
                                  {hasCorrection && task.correction ? (
                                     <div>
                                       <div className="flex justify-between items-center mb-4">
                                         <h4 className="font-medium">{task.correction.title || "Exemple de correction"}:</h4>
                                       </div>
                                       
                                       {task.correction.correction_type && (
                                         <div className="mb-2">
                                           <Badge variant="outline" className="text-xs">
                                             {getCorrectionTypeLabel(task.correction.correction_type)}
                                           </Badge>
                                           {task.correction.corrector_name && (
                                             <span className="text-xs text-slate-500 ml-2">
                                               par {task.correction.corrector_name}
                                             </span>
                                           )}
                                         </div>
                                       )}
                                       
                                       <div className="text-slate-800 whitespace-pre-wrap mb-6 border-l-4 border-emerald-500 pl-4 py-1">
                                         {task.correction.content}
                                       </div>
                                     </div>
                                  ) : (
                                    <p className="text-center text-slate-500 py-4">
                                      Aucune correction disponible pour cette tâche
                                    </p>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <p className="text-center text-slate-500 py-4">
                    Aucune tâche trouvée pour cette combinaison
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <ProfessionalFooter />
      <FloatingWhatsAppButton />
    </>
  );
}
