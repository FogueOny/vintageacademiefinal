import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

// GET - Récupère un sujet par son ID
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
    
    // Récupérer le sujet
    const { data, error } = await supabase
      .from('expression_orale_subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération du sujet ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: error.code === '404' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Exception lors de la récupération du sujet:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Met à jour un sujet
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
    
    // S'assurer que le contenu n'est pas vide s'il est fourni
    if (updateData.content !== undefined && !updateData.content.trim()) {
      return NextResponse.json(
        { error: 'Le contenu du sujet ne peut pas être vide' },
        { status: 400 }
      );
    }
    
    // Mettre à jour le sujet
    const { data, error } = await supabase
      .from('expression_orale_subjects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour du sujet ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Exception lors de la mise à jour du sujet:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprime un sujet
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
    
    // Supprimer le sujet
    const { error } = await supabase
      .from('expression_orale_subjects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression du sujet ${id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Exception lors de la suppression du sujet:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
