// Script de test après nettoyage des politiques RLS
// Exécuter avec: node scripts/test-after-cleanup.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPoliciesAfterCleanup() {
  console.log('🧪 Test des politiques après nettoyage...\n');

  // Test 1: Lecture publique (anonyme)
  console.log('1. Test lecture publique (anonyme)');
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur lecture publique:', error.message);
    } else {
      console.log('✅ Lecture publique OK');
    }
  } catch (err) {
    console.log('❌ Exception lecture publique:', err.message);
  }

  // Test 2: Connexion admin et test permissions
  console.log('\n2. Test connexion admin');
  const adminEmail = 'fogueponyvictor@gmail.com';
  
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: 'testpassword123' // Remplacer par le vrai mot de passe
    });

    if (signInError) {
      console.log('❌ Erreur connexion admin:', signInError.message);
      return;
    }

    console.log('✅ Connexion admin OK');

    // Test 3: Vérifier le profil admin
    console.log('\n3. Vérification profil admin');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Erreur profil:', profileError.message);
    } else {
      console.log('✅ Profil trouvé:', profile.email, 'Role:', profile.role);
    }

    // Test 4: Test création question
    console.log('\n4. Test création question');
    const testQuestion = {
      question_text: 'Test question après nettoyage',
      question_number: 9999,
      points: 1,
      module_id: 1,
      temp_media_id: null
    };

    const { data: newQuestion, error: createError } = await supabase
      .from('questions')
      .insert([testQuestion])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur création question:', createError.message);
      console.log('Code erreur:', createError.code);
    } else {
      console.log('✅ Question créée avec succès:', newQuestion.id);

      // Test 5: Test création options
      console.log('\n5. Test création options');
      const testOptions = [
        { question_id: newQuestion.id, option_text: 'Option A', is_correct: true },
        { question_id: newQuestion.id, option_text: 'Option B', is_correct: false },
        { question_id: newQuestion.id, option_text: 'Option C', is_correct: false },
        { question_id: newQuestion.id, option_text: 'Option D', is_correct: false }
      ];

      const { data: newOptions, error: optionsError } = await supabase
        .from('options')
        .insert(testOptions)
        .select();

      if (optionsError) {
        console.log('❌ Erreur création options:', optionsError.message);
      } else {
        console.log('✅ Options créées avec succès:', newOptions.length);
      }

      // Test 6: Nettoyage - supprimer les données de test
      console.log('\n6. Nettoyage données de test');
      await supabase.from('options').delete().eq('question_id', newQuestion.id);
      await supabase.from('questions').delete().eq('id', newQuestion.id);
      console.log('✅ Données de test supprimées');
    }

    // Déconnexion
    await supabase.auth.signOut();
    console.log('✅ Déconnexion OK');

  } catch (err) {
    console.log('❌ Exception test admin:', err.message);
  }

  // Test 7: Vérifier les politiques actuelles
  console.log('\n7. Vérification politiques actuelles');
  try {
    const { data: policies, error } = await serviceClient
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd')
      .in('tablename', ['questions', 'options'])
      .order('tablename, cmd, policyname');

    if (error) {
      console.log('❌ Erreur lecture politiques:', error.message);
    } else {
      console.log('✅ Politiques actuelles:');
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (err) {
    console.log('❌ Exception politiques:', err.message);
  }

  console.log('\n🎉 Test terminé !');
}

testPoliciesAfterCleanup().catch(console.error); 