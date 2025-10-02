import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleSlug = searchParams.get('slug') || 'comprehension-orale-tcf';

    console.log(`Recherche du module avec le slug: ${moduleSlug}`);

    // 1. Vérifier si le module existe
    const { data: modules, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('slug', moduleSlug);

    if (moduleError) {
      return NextResponse.json({ error: moduleError.message }, { status: 500 });
    }

    if (!modules || modules.length === 0) {
      // Essayer avec des variantes du slug
      const slugVariants = [
        moduleSlug.replace(/-/g, '_'),
        moduleSlug.replace(/_/g, '-'),
        moduleSlug === 'comprehension-orale-tcf' ? 'comprehension-oral-tcf' : moduleSlug,
        moduleSlug === 'comprehension-oral-tcf' ? 'comprehension-orale-tcf' : moduleSlug,
        'comprehension-orale',
        'comprehension-oral',
        'tcf-comprehension-orale',
        'tcf-comprehension-oral'
      ];

      const { data: modulesWithVariants, error: variantError } = await supabase
        .from('modules')
        .select('*')
        .in('slug', slugVariants);

      if (variantError) {
        return NextResponse.json({ error: variantError.message }, { status: 500 });
      }

      return NextResponse.json({
        message: `Module '${moduleSlug}' non trouvé`,
        slugVariants,
        foundModules: modulesWithVariants || [],
        allModules: await getAllModules()
      });
    }

    const module = modules[0];
    console.log(`Module trouvé:`, module);

    // 2. Récupérer les séries de tests pour ce module
    const { data: testSeries, error: seriesError } = await supabase
      .from('test_series')
      .select('*')
      .eq('module_id', module.id);

    if (seriesError) {
      return NextResponse.json({ error: seriesError.message }, { status: 500 });
    }

    // 3. Récupérer tous les modules pour comparaison
    const allModules = await getAllModules();

    return NextResponse.json({
      module,
      testSeries: testSeries || [],
      totalSeries: testSeries?.length || 0,
      freeSeries: testSeries?.filter(ts => ts.is_free === true).length || 0,
      paidSeries: testSeries?.filter(ts => ts.is_free !== true).length || 0,
      allModules
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

async function getAllModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('Erreur lors de la récupération de tous les modules:', error);
    return [];
  }

  return data || [];
} 