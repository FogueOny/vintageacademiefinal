import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Récupérer la structure de la table test_series
    const { data, error } = await supabase
      .from('test_series')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Vérifier si le champ is_free existe
    const hasIsFreeField = data && data.length > 0 && 'is_free' in data[0];

    return NextResponse.json({ 
      success: true,
      hasIsFreeField,
      sampleData: data && data.length > 0 ? data[0] : null,
      columns: data && data.length > 0 ? Object.keys(data[0]) : []
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
} 