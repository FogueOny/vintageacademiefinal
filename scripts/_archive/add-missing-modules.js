// Script pour ajouter le module expression-orale manquant
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMissingModules() {
  try {
    console.log('Vérification des modules existants...');
    
    // Vérifier si le module expression-orale existe
    const { data: existingModule, error: moduleError } = await supabase
      .from('modules')
      .select('id')
      .eq('slug', 'expression-orale');
    
    if (moduleError) {
      throw moduleError;
    }
    
    let moduleId;
    
    // Si le module n'existe pas, l'ajouter
    if (!existingModule || existingModule.length === 0) {
      console.log('Module expression-orale non trouvé, ajout en cours...');
      const { data: newModule, error: insertError } = await supabase
        .from('modules')
        .insert([
          {
            name: 'Expression Orale',
            slug: 'expression-orale',
            description: 'Module de test pour l\'expression orale au TCF',
            type: 'expression_orale'
          }
        ])
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('Module expression-orale ajouté avec succès!');
      moduleId = newModule[0].id;
    } else {
      console.log('Module expression-orale existe déjà.');
      moduleId = existingModule[0].id;
    }
    
    // Vérifier si une série de test existe pour ce module
    const { data: existingSeries, error: seriesError } = await supabase
      .from('test_series')
      .select('id')
      .eq('module_id', moduleId);
    
    if (seriesError) {
      throw seriesError;
    }
    
    // Si aucune série n'existe, en ajouter une
    if (!existingSeries || existingSeries.length === 0) {
      console.log('Aucune série de test trouvée pour expression-orale, ajout en cours...');
      const { data: newSeries, error: insertSeriesError } = await supabase
        .from('test_series')
        .insert([
          {
            name: 'Expression Orale - Série 1',
            description: 'Série de test pour l\'expression orale',
            slug: 'eo-serie-1',
            time_limit: 900,
            module_id: moduleId
          }
        ])
        .select();
      
      if (insertSeriesError) {
        throw insertSeriesError;
      }
      
      console.log('Série de test ajoutée avec succès!');
    } else {
      console.log(`${existingSeries.length} série(s) de test existe(nt) déjà pour ce module.`);
    }
    
    console.log('Opération terminée avec succès!');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

addMissingModules();
