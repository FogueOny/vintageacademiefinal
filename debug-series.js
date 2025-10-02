const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Tentative de récupération des séries de tests...');
  
  try {
    const { data, error } = await supabase
      .from('test_series')
      .select('*');
    
    if (error) {
      console.error('ERREUR:', error);
      return;
    }
    
    console.log('Nombre de séries trouvées:', data.length);
    console.log('Détails des séries:');
    console.log(JSON.stringify(data, null, 2));
    
    // Vérifier aussi les modules
    console.log('\nVérification des modules...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*');
      
    if (modulesError) {
      console.error('ERREUR dans la récupération des modules:', modulesError);
      return;
    }
    
    console.log('Nombre de modules trouvés:', modules.length);
    console.log('Liste des modules:');
    console.log(modules.map(m => `${m.id}: ${m.title}`).join('\n'));
  } catch (e) {
    console.error('Exception:', e);
  }
}

main();
