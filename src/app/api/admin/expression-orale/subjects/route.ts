import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { CreateSubjectData } from '@/types/expression-orale';

// GET - Récupère les sujets d'une tâche
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
    
    // Récupérer les sujets
    const { data, error } = await supabase
      .from('expression_orale_subjects')
      .select('*')
      .eq('task_id', taskId)
      .order('subject_number', { ascending: true });
    
    if (error) {
      console.error(`Erreur lors de la récupération des sujets pour la tâche ${taskId}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Exception lors de la récupération des sujets:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Crée un nouveau sujet
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
    const subjectData: CreateSubjectData = await request.json();
    
    // Valider les données
    if (!subjectData.task_id || !subjectData.content) {
      return NextResponse.json(
        { error: 'L\'ID de la tâche et le contenu du sujet sont requis' },
        { status: 400 }
      );
    }
    
    // Si le numéro de sujet n'est pas fourni, déterminer le prochain numéro
    if (!subjectData.subject_number) {
      // Récupérer le dernier numéro de sujet pour cette tâche
      const { data: lastSubject, error: lastError } = await supabase
        .from('expression_orale_subjects')
        .select('subject_number')
        .eq('task_id', subjectData.task_id)
        .order('subject_number', { ascending: false })
        .limit(1)
        .single();
      
      if (!lastError && lastSubject) {
        subjectData.subject_number = (lastSubject.subject_number as number) + 1;
      } else {
        subjectData.subject_number = 1;
      }
    }
    
    // Activer le sujet par défaut s'il n'est pas spécifié
    if (subjectData.is_active === undefined) {
      subjectData.is_active = true;
    }
    
    // Créer le sujet
    const { data: subject, error } = await supabase
      .from('expression_orale_subjects')
      .insert(subjectData)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création du sujet:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: subject });
  } catch (error) {
    console.error('Exception lors de la création du sujet:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
