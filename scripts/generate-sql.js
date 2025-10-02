const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

/**
 * Générateur de script SQL pour l'importation de données Expression Écrite TCF
 * Usage: node generate-sql.js <periodId> <url>
 * Exemple: node generate-sql.js 22696eb8-6fc9-41a4-8744-b6fa94116cd5 https://formation-tcfcanada.com/expression-ecrite-mars-2025/
 */

// Récupération des arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node generate-sql.js <periodId> <url>');
  process.exit(1);
}

const periodId = args[0];
const url = args[1];

// Déterminer le mois et l'année à partir de l'URL
const urlParts = url.split('/');
const pageSlug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
const [type, month, year] = pageSlug.split('-');

console.log(`🔍 Génération SQL pour la période: ${month} ${year}`);
console.log(`📄 URL source: ${url}`);
console.log(`🔑 ID de période: ${periodId}`);

// Structure pour stocker les données extraites
const combinationsData = [];

/**
 * Génère un UUID unique avec un préfixe pour traçabilité
 */
function generateUUID(prefix) {
  return `${prefix}-${uuidv4()}`;
}

/**
 * Nettoie et formate le texte
 */
function cleanText(text) {
  return text
    .replace(/'/g, "''") // Échapper les apostrophes pour SQL
    .trim();
}

/**
 * Détermine le type et niveau de difficulté en fonction du numéro de tâche
 */
function getTaskTypeAndDifficulty(taskNumber) {
  switch (taskNumber) {
    case 1:
      return {
        type: 'correspondance',
        difficulty: 'beginner',
        wordMin: 60,
        wordMax: 80
      };
    case 2:
      return {
        type: 'narration',
        difficulty: 'intermediate',
        wordMin: 80,
        wordMax: 100
      };
    case 3:
      return {
        type: 'argumentation',
        difficulty: 'advanced',
        wordMin: 120,
        wordMax: 180
      };
    default:
      return {
        type: 'autre',
        difficulty: 'intermediate',
        wordMin: 80,
        wordMax: 100
      };
  }
}

/**
 * Extrait un titre court à partir de la description
 */
function extractTitle(description, taskNumber) {
  // Si la description est courte, l'utiliser comme titre
  if (description.length < 40) {
    return description;
  }
  
  // Sinon, extraire les premiers mots significatifs
  let title = description.split('.')[0];
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  
  // Fallback si aucun titre valide n'est extrait
  if (!title || title.length < 5) {
    return `Tâche ${taskNumber}`;
  }
  
  return title;
}

/**
 * Génère les instructions en fonction du type de tâche
 */
function generateInstructions(taskNumber, description) {
  switch (taskNumber) {
    case 1:
      return 'Répondez au message en respectant la limite de mots et en incluant tous les éléments demandés.';
    case 2:
      return 'Racontez votre expérience de façon structurée avec une introduction, un développement et une conclusion.';
    case 3:
      return 'Présentez les arguments pour et contre, puis donnez votre opinion personnelle sur ce sujet.';
    default:
      return '';
  }
}

/**
 * Récupère et analyse la page web
 */
async function scrapePage() {
  try {
    console.log('⏳ Téléchargement de la page en cours...');
    const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://formation-tcfcanada.com/',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-platform': '"macOS"'
    }
  });
    const $ = cheerio.load(response.data);
    
    console.log('✅ Page téléchargée avec succès');
    console.log('🔍 Analyse du contenu...');
    
    // Recherche des combinaisons
    const combinationHeaders = $('h1:contains("Combinaison")');
    console.log(`📊 Nombre de combinaisons détectées: ${combinationHeaders.length}`);
    
    // Pour chaque combinaison
    combinationHeaders.each(function() {
      const combinationHeader = $(this);
      const combinationTitle = combinationHeader.text().trim();
      const combinationNumber = parseInt(combinationTitle.match(/\d+/)[0]);
      
      console.log(`🔄 Traitement de la combinaison ${combinationNumber}`);
      
      const tasks = [];
      let currentTask = null;
      let documents = [];
      
      // Recherche les tâches dans cette combinaison
      const taskHeaders = combinationHeader.nextUntil('h1', 'h2:contains("Tâche")');
      
      taskHeaders.each(function() {
        const taskHeader = $(this);
        const taskTitle = taskHeader.text().trim();
        const taskNumberMatch = taskTitle.match(/\d+/);
        
        if (!taskNumberMatch) return;
        
        const taskNumber = parseInt(taskNumberMatch[0]);
        let description = '';
        
        // Récupérer le contenu jusqu'à la prochaine tâche ou combinaison
        let nextEl = taskHeader.next();
        while (nextEl.length && !nextEl.is('h1') && !nextEl.is('h2') && !nextEl.is('h3')) {
          description += nextEl.text().trim() + ' ';
          nextEl = nextEl.next();
        }
        
        description = cleanText(description);
        
        // Si c'est la tâche 3, chercher les documents associés
        if (taskNumber === 3) {
          documents = [];
          
          // Chercher les documents (qui sont généralement sous des h3)
          const documentHeaders = $(taskHeader).nextUntil('h2, h1', 'h3:contains("Document")');
          
          documentHeaders.each(function(index) {
            const docHeader = $(this);
            const docNumber = index + 1;
            let docContent = '';
            
            // Récupérer le contenu du document
            let nextDocEl = docHeader.next();
            while (nextDocEl.length && !nextDocEl.is('h1') && !nextDocEl.is('h2') && !nextDocEl.is('h3')) {
              docContent += nextDocEl.text().trim() + ' ';
              nextDocEl = nextDocEl.next();
            }
            
            docContent = cleanText(docContent);
            
            // Extraire un titre court pour le document
            const docTitle = docContent.split('.')[0].substring(0, 50);
            
            documents.push({
              documentNumber: docNumber,
              title: docTitle,
              content: docContent
            });
          });
        }
        
        // Ajouter la tâche au tableau
        tasks.push({
          taskNumber,
          description,
          documents: taskNumber === 3 ? documents : []
        });
      });
      
      // Ajouter la combinaison complète
      if (tasks.length > 0) {
        combinationsData.push({
          combinationNumber,
          title: `Combinaison ${combinationNumber}`,
          tasks
        });
      }
    });
    
    console.log(`✅ Analyse terminée: ${combinationsData.length} combinaisons traitées`);
    generateSQL();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse de la page:', error.message);
    process.exit(1);
  }
}

/**
 * Génère le script SQL à partir des données récupérées
 */
function generateSQL() {
  console.log('📝 Génération du script SQL...');
  
  let sqlContent = `-- Script d'importation des données pour Expression Écrite ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}
-- Date de création: ${new Date().toLocaleDateString()}
-- ID de la période: ${periodId}

-- Note: Les UUID utilisés dans ce script sont générés automatiquement.
-- Vous pouvez les remplacer si nécessaire.

`;

  // Pour chaque combinaison
  combinationsData.forEach(combination => {
    const combinationUUID = generateUUID(`c${combination.combinationNumber}`);
    
    sqlContent += `-- ======================================================================================
-- COMBINAISON ${combination.combinationNumber}
-- ======================================================================================
INSERT INTO expression_ecrite_combinations (id, period_id, combination_number, title, is_active, created_at, updated_at)
VALUES 
('${combinationUUID}', '${periodId}', ${combination.combinationNumber}, '${combination.title}', true, NOW(), NOW());

-- Tâches pour Combinaison ${combination.combinationNumber}
INSERT INTO expression_ecrite_tasks (id, combination_id, task_number, title, description, word_count_min, word_count_max, 
  task_type, duration_minutes, difficulty_level, instructions, created_at, updated_at)
VALUES\n`;

    // Pour chaque tâche de la combinaison
    combination.tasks.forEach((task, taskIndex) => {
      const taskUUID = generateUUID(`t${task.taskNumber}-c${combination.combinationNumber}`);
      const { type, difficulty, wordMin, wordMax } = getTaskTypeAndDifficulty(task.taskNumber);
      const title = extractTitle(task.description, task.taskNumber);
      const instructions = generateInstructions(task.taskNumber, task.description);
      
      sqlContent += `-- Tâche ${task.taskNumber}
('${taskUUID}', '${combinationUUID}', ${task.taskNumber}, '${title}', 
'${task.description}', 
${wordMin}, ${wordMax}, '${type}', 20, '${difficulty}', '${instructions}', NOW(), NOW())`;
      
      // Ajouter une virgule si ce n'est pas la dernière tâche
      sqlContent += taskIndex < combination.tasks.length - 1 ? ',\n\n' : ';\n\n';
      
      // Si la tâche a des documents, les ajouter
      if (task.documents && task.documents.length > 0) {
        sqlContent += `-- Documents pour Tâche ${task.taskNumber} Combinaison ${combination.combinationNumber}
INSERT INTO expression_ecrite_documents (id, task_id, document_number, title, content, document_type, created_at, updated_at)
VALUES\n`;

        task.documents.forEach((doc, docIndex) => {
          const docUUID = generateUUID(`d${doc.documentNumber}-t${task.taskNumber}-c${combination.combinationNumber}`);
          
          sqlContent += `-- Document ${doc.documentNumber}
('${docUUID}', '${taskUUID}', ${doc.documentNumber}, '${doc.title}', 
'${doc.content}', 
'support', NOW(), NOW())`;
          
          // Ajouter une virgule si ce n'est pas le dernier document
          sqlContent += docIndex < task.documents.length - 1 ? ',\n\n' : ';\n\n';
        });
      }
    });
    
    sqlContent += '\n';
  });
  
  // Instructions finales
  sqlContent += `-- ======================================================================================
-- FIN DU SCRIPT D'IMPORTATION
-- ======================================================================================
-- Nombre total de combinaisons: ${combinationsData.length}
-- Nombre total de tâches: ${combinationsData.reduce((sum, c) => sum + c.tasks.length, 0)}
-- Nombre total de documents: ${combinationsData.reduce((sum, c) => sum + c.tasks.reduce((docSum, t) => docSum + (t.documents ? t.documents.length : 0), 0), 0)}

-- Exécuté avec succès le ${new Date().toLocaleString()}
`;

  // Écrire le fichier SQL
  const outputFile = path.join(process.cwd(), `import-expression-ecrite-${month}-${year}.sql`);
  fs.writeFileSync(outputFile, sqlContent, 'utf8');
  
  console.log(`✅ Script SQL généré avec succès: ${outputFile}`);
  console.log(`📊 Statistiques:`);
  console.log(`   - Combinaisons: ${combinationsData.length}`);
  console.log(`   - Tâches: ${combinationsData.reduce((sum, c) => sum + c.tasks.length, 0)}`);
  console.log(`   - Documents: ${combinationsData.reduce((sum, c) => sum + c.tasks.reduce((docSum, t) => docSum + (t.documents ? t.documents.length : 0), 0), 0)}`);
}

// Exécuter le script
scrapePage();
