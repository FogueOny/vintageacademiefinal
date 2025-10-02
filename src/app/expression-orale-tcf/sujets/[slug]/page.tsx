import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, Calendar, MessageSquare, Tag } from "lucide-react";

import { WhatsappButton } from '@/components/whatsapp-button';
import { Database } from '@/types/supabase';
import { ExpressionOralePeriod, ExpressionOraleTask, ExpressionOraleSubject } from '@/types/expression-orale';
import { MONTHS } from '@/types/expression-orale';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: period } = await supabase
      .from('expression_orale_periods')
      .select('month, year')
      .eq('slug', slug)
      .single();
    
    if (period) {
      return {
        title: `Sujets d'Expression Orale TCF - ${MONTHS[period.month - 1]} ${period.year} | Vintage Académie`,
        description: `Pratiquez les sujets d'expression orale du TCF Canada pour la période de ${MONTHS[period.month - 1]} ${period.year}`,
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
  }
  
  return {
    title: 'Sujets d\'Expression Orale TCF | Vintage Académie',
    description: 'Pratiquez les sujets d\'expression orale du TCF Canada',
  };
}

async function getPeriodWithSubjects(slug: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Récupérer la période
  const { data: period, error: periodError } = await supabase
    .from('expression_orale_periods')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (periodError || !period) {
    console.error('Erreur lors du chargement de la période:', periodError);
    return null;
  }
  
  // Récupérer les tâches associées
  const { data: tasks, error: tasksError } = await supabase
    .from('expression_orale_tasks')
    .select('*')
    .eq('period_id', period.id)
    .order('task_number', { ascending: true });
  
  if (tasksError) {
    console.error('Erreur lors du chargement des tâches:', tasksError);
    return { ...period, tasks: [] };
  }
  
  // Pour chaque tâche, récupérer les sujets associés
  const tasksWithSubjects = await Promise.all(tasks.map(async (task) => {
    const { data: subjects, error: subjectsError } = await supabase
      .from('expression_orale_subjects')
      .select('*')
      .eq('task_id', task.id)
      .eq('is_active', true)
      .order('subject_number', { ascending: true });
    
    if (subjectsError) {
      console.error(`Erreur lors du chargement des sujets pour la tâche ${task.id}:`, subjectsError);
      return { ...task, subjects: [] };
    }
    
    return { ...task, subjects: subjects || [] };
  }));
  
  return { ...period, tasks: tasksWithSubjects };
}

export default async function PeriodDetailPage({ params }: Props) {
  const { slug } = await params;
  const periodData = await getPeriodWithSubjects(slug);
  
  if (!periodData) {
    notFound();
  }
  
  // Déterminer quelle tâche a des sujets pour définir l'onglet actif par défaut
  const defaultTab = periodData.tasks.find((task: { subjects?: any[]; task_number: number }) => task.subjects && task.subjects.length > 0)?.task_number.toString() || '2';
  
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/expression-orale-tcf">Expression Orale TCF</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/expression-orale-tcf/sujets">Sujets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            {/* Utiliser BreadcrumbPage au lieu de BreadcrumbLink pour le dernier élément */}
            <span className="font-medium">
              {MONTHS[periodData.month - 1]} {periodData.year}
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-2">
          <Calendar className="h-6 w-6 mr-2 text-orange-500" />
          <h1 className="text-3xl font-bold">
            Sujets {MONTHS[periodData.month - 1]} {periodData.year}
          </h1>
        </div>
        
        <p className="text-lg text-gray-600 mb-8">
          {periodData.description || `Sujets d'expression orale du TCF Canada pour la période de ${MONTHS[periodData.month - 1]} ${periodData.year}`}
        </p>
        
        <div className="mb-10">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-6">
              {periodData.tasks.map((task: any) => {
                const hasSubjects = task.subjects && task.subjects.length > 0;
                return (
                  <TabsTrigger 
                    key={task.id} 
                    value={task.task_number.toString()}
                    disabled={!hasSubjects}
                    className={!hasSubjects ? 'opacity-50' : ''}
                  >
                    Tâche {task.task_number}
                    {hasSubjects && (
                      <Badge className="ml-2 bg-orange-100 text-orange-800 hover:bg-orange-100">
                        {task.subjects.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {periodData.tasks.map((task: any) => (
              <TabsContent key={task.id} value={task.task_number.toString()} className="space-y-6">
                <Card className="mb-6">
                  <CardHeader className="pb-4">
                    <CardTitle>Instructions pour la Tâche {task.task_number}</CardTitle>
                    <CardDescription className="text-base">
                      {task.instructions || getDefaultInstructions(task.task_number)}
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                {task.subjects && task.subjects.length > 0 ? (
                  <div className="grid gap-6">
                    {task.subjects.map((subject: ExpressionOraleSubject) => (
                      <Card key={subject.id} className="overflow-hidden">
                        <CardHeader className="pb-3 bg-orange-50">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-xl">
                              Sujet {subject.subject_number}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                          <div className="prose max-w-none mb-4">
                            <div dangerouslySetInnerHTML={{ __html: formatContent(subject.content) }} />
                          </div>
                          
                          {subject.question && (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <h4 className="text-sm font-medium mb-1 text-gray-600">Question :</h4>
                              <p className="italic text-gray-800 pl-2 border-l-2 border-orange-300">
                                « {subject.question} »
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">
                      Aucun sujet disponible pour cette tâche.
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <div className="mt-10 flex justify-center">
          <WhatsappButton />
        </div>
        
        <div className="mt-6 text-center">
          <Link 
            href="/expression-orale-tcf/sujets" 
            className="text-orange-600 hover:text-orange-800 underline text-sm"
          >
            ← Retour à toutes les périodes
          </Link>
        </div>
      </div>
    </div>
  );
}

// Fonction pour formater le contenu avec retours à la ligne, etc.
function formatContent(content: string): string {
  if (!content) return '';
  
  // Convertir les retours à la ligne en balises <br>
  let formatted = content.replace(/\n/g, '<br>');
  
  // Mettre en gras les questions éventuelles
  formatted = formatted.replace(/\?([^?]+)\?/g, '<strong>$1</strong>');
  
  return formatted;
}

// Instructions par défaut en fonction du type de tâche
function getDefaultInstructions(taskNumber: number): string {
  if (taskNumber === 2) {
    return "Vous allez entendre deux fois un enregistrement sonore. Vous aurez ensuite 2 minutes de préparation avant de donner votre opinion sur le sujet pendant 2 à 3 minutes.";
  } else if (taskNumber === 3) {
    return "Vous allez débattre sur un sujet. Vous disposerez de 2 minutes de préparation avant de défendre votre point de vue pendant environ 3 minutes.";
  }
  return "";
}