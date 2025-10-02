import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // Vérifier d'abord si le champ existe déjà
    const { data: existingData, error: checkError } = await supabase
      .from('test_series')
      .select('id, is_free')
      .limit(1);

    if (checkError) {
      console.error('Erreur lors de la vérification:', checkError);
      return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
    }

    const hasIsFreeField = existingData && existingData.length > 0 && 'is_free' in existingData[0];

    if (hasIsFreeField) {
      return NextResponse.json({ 
        success: true, 
        message: 'Le champ is_free existe déjà' 
      });
    }

    // Si le champ n'existe pas, on ne peut pas l'ajouter via l'API
    // L'utilisateur devra l'ajouter manuellement dans Supabase
    return NextResponse.json({ 
      success: false, 
      message: 'Le champ is_free n\'existe pas. Veuillez l\'ajouter manuellement dans Supabase Dashboard.' 
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
} 