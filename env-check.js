// Script pour vérifier les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const checkEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    console.log(`❌ ${name} n'est pas définie`);
    return false;
  }
  const maskedValue = value.length > 10 
    ? `${value.substring(0, 5)}...${value.substring(value.length - 5)}`
    : '❓ (trop courte pour être masquée)';
  console.log(`✅ ${name} est définie [${maskedValue}]`);
  return true;
};

console.log('=== VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT ===');
checkEnv('NEXT_PUBLIC_SUPABASE_URL');
checkEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
checkEnv('SUPABASE_SERVICE_KEY');
