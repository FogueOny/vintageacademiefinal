/**
 * Script d'importation de données en masse pour Vintage Académie
 * 
 * Ce script permet d'importer des modules, séries de tests et questions
 * depuis des fichiers CSV ou Excel structurés
 * 
 * Usage: 
 * node import-data.js --type=modules --file=modules.csv
 * node import-data.js --type=test-series --file=series.xlsx
 * node import-data.js --type=questions --file=questions.xlsx
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const slugify = require('slugify');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parsage des arguments de ligne de commande
const argv = yargs(hideBin(process.argv))
  .option('type', {
    alias: 't',
    description: 'Type de données à importer (modules, test-series, questions)',
    type: 'string',
    demandOption: true
  })
  .option('file', {
    alias: 'f',
    description: 'Chemin vers le fichier de données (CSV ou Excel)',
    type: 'string', 
    demandOption: true
  })
  .option('dryrun', {
    alias: 'd',
    description: 'Mode simulation (sans modification réelle)',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

// Initialisation du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erreur: Variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_KEY manquantes.');
  console.error('Créez un fichier .env avec ces variables ou utilisez les variables d\'environnement.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction principale
async function importData() {
  try {
    const { type, file, dryrun } = argv;
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(file)) {
      console.error(`Erreur: Le fichier ${file} n'existe pas.`);
      process.exit(1);
    }
    
    console.log(`Mode: ${dryrun ? 'Simulation' : 'Importation réelle'}`);
    
    // Lire les données du fichier
    const data = readDataFile(file);
    
    if (!data || data.length === 0) {
      console.error('Aucune donnée n\'a été trouvée dans le fichier.');
      process.exit(1);
    }
    
    console.log(`${data.length} enregistrements trouvés dans le fichier.`);
    
    // Importer selon le type
    switch (type.toLowerCase()) {
      case 'modules':
        await importModules(data, dryrun);
        break;
      case 'test-series':
        await importTestSeries(data, dryrun);
        break;
      case 'questions':
        await importQuestions(data, dryrun);
        break;
      default:
        console.error(`Type inconnu: ${type}. Utilisez modules, test-series, ou questions.`);
        process.exit(1);
    }
    
    console.log('Importation terminée avec succès!');
    
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    process.exit(1);
  }
}

// Fonction pour lire les données du fichier (CSV ou Excel)
function readDataFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  
  if (extension === '.csv') {
    // Lire CSV
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  } else if (extension === '.xlsx' || extension === '.xls') {
    // Lire Excel
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(worksheet);
  } else {
    console.error('Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.');
    process.exit(1);
  }
}

// Importation des modules
async function importModules(data, dryrun) {
  console.log('Début de l\'importation des modules...');
  
  const results = {
    success: 0,
    errors: 0,
    details: []
  };
  
  for (const item of data) {
    try {
      // Valider les données obligatoires
      if (!item.name || !item.type || !item.type_module) {
        throw new Error('Champs obligatoires manquants: name, type ou type_module');
      }
      
      // Générer le slug si non fourni
      const slug = item.slug || slugify(item.name, { lower: true, strict: true });
      
      const module = {
        name: item.name,
        description: item.description || '',
        type: item.type,
        type_module: item.type_module,
        icon: item.icon || null,
        slug
      };
      
      if (!dryrun) {
        // Vérifier si le module existe déjà (par slug)
        const { data: existingModule } = await supabase
          .from('modules')
          .select('id')
          .eq('slug', slug)
          .single();
        
        let result;
        
        if (existingModule) {
          // Mise à jour
          result = await supabase
            .from('modules')
            .update(module)
            .eq('id', existingModule.id);
          
          if (result.error) throw result.error;
          console.log(`Module mis à jour: ${module.name}`);
        } else {
          // Insertion
          result = await supabase
            .from('modules')
            .insert(module);
          
          if (result.error) throw result.error;
          console.log(`Module créé: ${module.name}`);
        }
      } else {
        // Mode simulation
        console.log(`[SIMULATION] Module à traiter: ${JSON.stringify(module)}`);
      }
      
      results.success++;
      results.details.push({ status: 'success', name: item.name });
      
    } catch (error) {
      console.error(`Erreur avec le module ${item.name || 'inconnu'}:`, error.message);
      results.errors++;
      results.details.push({ 
        status: 'error', 
        name: item.name || 'inconnu',
        error: error.message
      });
    }
  }
  
  console.log(`Résultats - Modules: ${results.success} réussis, ${results.errors} échoués.`);
  return results;
}

// Importation des séries de tests
async function importTestSeries(data, dryrun) {
  console.log('Début de l\'importation des séries de tests...');
  
  const results = {
    success: 0,
    errors: 0,
    details: []
  };
  
  for (const item of data) {
    try {
      // Valider les données obligatoires
      if (!item.title || !item.module_id) {
        throw new Error('Champs obligatoires manquants: title ou module_id');
      }
      
      // Générer le slug si non fourni
      const slug = item.slug || slugify(item.title, { lower: true, strict: true });
      
      // Vérifier que le module existe
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('id', item.module_id)
        .single();
      
      if (moduleError || !module) {
        throw new Error(`Le module avec l'ID ${item.module_id} n'existe pas`);
      }
      
      const testSeries = {
        title: item.title,
        description: item.description || '',
        module_id: item.module_id,
        is_free: item.is_free === 'true' || item.is_free === true || item.is_free === 1,
        is_published: item.is_published === 'true' || item.is_published === true || item.is_published === 1,
        slug
      };
      
      if (!dryrun) {
        // Vérifier si la série existe déjà (par slug)
        const { data: existingSeries } = await supabase
          .from('test_series')
          .select('id')
          .eq('slug', slug)
          .single();
        
        let result;
        
        if (existingSeries) {
          // Mise à jour
          result = await supabase
            .from('test_series')
            .update(testSeries)
            .eq('id', existingSeries.id);
          
          if (result.error) throw result.error;
          console.log(`Série mise à jour: ${testSeries.title}`);
        } else {
          // Insertion
          result = await supabase
            .from('test_series')
            .insert(testSeries);
          
          if (result.error) throw result.error;
          console.log(`Série créée: ${testSeries.title}`);
        }
      } else {
        // Mode simulation
        console.log(`[SIMULATION] Série à traiter: ${JSON.stringify(testSeries)}`);
      }
      
      results.success++;
      results.details.push({ status: 'success', title: item.title });
      
    } catch (error) {
      console.error(`Erreur avec la série ${item.title || 'inconnue'}:`, error.message);
      results.errors++;
      results.details.push({ 
        status: 'error', 
        title: item.title || 'inconnue',
        error: error.message
      });
    }
  }
  
  console.log(`Résultats - Séries: ${results.success} réussies, ${results.errors} échouées.`);
  return results;
}

// Importation des questions
async function importQuestions(data, dryrun) {
  console.log('Début de l\'importation des questions...');
  
  const results = {
    success: 0,
    errors: 0,
    details: []
  };
  
  for (const item of data) {
    try {
      // Valider les données obligatoires
      if (!item.test_series_id || !item.question_text || !item.type) {
        throw new Error('Champs obligatoires manquants: test_series_id, question_text ou type');
      }
      
      // Vérifier que la série de test existe
      const { data: series, error: seriesError } = await supabase
        .from('test_series')
        .select('id')
        .eq('id', item.test_series_id)
        .single();
      
      if (seriesError || !series) {
        throw new Error(`La série de test avec l'ID ${item.test_series_id} n'existe pas`);
      }
      
      // Construire l'objet question selon son type
      const question = {
        test_series_id: item.test_series_id,
        question_text: item.question_text,
        type: item.type,
        order: item.order || null,
        media_url: item.media_url || null,
        media_type: item.media_type || null,
        options: parseOptions(item)
      };
      
      if (!dryrun) {
        // Pour les questions, on fait toujours une insertion
        // car une mise à jour serait trop complexe à gérer
        const result = await supabase
          .from('questions')
          .insert(question);
        
        if (result.error) throw result.error;
        console.log(`Question créée: ${question.question_text.substring(0, 30)}...`);
      } else {
        // Mode simulation
        console.log(`[SIMULATION] Question à traiter: ${JSON.stringify({
          ...question,
          question_text: question.question_text.substring(0, 30) + '...'
        })}`);
      }
      
      results.success++;
      results.details.push({ 
        status: 'success', 
        question: item.question_text.substring(0, 30) + '...'
      });
      
    } catch (error) {
      console.error(`Erreur avec la question ${
        item.question_text?.substring(0, 30) + '...' || 'inconnue'
      }:`, error.message);
      results.errors++;
      results.details.push({ 
        status: 'error', 
        question: item.question_text?.substring(0, 30) + '...' || 'inconnue',
        error: error.message
      });
    }
  }
  
  console.log(`Résultats - Questions: ${results.success} réussies, ${results.errors} échouées.`);
  return results;
}

// Fonction pour parser les options selon le type de question
function parseOptions(item) {
  const options = [];
  
  switch (item.type) {
    case 'multiple_choice':
      // Format attendu pour les options: 
      // option1:is_correct1,option2:is_correct2,...
      if (item.options) {
        const optionPairs = item.options.split(',');
        for (const pair of optionPairs) {
          const [text, isCorrect] = pair.split(':');
          if (text) {
            options.push({
              text: text.trim(),
              is_correct: isCorrect === 'true' || isCorrect === '1'
            });
          }
        }
      }
      break;
      
    case 'fill_blank':
      // Format attendu: answer1,answer2,...
      if (item.answers) {
        const answers = item.answers.split(',');
        for (const answer of answers) {
          if (answer) {
            options.push({
              text: answer.trim(),
              is_correct: true
            });
          }
        }
      }
      break;
      
    case 'matching':
      // Format attendu: left1:right1,left2:right2,...
      if (item.pairs) {
        const pairs = item.pairs.split(',');
        for (const pair of pairs) {
          const [left, right] = pair.split(':');
          if (left && right) {
            options.push({
              left_text: left.trim(),
              right_text: right.trim()
            });
          }
        }
      }
      break;
  }
  
  return options;
}

// Exécuter l'importation
importData();
