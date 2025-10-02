import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { CreateTaskData } from '@/types/expression-orale';

// GET - Récupère les tâches d'une période
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Vérifier l'authentification et les autorisations
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Récupérer l'ID de la période à partir des paramètres de requête
    const url = new URL(request.url);
    const periodId = url.searchParams.get('periodId');
    
    if (!periodId) {
      return NextResponse.json(
        { error: 'L\'ID de la période est requis' },
        { status: 400 }
      );
    }
    
    // Récupérer les tâches
    const { data, error } = await supabase
      .from('expression_orale_tasks')
      .select('*')
      .eq('period_id', periodId)
      .order('task_number', { ascending: true });
    
    if (error) {
      console.error(`Erreur lors de la récupération des tâches pour la période ${periodId}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Exception lors de la récupération des tâches:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Crée une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Vérifier l'authentification et les autorisations
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Récupérer les données du corps de la requête
    const taskData: CreateTaskData = await request.json();
    
    // Valider les données
    if (!taskData.period_id || !taskData.task_number) {
      return NextResponse.json(
        { error: 'L\'ID de la période et le numéro de tâche sont requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que le numéro de tâche est valide (2 ou 3)
    if (taskData.task_number !== 2 && taskData.task_number !== 3) {
      return NextResponse.json(
        { error: 'Le numéro de tâche doit être 2 ou 3' },
        { status: 400 }
      );
    }
    
    // Créer un titre par défaut si non fourni
    if (!taskData.title) {
      taskData.title = `Tâche ${taskData.task_number}`;
    }
    
    // Créer la tâche
    const { data: task, error } = await supabase
      .from('expression_orale_tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la tâche:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Exception lors de la création de la tâche:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
