import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

// GET - Récupère le prochain numéro de sujet disponible pour une tâche
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
    
    // Récupérer l'ID de la tâche à partir des paramètres de requête
    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'L\'ID de la tâche est requis' },
        { status: 400 }
      );
    }
    
    // Récupérer le dernier numéro de sujet pour cette tâche
    const { data, error } = await supabase
      .from('expression_orale_subjects')
      .select('subject_number')
      .eq('task_id', taskId)
      .order('subject_number', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error(`Erreur lors de la récupération du prochain numéro de sujet pour la tâche ${taskId}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Déterminer le prochain numéro
    let nextNumber = 1;
    if (data && data.length > 0) {
      nextNumber = (data[0].subject_number as number) + 1;
    }
    
    return NextResponse.json({ nextNumber });
  } catch (error) {
    console.error('Exception lors de la récupération du prochain numéro de sujet:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
