import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[dashboard/overview] Supabase env vars missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const cookieStore = await (async () => cookies())();
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.delete({ name, ...options });
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn('[dashboard/overview] auth.getUser error', userError);
      return NextResponse.json({ error: 'Unable to verify session' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id as string;

    const [{ data: profileData, error: profileError }, { data: creditsData, error: creditsError }, { data: testsData, error: testsError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role, subscription_status, subscription_expiry, is_suspended')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_tests')
        .select('score, end_time')
        .eq('user_id', userId)
        .not('end_time', 'is', null),
    ]);

    if (profileError) {
      console.warn('[dashboard/overview] profile error', profileError);
    }

    if (creditsError) {
      console.warn('[dashboard/overview] credits error', creditsError);
    }

    if (testsError) {
      console.warn('[dashboard/overview] tests error', testsError);
    }

    const balance = typeof creditsData?.balance === 'number' ? creditsData.balance : 0;

    const completedTests = Array.isArray(testsData) ? testsData.length : 0;
    const averageScore = completedTests > 0
      ? Math.round(
          (testsData || []).reduce((sum, record) => sum + (typeof record.score === 'number' ? record.score : 0), 0) /
            completedTests,
        )
      : null;

    const subscriptionStatus = profileData?.subscription_status ?? null;
    const subscriptionExpiry = profileData?.subscription_expiry ?? null;

    const isAdmin = (profileData?.role ?? '').toLowerCase() === 'admin';

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata ?? {},
      },
      profile: profileData ?? null,
      credits: balance,
      stats: {
        subscriptionStatus,
        subscriptionExpiry,
        testsCompleted: completedTests,
        averageScore,
      },
      isAdmin,
    });
  } catch (error: any) {
    console.error('[dashboard/overview] unexpected error', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
