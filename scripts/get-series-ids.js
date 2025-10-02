#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Script pour récupérer les IDs des séries après import
// et générer le template des questions avec les vrais IDs

const MODULE_ID = '1ece538c-8d39-4bea-8819-b0927dee4751';

// Sujets d'expression écrite (même ordre que dans le template des séries)
const subjects = [
  "Décrivez votre ville natale et expliquez pourquoi elle vous plaît.",
  "Racontez un souvenir d'enfance qui vous a marqué.",
  "Décrivez votre plat préféré et expliquez comment le préparer.",
  "Parlez de votre animal de compagnie ou d'un animal que vous aimeriez avoir.",
  "Décrivez une journée type de votre vie quotidienne.",
  "Parlez d'un livre ou d'un film qui vous a plu récemment.",
  "Décrivez votre saison préférée et expliquez pourquoi vous l'aimez.",
  "Parlez d'un voyage que vous avez fait ou que vous aimeriez faire.",
  "Décrivez votre métier ou celui que vous aimeriez exercer.",
  "Parlez d'une fête ou d'une célébration importante dans votre culture.",
  "Décrivez votre maison idéale et expliquez pourquoi elle vous plaît.",
  "Parlez d'un ami proche et expliquez pourquoi cette amitié est importante pour vous.",
  "Décrivez votre loisir préféré et expliquez pourquoi vous l'aimez.",
  "Parlez d'un problème environnemental qui vous préoccupe.",
  "Décrivez un repas en famille ou entre amis qui vous a marqué.",
  "Parlez d'une tradition de votre pays que vous appréciez particulièrement.",
  "Décrivez votre week-end idéal et expliquez ce que vous aimeriez faire.",
  "Parlez d'un sport que vous pratiquez ou que vous aimeriez pratiquer.",
  "Décrivez votre école ou université et ce que vous y apprenez.",
  "Parlez d'une personne qui vous inspire et expliquez pourquoi.",
  "Décrivez votre moyen de transport préféré et expliquez pourquoi.",
  "Parlez d'un événement récent qui vous a rendu heureux.",
  "Décrivez votre routine matinale et expliquez comment elle vous aide.",
  "Parlez d'un cadeau que vous avez reçu et qui vous a fait plaisir.",
  "Décrivez votre restaurant préféré et expliquez pourquoi vous l'aimez.",
  "Parlez d'une compétence que vous aimeriez apprendre et expliquez pourquoi.",
  "Décrivez votre quartier et ce que vous y appréciez le plus.",
  "Parlez d'un défi que vous avez relevé récemment et de ce que vous en avez appris.",
  "Décrivez votre façon de vous détendre après une journée difficile.",
  "Parlez d'une découverte récente qui vous a surpris ou intéressé.",
  "Décrivez votre façon de célébrer votre anniversaire.",
  "Parlez d'un changement positif que vous avez fait dans votre vie.",
  "Décrivez votre activité préférée à faire en famille.",
  "Parlez d'un conseil que vous donneriez à quelqu'un qui apprend le français.",
  "Décrivez votre façon de rester en contact avec vos amis et votre famille.",
  "Parlez d'une habitude que vous aimeriez changer et expliquez pourquoi.",
  "Décrivez votre façon de vous préparer pour un examen important.",
  "Parlez d'un endroit où vous aimez aller pour réfléchir ou vous reposer.",
  "Décrivez votre façon de gérer le stress dans votre vie quotidienne.",
  "Parlez de vos projets pour l'avenir et de ce que vous espérez accomplir."
];

function generateQuestionsWithIds(seriesIds) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `expression-ecrite-questions-with-ids-${timestamp}.csv`;
  const filepath = path.join(__dirname, '..', 'public', 'templates', filename);
  
  // En-tête CSV pour les questions
  let csvContent = 'test_series_id,question_text,type,order,media_url,media_type,points\n';
  
  // Générer les questions avec les vrais IDs
  seriesIds.forEach((seriesId, index) => {
    const subject = subjects[index % subjects.length];
    const questionText = `Rédigez un texte de 60 à 80 mots sur le sujet suivant : ${subject}`;
    
    csvContent += `${seriesId},"${questionText}",essay,1,,,10\n`;
  });
  
  // Écrire le fichier
  fs.writeFileSync(filepath, csvContent);
  console.log(`✅ Template des questions créé: ${filename}`);
  
  return filepath;
}

function generateSqlQuery() {
  console.log('\n📋 Requête SQL pour récupérer les IDs des séries:');
  console.log('```sql');
  console.log(`SELECT id, name, slug FROM test_series`);
  console.log(`WHERE module_id = '${MODULE_ID}'`);
  console.log(`ORDER BY name;`);
  console.log('```');
  
  console.log('\n📋 Requête SQL pour récupérer les IDs dans l\'ordre:');
  console.log('```sql');
  console.log(`SELECT id FROM test_series`);
  console.log(`WHERE module_id = '${MODULE_ID}'`);
  console.log(`ORDER BY CAST(SUBSTRING(name FROM 'Série ([0-9]+)') AS INTEGER);`);
  console.log('```');
}

function generateJavaScriptHelper() {
  console.log('\n💻 Code JavaScript pour récupérer les IDs via l\'API:');
  console.log('```javascript');
  console.log(`// À exécuter dans la console du navigateur sur la page admin
async function getSeriesIds() {
  try {
    const response = await fetch('/api/admin/modules-and-tests');
    const data = await response.json();
    
    if (data.success && data.testSeries) {
      const expressionSeries = data.testSeries
        .filter(series => series.module_id === '${MODULE_ID}')
        .sort((a, b) => {
          const numA = parseInt(a.name.match(/Série (\\d+)/)?.[1] || '0');
          const numB = parseInt(b.name.match(/Série (\\d+)/)?.[1] || '0');
          return numA - numB;
        });
      
      console.log('IDs des séries (dans l\\'ordre):');
      const ids = expressionSeries.map(s => s.id);
      console.log(JSON.stringify(ids, null, 2));
      
      return ids;
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
getSeriesIds();`);
  console.log('```');
}

function showInstructions() {
  console.log('\n📚 Instructions complètes:');
  console.log('='.repeat(50));
  
  console.log('\n1️⃣ ÉTAPE 1: Importer les séries');
  console.log('   - Utilisez le template: expression-ecrite-series-template.csv');
  console.log('   - Dans Admin → Importation → Séries de tests');
  console.log('   - Vérifiez que les 40 séries sont importées');
  
  console.log('\n2️⃣ ÉTAPE 2: Récupérer les IDs des séries');
  console.log('   - Option A: Utilisez la requête SQL ci-dessus');
  console.log('   - Option B: Utilisez le code JavaScript dans la console');
  console.log('   - Option C: Consultez l\'onglet "Séries de tests" dans l\'admin');
  
  console.log('\n3️⃣ ÉTAPE 3: Générer le template des questions');
  console.log('   - Exécutez: node scripts/get-series-ids.js --generate-questions');
  console.log('   - Ou utilisez manuellement les IDs avec ce script');
  
  console.log('\n4️⃣ ÉTAPE 4: Importer les questions');
  console.log('   - Utilisez le template généré des questions');
  console.log('   - Dans Admin → Importation → Questions');
  console.log('   - Vérifiez que les 40 questions sont importées');
}

// Gestion des arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(`
Usage: node get-series-ids.js [options]

Options:
  --generate-questions [ids]  Générer le template des questions avec les IDs fournis
  --sql                      Afficher seulement la requête SQL
  --javascript              Afficher seulement le code JavaScript
  --help, -h                 Afficher cette aide

Exemples:
  node get-series-ids.js
  node get-series-ids.js --sql
  node get-series-ids.js --generate-questions "id1,id2,id3,..."
        `);
        process.exit(0);
        break;
      case '--generate-questions':
        const idsString = args[++i];
        if (idsString) {
          const ids = idsString.split(',').map(id => id.trim());
          if (ids.length > 0) {
            generateQuestionsWithIds(ids);
            return;
          }
        }
        console.log('❌ Veuillez fournir les IDs des séries séparés par des virgules');
        process.exit(1);
        break;
      case '--sql':
        generateSqlQuery();
        return;
      case '--javascript':
        generateJavaScriptHelper();
        return;
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    parseArgs();
  } else {
    console.log('🔍 Récupération des IDs des séries Expression Écrite');
    console.log('='.repeat(50));
    
    generateSqlQuery();
    generateJavaScriptHelper();
    showInstructions();
  }
}

module.exports = {
  generateQuestionsWithIds,
  generateSqlQuery,
  generateJavaScriptHelper
}; 