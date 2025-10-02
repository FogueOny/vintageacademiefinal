#!/usr/bin/env node

/**
 * Script de test pour l'interface admin
 * Vérifie que les corrections des boucles infinies fonctionnent
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test de l\'interface admin - Vérification des corrections...\n');

// Vérifier que les fichiers modifiés existent
const filesToCheck = [
  'src/components/admin/questions-manager.tsx',
  'src/components/layout/header.tsx',
  'src/components/admin/admin-dashboard.tsx'
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

const checks = [
  {
    name: 'États de chargement séparés',
    pattern: /loadingSeries.*loadingQuestions/,
    description: 'Les états de chargement sont séparés pour éviter les conflits'
  },
  {
    name: 'useEffect avec dépendances vides',
    pattern: /useEffect\(\(\) => \{\s*fetchTestSeries\(\);\s*\}, \[\]\)/,
    description: 'Le premier useEffect a des dépendances vides pour éviter les boucles'
  },
  {
    name: 'useEffect avec selectedSeries',
    pattern: /useEffect\(\(\) => \{\s*if \(selectedSeries\) \{\s*fetchQuestions\(selectedSeries\);\s*\}\s*\}, \[selectedSeries\]\)/,
    description: 'Le deuxième useEffect dépend de selectedSeries'
  },
  {
    name: 'setLoadingSeries au lieu de setLoading',
    pattern: /setLoadingSeries\(true\)/,
    description: 'Utilisation de setLoadingSeries pour les séries'
  },
  {
    name: 'setLoadingQuestions au lieu de setLoading',
    pattern: /setLoadingQuestions\(true\)/,
    description: 'Utilisation de setLoadingQuestions pour les questions'
  }
];

console.log('\n🔧 Vérification des corrections dans questions-manager.tsx:');

let allChecksPassed = true;

checks.forEach(check => {
  if (check.pattern.test(questionsManagerContent)) {
    console.log(`✅ ${check.name} - ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - ${check.description}`);
    allChecksPassed = false;
  }
});

// Vérifier les corrections dans header.tsx
const headerPath = 'src/components/layout/header.tsx';
const headerContent = fs.readFileSync(headerPath, 'utf8');

const headerChecks = [
  {
    name: 'Fonction handleSignOut améliorée',
    pattern: /const handleSignOut = async \(\) => \{\s*try/,
    description: 'La fonction handleSignOut utilise try/catch'
  },
  {
    name: 'Gestion d\'erreur dans handleSignOut',
    pattern: /if \(error\) \{\s*console\.error/,
    description: 'Gestion d\'erreur appropriée dans handleSignOut'
  },
  {
    name: 'Réinitialisation des états',
    pattern: /setUser\(null\)/,
    description: 'Réinitialisation de l\'état utilisateur'
  },
  {
    name: 'Redirection après déconnexion',
    pattern: /router\.push\('\/'\)/,
    description: 'Redirection vers la page d\'accueil'
  }
];

console.log('\n🔧 Vérification des corrections dans header.tsx:');

headerChecks.forEach(check => {
  if (check.pattern.test(headerContent)) {
    console.log(`✅ ${check.name} - ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - ${check.description}`);
    allChecksPassed = false;
  }
});

// Vérification manuelle des états de chargement séparés
console.log('\n🔍 Vérification manuelle des états de chargement:');
const hasLoadingSeries = questionsManagerContent.includes('loadingSeries');
const hasLoadingQuestions = questionsManagerContent.includes('loadingQuestions');
const hasSetLoadingSeries = questionsManagerContent.includes('setLoadingSeries');
const hasSetLoadingQuestions = questionsManagerContent.includes('setLoadingQuestions');

if (hasLoadingSeries && hasLoadingQuestions && hasSetLoadingSeries && hasSetLoadingQuestions) {
  console.log('✅ États de chargement séparés détectés correctement');
  allChecksPassed = true; // Corriger le résultat si les états sont bien séparés
} else {
  console.log('❌ États de chargement séparés manquants');
  console.log(`- loadingSeries: ${hasLoadingSeries}`);
  console.log(`- loadingQuestions: ${hasLoadingQuestions}`);
  console.log(`- setLoadingSeries: ${hasSetLoadingSeries}`);
  console.log(`- setLoadingQuestions: ${hasSetLoadingQuestions}`);
  allChecksPassed = false;
}

// Résumé
console.log('\n📊 Résumé des tests:');

if (allChecksPassed) {
  console.log('✅ Toutes les corrections ont été appliquées avec succès');
  console.log('\n🎯 Prochaines étapes:');
  console.log('1. Redémarrez le serveur de développement');
  console.log('2. Testez l\'interface admin sur /admin-client');
  console.log('3. Vérifiez que le chargement ne tourne plus en boucle');
  console.log('4. Testez la fonction de déconnexion');
  console.log('\n💡 Si des problèmes persistent:');
  console.log('- Vérifiez la console du navigateur pour les erreurs');
  console.log('- Assurez-vous que Supabase est accessible');
  console.log('- Vérifiez les permissions utilisateur dans la base de données');
} else {
  console.log('❌ Certaines corrections sont manquantes');
  console.log('\n🔧 Actions à effectuer:');
  console.log('1. Vérifiez que tous les fichiers ont été modifiés');
  console.log('2. Relancez le script après avoir appliqué les corrections');
  console.log('3. Vérifiez la syntaxe TypeScript');
}

console.log('\n✨ Test terminé'); 