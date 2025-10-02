#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration par défaut
const defaultConfig = {
  moduleId: '1ece538c-8d39-4bea-8819-b0927dee4751',
  seriesCount: 40,
  timeLimit: 3600, // 60 minutes en secondes
  isFree: true,
  points: 10
};

// Sujets d'expression écrite variés
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

function generateSeriesTemplate(config = defaultConfig) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `expression-ecrite-series-${timestamp}.csv`;
  const filepath = path.join(__dirname, '..', 'public', 'templates', filename);
  
  // En-tête CSV pour les séries de tests (format attendu par l'API)
  let csvContent = 'module_id,title,description,time_limit,slug,is_free\n';
  
  // Générer les séries
  for (let i = 1; i <= config.seriesCount; i++) {
    const seriesName = `Expression Écrite - Série ${i}`;
    const description = `Série de tests d'expression écrite numéro ${i}`;
    const slug = `expression-ecrite-serie-${i}`;
    
    csvContent += `${config.moduleId},"${seriesName}","${description}",${config.timeLimit},${slug},${config.isFree}\n`;
  }
  
  // Écrire le fichier
  fs.writeFileSync(filepath, csvContent);
  console.log(`✅ Template des séries créé: ${filename}`);
  
  return filepath;
}

function generateQuestionsTemplate(config = defaultConfig) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `expression-ecrite-questions-${timestamp}.csv`;
  const filepath = path.join(__dirname, '..', 'public', 'templates', filename);
  
  // En-tête CSV pour les questions (format attendu par l'API)
  let csvContent = 'test_series_id,question_text,type,order,media_url,media_type,points\n';
  
  // Générer les questions (une par série)
  for (let i = 1; i <= config.seriesCount; i++) {
    const subject = subjects[(i - 1) % subjects.length];
    const questionText = `Rédigez un texte de 60 à 80 mots sur le sujet suivant : ${subject}`;
    
    // Utiliser un placeholder pour l'ID de série (à remplacer après import des séries)
    csvContent += `{SERIES_ID_${i}},"${questionText}",essay,1,,,${config.points}\n`;
  }
  
  // Écrire le fichier
  fs.writeFileSync(filepath, csvContent);
  console.log(`✅ Template des questions créé: ${filename}`);
  console.log(`⚠️  Note: Remplacez les {SERIES_ID_X} par les vrais IDs après import des séries`);
  
  return filepath;
}

function generateBothTemplates(config = defaultConfig) {
  console.log('🚀 Génération des templates Expression Écrite...');
  console.log(`📋 Configuration:
  - Module ID: ${config.moduleId}
  - Nombre de séries: ${config.seriesCount}
  - Durée par test: ${config.timeLimit} secondes (${config.timeLimit / 60} minutes)
  - Accès gratuit: ${config.isFree}
  - Points par question: ${config.points}
  `);
  
  const seriesFile = generateSeriesTemplate(config);
  const questionsFile = generateQuestionsTemplate(config);
  
  console.log('\n📚 Instructions d\'utilisation:');
  console.log('1. Importez d\'abord les séries avec le fichier des séries');
  console.log('2. Récupérez les IDs des séries créées');
  console.log('3. Remplacez les {SERIES_ID_X} dans le fichier des questions');
  console.log('4. Importez ensuite les questions');
  
  return { seriesFile, questionsFile };
}

// Gestion des arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...defaultConfig };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(`
Usage: node generate-expression-ecrite-template.js [options]

Options:
  --module-id <id>     ID du module (défaut: ${defaultConfig.moduleId})
  --count <number>     Nombre de séries à générer (défaut: ${defaultConfig.seriesCount})
  --time <seconds>     Durée limite en secondes (défaut: ${defaultConfig.timeLimit})
  --free <true/false>  Accès gratuit (défaut: ${defaultConfig.isFree})
  --points <number>    Points par question (défaut: ${defaultConfig.points})
  --series-only        Générer seulement le template des séries
  --questions-only     Générer seulement le template des questions
  --help, -h           Afficher cette aide

Exemples:
  node generate-expression-ecrite-template.js
  node generate-expression-ecrite-template.js --count 20 --time 1800
  node generate-expression-ecrite-template.js --module-id "autre-id" --free false
        `);
        process.exit(0);
        break;
      case '--module-id':
        config.moduleId = args[++i];
        break;
      case '--count':
        config.seriesCount = parseInt(args[++i]);
        break;
      case '--time':
        config.timeLimit = parseInt(args[++i]);
        break;
      case '--free':
        config.isFree = args[++i] === 'true';
        break;
      case '--points':
        config.points = parseInt(args[++i]);
        break;
      case '--series-only':
        return { ...config, questionsOnly: false, seriesOnly: true };
      case '--questions-only':
        return { ...config, questionsOnly: true, seriesOnly: false };
    }
  }
  
  return config;
}

// Exécution si appelé directement
if (require.main === module) {
  const config = parseArgs();
  
  if (config.seriesOnly) {
    generateSeriesTemplate(config);
  } else if (config.questionsOnly) {
    generateQuestionsTemplate(config);
  } else {
    generateBothTemplates(config);
  }
}

module.exports = {
  generateSeriesTemplate,
  generateQuestionsTemplate,
  generateBothTemplates
}; 