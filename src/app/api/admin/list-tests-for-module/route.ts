import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Le paramètre "slug" est requis.' }, { status: 400 });
  }

  // 1. Trouver l'ID du module
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (moduleError || !module) {
    return NextResponse.json({ error: 'Module non trouvé.' }, { status: 404 });
  }

  // 2. Lister les séries de tests associées
  const { data: testSeries, error: testSeriesError } = await supabase
    .from('test_series')
    .select('id, name, slug, is_free')
    .eq('module_id', module.id);

  if (testSeriesError) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des séries.' }, { status: 500 });
  }

  return NextResponse.json({
    module: { id: module.id, name: module.name, slug },
    testSeries,
    count: testSeries.length
  });
} 