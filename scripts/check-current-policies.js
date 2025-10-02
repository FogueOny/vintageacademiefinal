// Script pour vérifier les politiques RLS actuelles
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicies() {
  console.log('🔍 Vérification des politiques RLS actuelles...\n');

  try {
    const { data: policies, error } = await serviceClient
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd, qual, with_check')
      .in('tablename', ['questions', 'options'])
      .order('tablename, cmd, policyname');

    if (error) {
      console.log('❌ Erreur:', error.message);
      return;
    }

    console.log('📋 Politiques actuelles pour questions et options:');
    console.log('='.repeat(60));
    
    let currentTable = '';
    policies.forEach(policy => {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename;
        console.log(`\n🏷️  TABLE: ${policy.tablename.toUpperCase()}`);
        console.log('-'.repeat(40));
      }
      
      console.log(`  ${policy.cmd.padEnd(8)} | ${policy.policyname}`);
      if (policy.qual) {
        console.log(`           | USING: ${policy.qual.substring(0, 80)}...`);
      }
      if (policy.with_check) {
        console.log(`           | CHECK: ${policy.with_check.substring(0, 80)}...`);
      }
    });

    console.log('\n📊 Résumé:');
    const summary = policies.reduce((acc, policy) => {
      const key = `${policy.tablename}_${policy.cmd}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    Object.entries(summary).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} politique(s)`);
    });

    // Test spécifique INSERT pour options
    console.log('\n🧪 Test INSERT sur options...');
    
    const testOption = {
      question_id: 'test-id',
      content: 'Test option',
      is_correct: false,
      label: 'A'
    };

    const { data: insertTest, error: insertError } = await serviceClient
      .from('options')
      .insert([testOption])
      .select();

    if (insertError) {
      console.log('❌ Erreur INSERT:', insertError.message);
      console.log('❌ Code:', insertError.code);
      console.log('❌ Détails:', insertError.details);
    } else {
      console.log('✅ INSERT fonctionne avec service role');
      // Nettoyer
      await serviceClient.from('options').delete().eq('id', insertTest[0].id);
    }

  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

checkPolicies().catch(console.error); 