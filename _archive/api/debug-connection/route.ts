import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Créer un client Supabase directement avec les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Si les variables d'environnement sont manquantes, renvoyer une erreur
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Variables d\'environnement Supabase manquantes',
        env: {
          url: supabaseUrl ? 'définie' : 'manquante',
          key: supabaseKey ? 'définie' : 'manquante',
        }
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Tester la connexion en récupérant le nombre de séries de tests
    const { data: testSeries, error: testSeriesError } = await supabase
      .from('test_series')
      .select('count');
    
    // Tester les politiques RLS en récupérant les modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('count');
    
    return NextResponse.json({
      status: 'success',
      connection: 'établie',
      environment: {
        url: supabaseUrl.substring(0, 15) + '...',  // Ne montrer qu'une partie pour des raisons de sécurité
        key: supabaseKey.substring(0, 5) + '...',   // Ne montrer qu'une partie pour des raisons de sécurité
      },
      testSeries: {
        count: testSeries ? testSeries[0]?.count : 'aucun résultat',
        error: testSeriesError ? testSeriesError.message : null,
      },
      modules: {
        count: modules ? modules[0]?.count : 'aucun résultat', 
        error: modulesError ? modulesError.message : null,
      }
    });
    
  } catch (error) {
    console.error('Erreur de débogage Supabase:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la connexion à Supabase',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
