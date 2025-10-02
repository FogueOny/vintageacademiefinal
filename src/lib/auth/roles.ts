import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export interface ResolveUserRoleConfig {
  rpcTimeouts?: number[];
  profileTimeoutMs?: number;
}

export async function resolveUserRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  config?: ResolveUserRoleConfig
): Promise<{ role: string | null; isAdmin: boolean; errors: Error[] }> {
  const errors: Error[] = [];

  try {
    const profilePromise = supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle<{ role: string | null }>();

    const timeoutMs = config?.profileTimeoutMs ?? 5000;
    const profileResponse = await Promise.race([
      profilePromise,
      new Promise<PostgrestSingleResponse<{ role: string | null }>>((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), timeoutMs)
      ),
    ]) as PostgrestSingleResponse<{ role: string | null }>;

    if (profileResponse.error) {
      throw profileResponse.error;
    }

    const role = profileResponse.data?.role ?? null;
    return { role, isAdmin: role === 'admin', errors };
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error('Unknown error'));
    return { role: null, isAdmin: false, errors };
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}
