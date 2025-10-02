import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

// GET - Récupère une tâche par son ID
export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier l'authentification et les autorisations
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Récupérer la tâche
    const { data, error } = await supabase
      .from('expression_orale_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération de la tâche ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === '404' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Exception lors de la récupération de la tâche:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Met à jour une tâche
export async function PATCH(
  request: Request,
  { params }: any
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier l'authentification et les autorisations
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const updateData = await request.json();
    
    // Si le numéro de tâche est fourni, vérifier qu'il est valide (2 ou 3)
    if (updateData.task_number !== undefined && 
        updateData.task_number !== 2 && 
        updateData.task_number !== 3) {
      return NextResponse.json(
        { error: 'Le numéro de tâche doit être 2 ou 3' },
        { status: 400 }
      );
    }
    
    // Mettre à jour la tâche
    const { data, error } = await supabase
      .from('expression_orale_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la tâche ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la tâche:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprime une tâche
export async function DELETE(
  request: Request,
  { params }: any
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier l'authentification et les autorisations
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Vérifier si la tâche a des sujets associés
    const { data: subjects, error: subjectsError } = await supabase
      .from('expression_orale_subjects')
      .select('id')
      .eq('task_id', id)
      .limit(1);
    
    if (subjectsError) {
      console.error(`Erreur lors de la vérification des sujets associés:`, subjectsError);
      return NextResponse.json(
        { error: subjectsError.message },
        { status: 500 }
      );
    }
    
    if (subjects && subjects.length > 0) {
      return NextResponse.json(
        { error: 'Cette tâche possède des sujets associés. Supprimez d\'abord les sujets.' },
        { status: 400 }
      );
    }
    
    // Supprimer la tâche
    const { error } = await supabase
      .from('expression_orale_tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la tâche ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Exception lors de la suppression de la tâche:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
