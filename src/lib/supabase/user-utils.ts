import { getSupabaseBrowser } from './client';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  subscription_status?: string;
  subscription_expiry?: string;
  created_at: string;
}

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  subscription_status: string | null;
  subscription_expiry: string | null;
  created_at: string | null;
};

const mapProfileRowToUserProfile = (row: ProfileRow | null): UserProfile | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email ?? '',
    full_name: row.full_name ?? undefined,
    role: row.role === 'admin' ? 'admin' : 'user',
    avatar_url: row.avatar_url ?? undefined,
    subscription_status: row.subscription_status ?? undefined,
    subscription_expiry: row.subscription_expiry ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
  };
};

const formatUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erreur technique';
};

/**
 * Récupère et assure l'existence du profil utilisateur
 */
export async function ensureUserProfile(): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { success: false, error: 'Client Supabase non disponible' };
    }

    // Récupérer la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { success: false, error: 'Session non valide' };
    }

    console.log('🔍 Vérification du profil pour:', session.user.email);

    // Essayer de récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Profil non trouvé, tentative de récupération...');
      
      // Appeler la fonction de récupération côté serveur
      const { data: recoveredProfile, error: recoveryError } = await supabase
        .rpc('ensure_user_profile', { user_id: session.user.id });

      if (recoveryError) {
        console.error('❌ Erreur lors de la récupération du profil:', recoveryError);
        return { success: false, error: 'Impossible de récupérer le profil' };
      }

      // Récupérer le profil nouvellement créé
      const { data: newProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError) {
        console.error('❌ Profil inexistant après récupération:', fetchError);
        return { success: false, error: 'Profil non trouvé après récupération' };
      }

      console.log('✅ Profil récupéré avec succès');
      const mappedProfile = mapProfileRowToUserProfile(newProfile as ProfileRow | null);
      if (!mappedProfile) {
        return { success: false, error: 'Profil invalide après récupération' };
      }
      return { success: true, profile: mappedProfile };
    }

    console.log('✅ Profil trouvé:', profile.role);
    const mappedProfile = mapProfileRowToUserProfile(profile as ProfileRow | null);
    if (!mappedProfile) {
      return { success: false, error: 'Profil invalide' };
    }
    return { success: true, profile: mappedProfile };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du profil:', error);
    return { success: false, error: formatUnknownError(error) };
  }
}

/**
 * Vérifie si l'utilisateur actuel est admin
 */
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; profile?: UserProfile; error?: string }> {
  const result = await ensureUserProfile();
  
  if (!result.success) {
    return { isAdmin: false, error: result.error };
  }

  const isAdmin = result.profile?.role === 'admin';
  console.log(`🔍 Statut admin: ${isAdmin ? 'Oui' : 'Non'}`);
  
  return { isAdmin, profile: result.profile };
}

/**
 * Récupère les informations complètes de l'utilisateur
 */
export async function getUserInfo(): Promise<{ user?: UserProfile; error?: string }> {
  const result = await ensureUserProfile();
  
  if (!result.success) {
    return { error: result.error };
  }

  return { user: result.profile };
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { success: false, error: 'Client Supabase non disponible' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Session non valide' };
    }

    const dbUpdates: Partial<ProfileRow> = {
      full_name: updates.full_name ?? null,
      avatar_url: updates.avatar_url ?? null,
      subscription_status: updates.subscription_status ?? null,
      subscription_expiry: updates.subscription_expiry ?? null,
      role: updates.role ?? null,
      email: updates.email ?? null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', session.user.id);

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      return { success: false, error: 'Impossible de mettre à jour le profil' };
    }

    console.log('✅ Profil mis à jour avec succès');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du profil:', error);
    return { success: false, error: formatUnknownError(error) };
  }
}

/**
 * Fonction de récupération d'urgence pour les profils manquants
 */
export async function emergencyProfileRecovery(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return { success: false, error: 'Client Supabase non disponible' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Session non valide' };
    }

    console.log('🚨 Tentative de récupération d\'urgence du profil...');

    // Appeler la fonction de récupération côté serveur
    const { data, error } = await supabase
      .rpc('ensure_user_profile', { user_id: session.user.id });

    if (error) {
      console.error('❌ Erreur lors de la récupération d\'urgence:', error);
      return { success: false, error: 'Récupération échouée' };
    }

    console.log('✅ Récupération d\'urgence réussie');
    return { success: true };

  } catch (error: unknown) {
    console.error('❌ Erreur lors de la récupération d\'urgence:', error);
    return { success: false, error: formatUnknownError(error) };
  }
}