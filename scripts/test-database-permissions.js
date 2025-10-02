#!/usr/bin/env node

/**
 * Script de test des permissions de base de données
 * Vérifie les accès aux tables principales et les politiques RLS
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

console.log('🔍 Test des permissions de base de données...\n');

// Client normal (utilisateur)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client admin (service role)
const adminSupabase = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function testDatabasePermissions() {
  try {
    // Test 1: Connexion à la base
    console.log('1. 🔌 Test de connexion à la base de données...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('   ❌ Erreur de connexion:', error.message);
      return;
    }
    console.log('   ✅ Connexion réussie\n');

    // Test 2: Vérifier les tables existantes
    console.log('2. 📊 Vérification des tables principales...');
    const tables = ['profiles', 'modules', 'test_series', 'questions', 'options'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Table ${table}: accessible (${data?.length || 0} résultats)`);
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: erreur inattendue`);
      }
    }
    console.log('');

    // Test 3: Test avec utilisateur authentifié
    console.log('3. 🔐 Test avec utilisateur authentifié...');
    
    // Simuler une authentification (vous devrez vous connecter manuellement)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('   ⚠️  Aucun utilisateur connecté - connectez-vous d\'abord');
      console.log('   💡 Allez sur http://localhost:3000/login et connectez-vous');
      console.log('   💡 Puis relancez ce script\n');
    } else {
      console.log(`   ✅ Utilisateur connecté: ${user.email}`);
      
      // Test du profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.log(`   ❌ Erreur récupération profil: ${profileError.message}`);
      } else {
        console.log(`   ✅ Profil trouvé: ${profile.email} (rôle: ${profile.role})`);
      }
      
      // Test des permissions admin si applicable
      if (profile?.role === 'admin') {
        console.log('   🔑 Test des permissions admin...');
        
        // Test création question
        try {
          const { data: testSeries } = await supabase.from('test_series').select('id').limit(1);
          if (testSeries && testSeries.length > 0) {
            const { error: questionError } = await supabase
              .from('questions')
              .insert({
                content: 'Question de test - À SUPPRIMER',
                points: 1,
                question_number: 999,
                test_series_id: testSeries[0].id
              })
              .select();
              
            if (questionError) {
              console.log(`   ❌ Création question: ${questionError.message}`);
            } else {
              console.log('   ✅ Création question: autorisée');
              
              // Supprimer la question de test
              await supabase.from('questions').delete().eq('question_number', 999);
            }
          }
        } catch (err) {
          console.log('   ❌ Test création question échoué');
        }
      }
    }
    console.log('');

    // Test 4: Vérifier les politiques RLS
    console.log('4. 🛡️  Test des politiques RLS...');
    
    if (adminSupabase) {
      // Vérifier les politiques avec le client admin
      const { data: policies, error: policiesError } = await adminSupabase
        .from('pg_policies')
        .select('schemaname, tablename, policyname, roles, cmd, qual')
        .eq('schemaname', 'public');
        
      if (policiesError) {
        console.log('   ❌ Impossible de récupérer les politiques RLS');
      } else {
        const tablesPolicies = policies.reduce((acc, policy) => {
          if (!acc[policy.tablename]) acc[policy.tablename] = [];
          acc[policy.tablename].push(policy);
          return acc;
        }, {});
        
        for (const [table, tablePolicies] of Object.entries(tablesPolicies)) {
          console.log(`   📋 Table ${table}: ${tablePolicies.length} politique(s)`);
          tablePolicies.forEach(policy => {
            console.log(`      - ${policy.policyname} (${policy.cmd})`);
          });
        }
      }
    } else {
      console.log('   ⚠️  Clé service manquante - impossible de vérifier les politiques RLS');
    }
    console.log('');

    // Test 5: Test des contraintes
    console.log('5. 🔗 Test des contraintes de clés étrangères...');
    
    try {
      // Test insertion question sans test_series_id
      const { error: constraintError } = await supabase
        .from('questions')
        .insert({
          content: 'Test contrainte',
          points: 1,
          question_number: 1,
          test_series_id: '00000000-0000-0000-0000-000000000000' // UUID invalide
        });
        
      if (constraintError && constraintError.message.includes('foreign key')) {
        console.log('   ✅ Contraintes de clés étrangères fonctionnelles');
      } else {
        console.log('   ⚠️  Contraintes de clés étrangères à vérifier');
      }
    } catch (err) {
      console.log('   ✅ Contraintes de clés étrangères fonctionnelles');
    }

    console.log('\n✅ Test de base de données terminé !');
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
  }
}

testDatabasePermissions(); 