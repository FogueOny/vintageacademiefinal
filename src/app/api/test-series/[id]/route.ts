import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

// GET /api/test-series/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // Récupérer les informations du test
    const { data: testData, error: testError } = await supabase
      .from('test_series')
      .select('*')
      .eq('id', id)
      .single();

    if (testError) {
      if (testError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      return NextResponse.json({ error: testError.message }, { status: 500 });
    }

    return NextResponse.json(testData);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
