const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'vintage-academie-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

async function testSession() {
  console.log('🔍 Test de session Supabase...\n');

  try {
    // 1. Vérifier la session actuelle
    console.log('1️⃣ Vérification de la session actuelle...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur session:', sessionError);
    } else if (session) {
      console.log('✅ Session trouvée:', session.user.email);
      console.log('📊 Détails session:', {
        expiresAt: session.expires_at,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token
      });
    } else {
      console.log('❌ Aucune session trouvée');
    }

    // 2. Vérifier les utilisateurs dans la base
    console.log('\n2️⃣ Vérification des utilisateurs dans la base...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError);
    } else {
      console.log(`📊 ${users.length} utilisateurs trouvés:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.full_name}`);
      });
    }

    // 3. Tester la connexion avec un compte admin
    console.log('\n3️⃣ Test de connexion avec un compte admin...');
    const testEmail = 'pascualhonore@gmail.com';
    const testPassword = 'test123'; // Remplacez par le vrai mot de passe

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('⚠️ Impossible de tester la connexion (normal si mot de passe incorrect)');
      console.log('   Erreur:', signInError.message);
    } else {
      console.log('✅ Connexion réussie avec:', signInData.user.email);
      
      // Vérifier le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil:', profileError);
      } else {
        console.log('✅ Profil récupéré:', profile.role);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testSession(); 