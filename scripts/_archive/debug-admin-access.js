const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdminAccess() {
  console.log('🔍 Diagnostic des accès admin...\n');

  try {
    // 1. Vérifier la connectivité
    console.log('1️⃣ Test de connectivité...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur de connectivité:', testError);
      return;
    }
    console.log('✅ Connectivité OK\n');

    // 2. Lister tous les utilisateurs
    console.log('2️⃣ Liste des utilisateurs...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }

    console.log(`📊 ${users.length} utilisateurs trouvés:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role || 'user'}) - ${user.full_name || 'Sans nom'}`);
    });
    console.log();

    // 3. Lister les admins
    console.log('3️⃣ Utilisateurs admin...');
    const admins = users.filter(user => user.role === 'admin');
    
    if (admins.length === 0) {
      console.log('⚠️  Aucun utilisateur admin trouvé');
      console.log('💡 Pour créer un admin, utilisez le script SQL dans scripts/check-admin-users.sql');
    } else {
      console.log(`✅ ${admins.length} admin(s) trouvé(s):`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} - ${admin.full_name || 'Sans nom'}`);
      });
    }
    console.log();

    // 4. Vérifier la structure de la table
    console.log('4️⃣ Structure de la table profiles...');
    try {
      const { data: structure, error: structureError } = await supabase
        .rpc('get_table_info', { table_name: 'profiles' });

      if (structureError) {
        console.log('ℹ️  Impossible de récupérer la structure (normal)');
      } else {
        console.log('📋 Structure de la table:', structure);
      }
    } catch (error) {
      console.log('ℹ️  RPC non disponible (normal)');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugAdminAccess(); 