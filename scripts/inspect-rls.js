// RLS and policy inspector for Supabase
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/inspect-rls.js
// Optional:
//   TABLES=test_series,modules,profiles node scripts/inspect-rls.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const client = createClient(url, serviceKey, { auth: { persistSession: false } });

const DEFAULT_TABLES = [
  'test_series',
  'modules',
  'profiles',
  'questions',
  'options',
  'user_tests',
  'user_answers',
];

function parseTablesFromEnv() {
  const argTables = process.env.TABLES ||
    (process.argv.find((a) => a.startsWith('--tables=')) || '').split('=')[1];
  if (!argTables) return DEFAULT_TABLES;
  return argTables.split(',').map((t) => t.trim()).filter(Boolean);
}

async function getRlsStatus(tables) {
  // Query pg_class for RLS flag
  const { data, error } = await client
    .from('pg_class')
    .select('relname, relrowsecurity, relowner')
    .in('relname', tables);

  if (error) throw new Error('pg_class query error: ' + error.message);
  const map = new Map();
  (data || []).forEach((r) => map.set(r.relname, r));
  return map;
}

async function getPolicies(tables) {
  const { data, error } = await client
    .from('pg_policies')
    .select('schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check')
    .in('tablename', tables)
    .order('tablename', { ascending: true })
    .order('cmd', { ascending: true })
    .order('policyname', { ascending: true });
  if (error) throw new Error('pg_policies query error: ' + error.message);
  return data || [];
}

function printHeader(title) {
  console.log('\n' + title);
  console.log('='.repeat(title.length));
}

function printTablePolicies(table, rlsRow, policies) {
  console.log(`\n📦 Table: ${table}`);
  console.log('-'.repeat(60));
  if (!rlsRow) {
    console.log('  ⚠️  Not found in pg_class (check schema)');
  } else {
    console.log(`  RLS: ${rlsRow.relrowsecurity ? 'ENABLED' : 'DISABLED'}`);
  }

  if (!policies.length) {
    console.log('  No policies found.');
    return;
  }

  for (const p of policies) {
    const roles = Array.isArray(p.roles) ? p.roles.join(',') : p.roles;
    console.log(`  • ${p.cmd.padEnd(6)} | ${p.policyname} | roles: ${roles || '—'}`);
    if (p.qual) console.log(`      USING: ${p.qual}`);
    if (p.with_check) console.log(`      CHECK: ${p.with_check}`);
  }
}

(async () => {
  try {
    const tables = parseTablesFromEnv();
    printHeader('🔍 Supabase RLS & Policies Inspector');
    console.log('Target tables:', tables.join(', '));

    const [rlsStatus, policies] = await Promise.all([
      getRlsStatus(tables),
      getPolicies(tables),
    ]);

    for (const t of tables) {
      const rlsRow = rlsStatus.get(t);
      const tablePolicies = policies.filter((p) => p.tablename === t);
      printTablePolicies(t, rlsRow, tablePolicies);
    }

    // Quick sanity check for admin write access policy on test_series
    const tsPolicies = policies.filter((p) => p.tablename === 'test_series');
    const hasAdminUpdate = tsPolicies.some(
      (p) => p.cmd === 'UPDATE' && /profiles\s*\.\s*role\s*=\s*'admin'/i.test(`${p.qual} ${p.with_check}`)
    );
    const hasAdminInsert = tsPolicies.some(
      (p) => p.cmd === 'INSERT' && /profiles\s*\.\s*role\s*=\s*'admin'/i.test(`${p.with_check}`)
    );

    console.log('\n✅ Quick checks for test_series:');
    console.log('  - Admin UPDATE policy present:', hasAdminUpdate ? 'YES' : 'NO');
    console.log('  - Admin INSERT policy present:', hasAdminInsert ? 'YES' : 'NO');

    console.log('\nDone.');
  } catch (e) {
    console.error('❌ Inspector failed:', e.message);
    process.exit(1);
  }
})();
