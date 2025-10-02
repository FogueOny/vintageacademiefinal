// Script simple pour vérifier si nous pouvons accéder aux variables d'environnement
require('dotenv').config();

console.log('Vérification des variables d\'environnement Supabase:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Défini ✅' : 'Non défini ❌');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Défini ✅' : 'Non défini ❌');
