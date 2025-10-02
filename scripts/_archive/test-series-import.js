#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Script de test pour vérifier l'import des séries d'expression écrite
async function testSeriesImport() {
  console.log('🧪 Test de l\'import des séries Expression Écrite');
  console.log('='.repeat(50));
  
  // 1. Vérifier que les fichiers existent
  const templatesDir = path.join(__dirname, '..', 'public', 'templates');
  const seriesFiles = fs.readdirSync(templatesDir)
    .filter(file => file.includes('expression-ecrite-series') && file.endsWith('.csv'))
    .sort();
  
  if (seriesFiles.length === 0) {
    console.log('❌ Aucun template de séries trouvé');
    return;
  }
  
  console.log(`✅ Templates trouvés: ${seriesFiles.length}`);
  seriesFiles.forEach(file => console.log(`   - ${file}`));
  
  // 2. Vérifier le format du dernier template
  const latestTemplate = seriesFiles[seriesFiles.length - 1];
  const templatePath = path.join(templatesDir, latestTemplate);
  
  console.log(`\n📋 Analyse du template: ${latestTemplate}`);
  
  const content = fs.readFileSync(templatePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log('❌ Template vide');
    return;
  }
  
  // Vérifier l'en-tête
  const header = lines[0];
  const expectedColumns = ['module_id', 'title', 'description', 'time_limit', 'slug', 'is_free'];
  const actualColumns = header.split(',');
  
  console.log(`   En-tête: ${header}`);
  console.log(`   Colonnes attendues: ${expectedColumns.join(', ')}`);
  console.log(`   Colonnes trouvées: ${actualColumns.join(', ')}`);
  
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.log(`❌ Colonnes manquantes: ${missingColumns.join(', ')}`);
    return;
  }
  
  if (extraColumns.length > 0) {
    console.log(`⚠️  Colonnes supplémentaires: ${extraColumns.join(', ')}`);
  }
  
  console.log(`✅ Format d'en-tête correct`);
  
  // 3. Vérifier les données
  const dataLines = lines.slice(1);
  console.log(`   Nombre de séries: ${dataLines.length}`);
  
  if (dataLines.length === 0) {
    console.log('❌ Aucune donnée dans le template');
    return;
  }
  
  // Vérifier quelques lignes
  const sampleLines = dataLines.slice(0, 3);
  let allValid = true;
  
  sampleLines.forEach((line, index) => {
    const columns = line.split(',');
    if (columns.length !== expectedColumns.length) {
      console.log(`❌ Ligne ${index + 2}: nombre de colonnes incorrect (${columns.length} au lieu de ${expectedColumns.length})`);
      allValid = false;
      return;
    }
    
    // Vérifier les données critiques
    const moduleId = columns[0];
    const title = columns[1].replace(/"/g, '');
    const timeLimit = columns[3];
    const slug = columns[4];
    const isFree = columns[5];
    
    if (!moduleId || moduleId.length < 10) {
      console.log(`❌ Ligne ${index + 2}: module_id invalide`);
      allValid = false;
    }
    
    if (!title || title.length < 5) {
      console.log(`❌ Ligne ${index + 2}: title invalide`);
      allValid = false;
    }
    
    if (!timeLimit || isNaN(parseInt(timeLimit))) {
      console.log(`❌ Ligne ${index + 2}: time_limit invalide`);
      allValid = false;
    }
    
    if (!slug || slug.length < 5) {
      console.log(`❌ Ligne ${index + 2}: slug invalide`);
      allValid = false;
    }
    
    if (!['true', 'false'].includes(isFree)) {
      console.log(`❌ Ligne ${index + 2}: is_free invalide (${isFree})`);
      allValid = false;
    }
  });
  
  if (allValid) {
    console.log(`✅ Échantillon de données valide`);
  }
  
  // 4. Statistiques
  console.log('\n📊 Statistiques:');
  console.log(`   Taille du fichier: ${(fs.statSync(templatePath).size / 1024).toFixed(2)} KB`);
  console.log(`   Nombre total de lignes: ${lines.length}`);
  console.log(`   Nombre de séries: ${dataLines.length}`);
  
  // 5. Recommandations
  console.log('\n💡 Recommandations pour l\'import:');
  console.log('   1. Utilisez ce template dans l\'interface admin');
  console.log('   2. Allez dans Admin → Importation → Séries de tests');
  console.log('   3. Sélectionnez le fichier et cliquez sur "Importer"');
  console.log('   4. Vérifiez les logs d\'importation');
  console.log('   5. Après l\'import, récupérez les IDs des séries pour les questions');
  
  console.log('\n✅ Template prêt pour l\'importation !');
}

// Exécuter le test
if (require.main === module) {
  testSeriesImport().catch(console.error);
}

module.exports = { testSeriesImport }; 