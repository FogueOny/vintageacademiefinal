import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { CreatePeriodData } from '@/types/expression-orale';
import { generatePeriodSlug, formatPeriodTitle } from '@/lib/expression-orale-db';

// GET - Récupère toutes les périodes
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
    
    // Récupérer les filtres à partir des paramètres de requête
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const search = url.searchParams.get('search');
    
    // Construire la requête
    let query = supabase
      .from('expression_orale_periods')
      .select('*');
    
    // Appliquer les filtres
    if (year) {
      query = query.eq('year', parseInt(year));
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Exécuter la requête avec tri
    const { data, error } = await query
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des périodes:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des données' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Exception lors de la récupération des périodes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Crée une nouvelle période
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
    const periodData: CreatePeriodData = await request.json();
    
    // Valider les données
    if (!periodData.month || !periodData.year) {
      return NextResponse.json(
        { error: 'Le mois et l\'année sont requis' },
        { status: 400 }
      );
    }
    
    if (periodData.month < 1 || periodData.month > 12) {
      return NextResponse.json(
        { error: 'Le mois doit être compris entre 1 et 12' },
        { status: 400 }
      );
    }
    
    // Générer le slug et le titre si non fournis
    if (!periodData.slug) {
      periodData.slug = generatePeriodSlug(periodData.month, periodData.year);
    }
    
    if (!periodData.title) {
      periodData.title = formatPeriodTitle(periodData.month, periodData.year);
    }
    
    // Créer la période
    const { data: period, error } = await supabase
      .from('expression_orale_periods')
      .insert(periodData)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la période:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Créer les tâches par défaut pour cette période
    const task2 = {
      period_id: period.id,
      task_number: 2,
      title: 'Tâche 2 : Interaction',
      description: 'Dans cette tâche, vous êtes en situation d\'interaction avec l\'examinateur qui joue le rôle indiqué dans le sujet.',
      instructions: 'Posez des questions à l\'examinateur en fonction du contexte indiqué.'
    };
    
    const task3 = {
      period_id: period.id,
      task_number: 3,
      title: 'Tâche 3 : Point de vue',
      description: 'Dans cette tâche, vous devez donner et justifier votre opinion sur un sujet donné.',
      instructions: 'Exprimez et argumentez votre point de vue sur le sujet proposé. Donnez des exemples.'
    };
    
    await supabase.from('expression_orale_tasks').insert([task2, task3]);
    
    return NextResponse.json({ data: period });
  } catch (error) {
    console.error('Exception lors de la création de la période:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
