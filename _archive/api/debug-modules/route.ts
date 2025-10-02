import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les modules
    const { data: modules, error } = await supabase()
      .from('modules')
      .select('*');

    if (error) {
      console.error("Erreur lors de la récupération des modules:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}
