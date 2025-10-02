import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import type { Database } from '@/types/supabase';

type AccessPayload = {
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  subscriptionExpiry: string | null;
};

type NormalizedSeries = {
  id: string;
  name: string;
  description: string;
  module_id: string;
  slug: string;
  time_limit: number | null;
  is_free: boolean;
  is_published: boolean;
};

type SessionUser = {
  id: string;
  email: string | null;
} | null;

type TestSeriesRow = Database['public']['Tables']['test_series']['Row'];
type TestSeriesRowWithExtras = TestSeriesRow & {
  name?: string | null;
  time_limit?: number | string | null;
};
type ProfileSubscriptionRow = {
  subscription_status: string | null;
  subscription_expiry: string | null;
};
type ModulesRow = Database['public']['Tables']['modules']['Row'];
type ServiceClient = ReturnType<typeof getSupabaseServiceClient>;
type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const ECRITE_VARIANTS = [
  'comprehension-ecrite',
  'comprehension_ecrite',
  'comprehension-ecrite-tcf',
  'comprehension_ecrite_tcf',
  'comprhension-crite-tcf',
  'comprhension_crite_tcf',
  'comprhension-crite',
  'comprhension_crite',
];

function buildSlugVariants(rawSlug: string): string[] {
  const base = rawSlug.replace(/-tcf$/, '');
  const variants = new Set<string>([
    rawSlug,
    base,
    base.replace(/-/g, '_'),
    base.replace(/_/g, '-'),
    `${base}-tcf`,
    `${base}_tcf`,
  ]);

  if (base === 'comprehension-orale') {
    variants.add('comprehension-oral');
    variants.add('comprehension_oral');
  }
  if (base === 'comprehension-oral') {
    variants.add('comprehension_orale');
  }
  if (base.includes('ecrite') || rawSlug.includes('crite') || rawSlug.includes('ecrite')) {
    ECRITE_VARIANTS.forEach((variant) => variants.add(variant));
  }

  return Array.from(variants);
}

function normalizeSeries(row: TestSeriesRowWithExtras): NormalizedSeries {
  const resolvedName = row.name ?? row.title ?? row.slug ?? 'Test';
  const resolvedModuleId = row.module_id != null ? String(row.module_id) : '';
  const rawTimeLimit = row.time_limit;
  const timeLimit = typeof rawTimeLimit === 'number' ? rawTimeLimit : rawTimeLimit == null ? null : Number(rawTimeLimit) || null;
  return {
    id: String(row.id),
    name: resolvedName,
    description: row.description ?? '',
    module_id: resolvedModuleId,
    slug: row.slug ?? '',
    time_limit: timeLimit,
    is_free: Boolean(row.is_free),
    is_published: Boolean(row.is_published ?? true),
  };
}

async function resolveAccess(
  client: ServerSupabaseClient
): Promise<{ access: AccessPayload; user: SessionUser }> {
  const access: AccessPayload = {
    isAuthenticated: false,
    hasActiveSubscription: false,
    subscriptionStatus: null,
    subscriptionExpiry: null,
  };
  let sessionUser: SessionUser = null;

  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (!error && user) {
      sessionUser = { id: user.id, email: user.email ?? null };
      access.isAuthenticated = true;

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('subscription_status, subscription_expiry')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('[test-series] profile lookup error', profileError);
      }

      if (profile) {
        const profileData = profile as ProfileSubscriptionRow | null;
        const status = profileData?.subscription_status ?? null;
        const expiry = profileData?.subscription_expiry ?? null;
        access.subscriptionStatus = status;
        access.subscriptionExpiry = expiry;

        if (status === 'active' && expiry) {
          const expiryDate = new Date(expiry);
          if (!Number.isNaN(expiryDate.getTime()) && expiryDate > new Date()) {
            access.hasActiveSubscription = true;
          }
        }
      }
    }
  } catch (accessError) {
    console.warn('[test-series] access resolution error', accessError);
  }

  return { access, user: sessionUser };
}

async function verifyAdminSession(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error("Token d'authentification manquant");
  }

  const token = authHeader.substring(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set');
  }
  const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );

  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) {
    throw new Error('Session invalide');
  }

  const service = getSupabaseServiceClient();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string | null }>();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Droits administrateur requis');
  }

  return user;
}

// GET /api/test-series?moduleSlug=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleSlug = searchParams.get('moduleSlug');
    if (!moduleSlug) {
      return NextResponse.json({ error: 'moduleSlug is required' }, { status: 400 });
    }

    const supabaseAdmin: ServiceClient = getSupabaseServiceClient();
    const supabaseRoute = await createServerSupabaseClient();

    const variants = buildSlugVariants(moduleSlug);
    const { data: modulesData, error: moduleError } = await supabaseAdmin
      .from('modules')
      .select('id')
      .in('slug', variants)
      .limit(1);

    if (moduleError) {
      console.error('[test-series] module lookup error', moduleError);
      return NextResponse.json({ error: moduleError.message }, { status: 500 });
    }

    const moduleId = (modulesData as Pick<ModulesRow, 'id'>[] | null)?.[0]?.id;
    if (!moduleId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const { data: seriesData, error: seriesError } = await supabaseAdmin
      .from('test_series')
      .select('*')
      .eq('module_id', moduleId)
      .order('slug', { ascending: true });

    if (seriesError) {
      console.error('[test-series] series lookup error', seriesError);
      return NextResponse.json({ error: seriesError.message }, { status: 500 });
    }

    const normalized = (seriesData ?? []).map((row) => normalizeSeries(row as TestSeriesRowWithExtras));

    const { access, user } = await resolveAccess(supabaseRoute);

    return NextResponse.json({
      data: normalized,
      access,
      user,
    });
  } catch (error) {
    console.error('[test-series] GET unexpected error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/test-series - Create new test series
export async function POST(req: NextRequest) {
  try {
    await verifyAdminSession(req);

    const body = await req.json();
    const { name, description, module_id, time_limit, is_free } = body as Record<string, unknown>;

    if (!name || !module_id) {
      return NextResponse.json({ error: 'name and module_id are required' }, { status: 400 });
    }

    const slug = String(name)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const payload = {
      title: String(name),
      description: (description as string) ?? '',
      module_id: String(module_id),
      slug,
      is_free: Boolean(is_free),
      is_published: true,
      time_limit: typeof time_limit === 'number' ? time_limit : null,
    };

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('test_series')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Create test series error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: normalizeSeries(data as TestSeriesRowWithExtras),
    });
  } catch (error) {
    console.error('POST test-series error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la création';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api test-series - Update test series
export async function PUT(req: NextRequest) {
  try {
    await verifyAdminSession(req);

    const body = await req.json();
    const { id, name, description, module_id, time_limit, is_free } = body as Record<string, unknown>;

    if (!id || !name || !module_id) {
      return NextResponse.json({ error: 'id, name and module_id are required' }, { status: 400 });
    }

    const slug = String(name)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const payload = {
      title: String(name),
      description: (description as string) ?? '',
      module_id: String(module_id),
      slug,
      is_free: Boolean(is_free),
      time_limit: typeof time_limit === 'number' ? time_limit : null,
    };

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('test_series')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update test series error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: normalizeSeries(data as TestSeriesRowWithExtras),
    });
  } catch (error) {
    console.error('PUT test-series error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/test-series - Delete test series
export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminSession(req);

    const body = await req.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase
      .from('test_series')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete test series error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE test-series error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
