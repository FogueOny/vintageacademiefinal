import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

// GET - Récupère une période par son ID
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
    
    // Récupérer la période
    const { data, error } = await supabase
      .from('expression_orale_periods')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération de la période ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === '404' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Exception lors de la récupération de la période:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Met à jour une période
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
    
    // Mettre à jour la période
    const { data, error } = await supabase
      .from('expression_orale_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la période ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la période:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprime une période
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
    
    // Supprimer la période (les tâches et sujets seront supprimés en cascade grâce aux contraintes de la BDD)
    const { error } = await supabase
      .from('expression_orale_periods')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la période ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Exception lors de la suppression de la période:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
