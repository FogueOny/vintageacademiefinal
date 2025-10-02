#!/usr/bin/env node

/**
 * Script de test pour la création de questions
 * Vérifie que les corrections permettent la création sans blocage
 */

const fs = require('fs');

console.log('🧪 Test de création de questions - Vérification des corrections...\n');

// Vérifier que les nouveaux fichiers existent
const filesToCheck = [
  'src/components/admin/question-form-simple.tsx',
  'src/components/admin/questions-manager.tsx'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Fichier trouvé`);
  } else {
    console.log(`❌ ${file} - Fichier manquant`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Certains fichiers sont manquants');
  process.exit(1);
}

// Vérifier les corrections dans questions-manager.tsx
const questionsManagerPath = 'src/components/admin/questions-manager.tsx';
const questionsManagerContent = fs.readFileSync(questionsManagerPath, 'utf8');

const managerChecks = [
  {
    name: 'Import QuestionFormSimple',
    pattern: /import.*QuestionFormSimple.*from.*question-form-simple/,
    description: 'Le nouveau composant simplifié est importé'
  },
  {
    name: 'Fonction handleSubmit simplifiée',
    pattern: /🚀 Début de handleSubmit - Version simplifiée/,
    description: 'La fonction handleSubmit a été simplifiée'
  },
  {
    name: 'Logs de débogage ajoutés',
    pattern: /console\.log.*✅.*Session utilisateur valide/,
    description: 'Des logs de débogage ont été ajoutés'
  },
  {
    name: 'Gestion d\'erreur améliorée',
    pattern: /console\.error.*❌.*Pas de session utilisateur/,
    description: 'La gestion d\'erreur a été améliorée'
  },
  {
    name: 'Utilisation de QuestionFormSimple',
    pattern: /<QuestionFormSimple/,
    description: 'Le composant QuestionFormSimple est utilisé'
  }
];

console.log('\n🔧 Vérification des corrections dans questions-manager.tsx:');

let allManagerChecksPassed = true;

managerChecks.forEach(check => {
  if (check.pattern.test(questionsManagerContent)) {
    console.log(`✅ ${check.name} - ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - ${check.description}`);
    allManagerChecksPassed = false;
  }
});

// Vérifier le nouveau composant QuestionFormSimple
const questionFormSimplePath = 'src/components/admin/question-form-simple.tsx';
const questionFormSimpleContent = fs.readFileSync(questionFormSimplePath, 'utf8');

const formChecks = [
  {
    name: 'Interface simplifiée',
    pattern: /interface QuestionFormSimpleProps/,
    description: 'Interface props simplifiée définie'
  },
  {
    name: 'Gestion des étapes simplifiée',
    pattern: /currentStep === "question"/,
    description: 'Gestion des étapes simplifiée'
  },
  {
    name: 'Logs de débogage dans formulaire',
    pattern: /console\.log.*📝 Soumission du formulaire/,
    description: 'Logs de débogage ajoutés dans le formulaire'
  },
  {
    name: 'Interface utilisateur améliorée',
    pattern: /bg-blue-600.*hover:bg-blue-700/,
    description: 'Interface utilisateur améliorée'
  }
];

console.log('\n🔧 Vérification du nouveau composant QuestionFormSimple:');

let allFormChecksPassed = true;

formChecks.forEach(check => {
  if (check.pattern.test(questionFormSimpleContent)) {
    console.log(`✅ ${check.name} - ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - ${check.description}`);
    allFormChecksPassed = false;
  }
});

// Résumé
console.log('\n📊 Résumé des tests:');

if (allManagerChecksPassed && allFormChecksPassed) {
  console.log('✅ Toutes les corrections pour la création de questions ont été appliquées');
  console.log('\n🎯 Instructions de test:');
  console.log('1. Redémarrez le serveur de développement');
  console.log('2. Connectez-vous en tant qu\'admin');
  console.log('3. Allez sur /admin-client');
  console.log('4. Cliquez sur l\'onglet "Questions"');
  console.log('5. Sélectionnez une série de tests');
  console.log('6. Cliquez sur "Ajouter une question"');
  console.log('7. Remplissez le formulaire et testez l\'enregistrement');
  
  console.log('\n🔍 Vérifications à faire:');
  console.log('- Le bouton ne reste pas bloqué sur "Traitement..."');
  console.log('- L\'étape passe de "Question" à "Finalisation"');
  console.log('- La question apparaît dans la liste après création');
  console.log('- Pas d\'erreurs dans la console du navigateur');
  
  console.log('\n💡 Si des problèmes persistent:');
  console.log('- Vérifiez la console du navigateur (F12)');
  console.log('- Assurez-vous d\'avoir sélectionné une série de tests');
  console.log('- Vérifiez que vous êtes bien connecté en tant qu\'admin');
  console.log('- Consultez les logs du serveur pour les erreurs Supabase');
} else {
  console.log('❌ Certaines corrections sont manquantes');
  console.log('\n🔧 Actions à effectuer:');
  console.log('1. Vérifiez que tous les fichiers ont été créés/modifiés');
  console.log('2. Relancez le script après avoir appliqué les corrections');
  console.log('3. Vérifiez la syntaxe TypeScript');
}

console.log('\n✨ Test terminé'); 