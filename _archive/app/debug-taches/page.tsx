import React from 'react';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Interface pour les tâches
interface ExpressionEcriteTask {
  id: string;
  title: string;
  description: string;
  instructions: string;
  word_count_min: number;
  word_count_max: number;
  task_number: number;
  task_type: string;
  combination_id: string;
  created_at?: string;
  updated_at?: string;
  difficulty_level?: string;
}

// Page simple pour déboguer l'accès aux tâches
export default async function DebugTasksPage() {
  // Logs pour suivre l'exécution
  console.log('Démarrage de la page de débogage des tâches');
  
  // Initialiser le client Supabase pour Server Component
  const supabase = createServerComponentClient<Database>({ cookies });
  console.log('Client Supabase initialisé pour Server Component');
  
  // Récupérer toutes les tâches directement (sans jointure)
  const { data: tasks, error } = await supabase
    .from('expression_ecrite_tasks')
    .select('*')
    .limit(50);
  
  // Logs des résultats
  if (error) {
    console.error('Erreur lors de la récupération des tâches:', error.message);
  } else {
    console.log(`${tasks?.length || 0} tâches récupérées`);
    tasks?.forEach((task: ExpressionEcriteTask, index: number) => {
      console.log(`Tâche ${index + 1}:`, { id: task.id, titre: task.title, type: task.task_number });
    });
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Débogage des tâches d'expression écrite</h1>
      
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <h2 className="font-semibold">Erreur lors de la récupération des tâches</h2>
          <p>{error.message}</p>
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task: ExpressionEcriteTask) => (
            <Card key={task.id} className="overflow-hidden">
              <CardHeader className="bg-orange-50">
                <CardTitle>
                  <span className="font-bold">Tâche {task.task_number}:</span> {task.title}
                </CardTitle>
                <div className="text-sm text-gray-500 mt-1">
                  ID: <code className="bg-gray-100 p-1 rounded">{task.id}</code>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Description:</span><br />
                    {task.description}
                  </p>
                  <p>
                    <span className="font-semibold">Instructions:</span><br />
                    {task.instructions}
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-semibold">Mots:</span> {task.word_count_min}-{task.word_count_max}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-semibold">Combinaison ID:</span> {task.combination_id}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
          <h2 className="font-semibold">Aucune tâche trouvée</h2>
          <p>Aucune donnée n'a été récupérée de la table 'expression_ecrite_tasks'.</p>
          <p className="mt-2">Vérifiez que :</p>
          <ul className="list-disc ml-5">
            <li>La table existe dans votre base de données</li>
            <li>La table contient des données</li>
            <li>Les permissions RLS permettent l'accès</li>
            <li>La connexion à Supabase fonctionne correctement</li>
          </ul>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h2 className="font-semibold text-lg mb-2">Résumé des données</h2>
        <p><span className="font-medium">Nombre de tâches:</span> {tasks?.length || 0}</p>
        <p className="mt-2 text-sm text-gray-600">
          Cette page est destinée uniquement au débogage et devrait être supprimée en production.
        </p>
      </div>
    </div>
  );
}
