import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type')?.trim().toLowerCase();

    const supabase = getSupabaseServiceClient();

    const query = supabase
      .from('modules')
      .select('id,name,description,slug,type_module')
      .order('name', { ascending: true });

    if (type) {
      query.eq('type_module', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[services/modules] Supabase error', error);
      const status = error?.code === 'PGRST301' ? 403 : 500;
      return NextResponse.json({ error: error?.message || 'Unable to fetch modules', details: error }, { status });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    console.error('[services/modules] Unexpected error', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
