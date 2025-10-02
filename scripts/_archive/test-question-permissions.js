#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test avec différents types de clients
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuestionCreation() {
  console.log('🧪 Test des permissions de création de questions...\n');
  
  // Test 1: Avec le service role (admin absolu)
  console.log('1️⃣ Test avec Service Role (admin absolu):');
  try {
    const { data, error } = await serviceClient
      .from('questions')
      .insert([{
        content: 'Test question - Service Role',
        points: 1,
        question_number: 999,
        test_series_id: '9145afc3-c2e1-49b9-8b89-d8be83c1c1c5', // ID d'une série existante
        media_type: 'none',
        media_url: ''
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur Service Role:', error.message);
    } else {
      console.log('✅ Service Role: Question créée avec succès');
      // Nettoyer
      await serviceClient.from('questions').delete().eq('id', data[0].id);
    }
  } catch (err) {
    console.log('💥 Erreur Service Role:', err.message);
  }
  
  // Test 2: Avec client anonyme (simule un utilisateur connecté)
  console.log('\n2️⃣ Test avec client anonyme:');
  try {
    const { data, error } = await anonClient
      .from('questions')
      .insert([{
        content: 'Test question - Anon Client',
        points: 1,
        question_number: 999,
        test_series_id: '9145afc3-c2e1-49b9-8b89-d8be83c1c1c5',
        media_type: 'none',
        media_url: ''
      }])
      .select();
    
    if (error) {
      console.log('❌ Erreur Client Anonyme:', error.message);
      console.log('   Code:', error.code);
      console.log('   Détails:', error.details);
    } else {
      console.log('✅ Client Anonyme: Question créée avec succès');
      // Nettoyer
      await serviceClient.from('questions').delete().eq('id', data[0].id);
    }
  } catch (err) {
    console.log('💥 Erreur Client Anonyme:', err.message);
  }
  
  // Test 3: Vérifier les politiques RLS
  console.log('\n3️⃣ Vérification des politiques RLS:');
  try {
    const { data: policies, error } = await serviceClient
      .rpc('get_table_policies', { table_name: 'questions' })
      .catch(() => {
        // Si la fonction n'existe pas, on fait une requête alternative
        return serviceClient
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'questions');
      });
    
    if (policies && policies.length > 0) {
      console.log('📋 Politiques trouvées:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd || policy.permissive}`);
      });
    } else {
      console.log('⚠️ Aucune politique RLS trouvée ou accès refusé');
    }
  } catch (err) {
    console.log('⚠️ Impossible de vérifier les politiques RLS:', err.message);
  }
  
  // Test 4: Vérifier l'accès aux séries de tests
  console.log('\n4️⃣ Test d\'accès aux séries de tests:');
  try {
    const { data: series, error } = await anonClient
      .from('test_series')
      .select('id, title')
      .limit(3);
    
    if (error) {
      console.log('❌ Erreur accès séries:', error.message);
    } else {
      console.log(`✅ Accès séries: ${series.length} séries trouvées`);
      series.forEach(s => console.log(`   - ${s.title} (${s.id})`));
    }
  } catch (err) {
    console.log('💥 Erreur accès séries:', err.message);
  }
}

async function testUserSession(email) {
  console.log(`\n🔐 Test de session pour ${email}:`);
  
  // Simuler une connexion utilisateur
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (profileError) {
      console.log('❌ Utilisateur non trouvé:', profileError.message);
      return;
    }
    
    console.log(`👤 Utilisateur: ${profile.email}`);
    console.log(`🎯 Rôle: ${profile.role}`);
    console.log(`📧 ID: ${profile.id}`);
    
    // Test de création de question avec cet utilisateur
    // Note: Ceci simule ce qui se passe côté client
    const { data, error } = await anonClient
      .from('questions')
      .insert([{
        content: `Test question - ${email}`,
        points: 1,
        question_number: 999,
        test_series_id: '9145afc3-c2e1-49b9-8b89-d8be83c1c1c5',
        media_type: 'none',
        media_url: ''
      }])
      .select();
    
    if (error) {
      console.log('❌ Création échouée:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Question créée avec succès !');
      // Nettoyer
      await serviceClient.from('questions').delete().eq('id', data[0].id);
    }
    
  } catch (err) {
    console.log('💥 Erreur session:', err.message);
  }
}

// Interface en ligne de commande
const args = process.argv.slice(2);

if (args.length === 0) {
  testQuestionCreation();
} else if (args[0] === 'user' && args[1]) {
  testUserSession(args[1]);
} else {
  console.log('Usage:');
  console.log('  node scripts/test-question-permissions.js              # Test général');
  console.log('  node scripts/test-question-permissions.js user email@example.com  # Test utilisateur spécifique');
} 