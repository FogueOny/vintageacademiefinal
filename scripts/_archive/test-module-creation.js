#!/usr/bin/env node

/**
 * Script de test pour diagnostiquer les problèmes de création de module
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Client admin avec service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testModuleCreation() {
  console.log('🧪 Test de création de module...\n');
  
  // Test 1: Vérifier la connexion
  console.log('1. 🔌 Test de connexion à Supabase...');
  try {
    const { data, error } = await supabaseAdmin.from('modules').select('count').limit(1);
    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return;
    }
    console.log('✅ Connexion réussie\n');
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    return;
  }
  
  // Test 2: Vérifier les permissions sur la table modules
  console.log('2. 🔐 Test des permissions sur la table modules...');
  try {
    const { data, error } = await supabaseAdmin
      .from('modules')
      .select('id, name, slug')
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur lors de la lecture des modules:', error);
      return;
    }
    
    console.log('✅ Lecture des modules réussie');
    console.log('📋 Modules existants:', data?.length || 0);
    if (data && data.length > 0) {
      data.forEach(module => {
        console.log(`   - ${module.name} (${module.slug})`);
      });
    }
    console.log();
  } catch (error) {
    console.error('❌ Erreur lors de la lecture:', error);
    return;
  }
  
  // Test 3: Essayer de créer un module de test
  console.log('3. ➕ Test de création d\'un module...');
  const testModule = {
    name: 'Test Module Creation',
    description: 'Module de test pour vérifier les permissions',
    type: 'comprehension_orale',
    type_module: 'tcf',
    slug: 'test-module-creation-' + Date.now(),
    icon: null
  };
  
  try {
    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert([testModule])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur lors de la création du module:', error);
      console.error('❌ Code d\'erreur:', error.code);
      console.error('❌ Message:', error.message);
      console.error('❌ Détails:', error.details);
      console.error('❌ Hint:', error.hint);
      return;
    }
    
    console.log('✅ Module créé avec succès!');
    console.log('📦 Module créé:', data);
    
    // Test 4: Nettoyer - supprimer le module de test
    console.log('\n4. 🧹 Nettoyage - suppression du module de test...');
    const { error: deleteError } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      console.log('⚠️  Module de test non supprimé, ID:', data.id);
    } else {
      console.log('✅ Module de test supprimé');
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
  
  console.log('\n🎉 Test terminé!');
}

// Test des politiques RLS
async function testRLSPolicies() {
  console.log('\n🔒 Test des politiques RLS...\n');
  
  try {
    // Vérifier les politiques existantes
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'modules');
    
    if (error) {
      console.error('❌ Erreur lors de la lecture des politiques:', error);
      return;
    }
    
    console.log('📋 Politiques RLS pour la table modules:');
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    } else {
      console.log('   Aucune politique trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des politiques:', error);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Diagnostic des problèmes de création de module\n');
  
  await testModuleCreation();
  await testRLSPolicies();
  
  console.log('\n📝 Recommandations:');
  console.log('   1. Vérifiez que les politiques RLS permettent la création');
  console.log('   2. Assurez-vous que l\'utilisateur a le rôle "admin"');
  console.log('   3. Vérifiez les variables d\'environnement');
  console.log('   4. Consultez les logs de la console du navigateur');
}

runTests().catch(console.error); 