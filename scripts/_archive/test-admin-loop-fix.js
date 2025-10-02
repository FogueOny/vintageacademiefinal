#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction de la boucle infinie dans admin-client
 */

const fs = require('fs');

console.log('🔄 Test de correction de la boucle infinie admin-client...\n');

// Vérifier que les fichiers existent
const filesToCheck = [
  'src/app/admin-client/page.tsx',
  'src/components/layout/header.tsx'
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

// Vérifier les corrections dans admin-client/page.tsx
const adminClientPath = 'src/app/admin-client/page.tsx';
const adminClientContent = fs.readFileSync(adminClientPath, 'utf8');

const adminClientChecks = [
  {
    name: 'useEffect sans dépendances',
    pattern: /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/,
    description: 'Le useEffect n\'a pas de dépendances pour éviter les boucles'
  },
  {
    name: 'Variable isMounted',
    pattern: /let isMounted = true/,
    description: 'Utilisation de isMounted pour éviter les fuites mémoire'
  },
  {
    name: 'Logs de débogage simplifiés',
    pattern: /console\.log\("🔍 Vérification du rôle admin\.\.\."\)/,
    description: 'Logs de débogage simplifiés ajoutés'
  },
  {
    name: 'Gestion d\'erreur améliorée',
    pattern: /const \[error, setError\] = useState<string \| null>\(null\)/,
    description: 'État d\'erreur ajouté pour une meilleure gestion'
  },
  {
    name: 'Cleanup function',
    pattern: /return \(\) => \{\s*isMounted = false;\s*\}/,
    description: 'Fonction de nettoyage pour éviter les fuites mémoire'
  }
];

console.log('\n🔧 Vérification des corrections dans admin-client/page.tsx:');

let allAdminClientChecksPassed = true;

adminClientChecks.forEach(check => {
  if (check.pattern.test(adminClientContent)) {
    console.log(`✅ ${check.name} - ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - ${check.description}`);
    allAdminClientChecksPassed = false;
  }
});

// Vérifier les corrections dans header.tsx
const headerPath = 'src/components/layout/header.tsx';
const headerContent = fs.readFileSync(headerPath, 'utf8');

const headerChecks = [
  {
    name: 'Image avec priority',
    pattern: /priority/,
    description: 'L\'image du logo a la propriété priority'
  },
  {
    name: 'Style d\'image correct',
    pattern: /style=\{\{ width: 'auto', height: '50px' \}\}/,
    description: 'L\'image a les styles appropriés'
  }
];

console.log('\n🔧 Vérification des corrections dans header.tsx:');

let allHeaderChecksPassed = true;

headerChecks.forEach(check => {
  if (check.pattern.test(headerContent)) {
    console.log(`✅ ${check.name} - ${check.description}`);
  } else {
    console.log(`❌ ${check.name} - ${check.description}`);
    allHeaderChecksPassed = false;
  }
});

// Vérifier les anti-patterns (ce qui ne devrait PAS être présent)
const antiPatterns = [
  {
    name: 'Dépendance router dans useEffect',
    pattern: /useEffect\([\s\S]*?\[router\]/,
    description: 'Le useEffect ne devrait pas dépendre de router'
  },
  {
    name: 'Logs excessifs',
    pattern: /console\.log.*admin-client.*admin-client/,
    description: 'Pas de logs redondants'
  }
];

console.log('\n🚫 Vérification des anti-patterns:');

let noAntiPatterns = true;

antiPatterns.forEach(check => {
  if (check.pattern.test(adminClientContent)) {
    console.log(`❌ ${check.name} - ${check.description} (TROUVÉ - À CORRIGER)`);
    noAntiPatterns = false;
  } else {
    console.log(`✅ ${check.name} - ${check.description} (ABSENT - BIEN)`);
  }
});

// Résumé
console.log('\n📊 Résumé des tests:');

if (allAdminClientChecksPassed && allHeaderChecksPassed && noAntiPatterns) {
  console.log('✅ Toutes les corrections pour la boucle infinie ont été appliquées');
  console.log('\n🎯 Instructions de test:');
  console.log('1. Redémarrez le serveur de développement');
  console.log('2. Connectez-vous en tant qu\'admin');
  console.log('3. Allez sur /admin-client');
  console.log('4. Actualisez la page plusieurs fois');
  console.log('5. Vérifiez que la page se charge normalement');
  
  console.log('\n🔍 Vérifications à faire:');
  console.log('- La page ne tourne plus en boucle');
  console.log('- Les logs sont clairs et non répétitifs');
  console.log('- Pas d\'avertissement d\'image dans la console');
  console.log('- L\'interface admin se charge correctement');
  
  console.log('\n💡 Logs attendus dans la console:');
  console.log('🔍 Vérification du rôle admin...');
  console.log('✅ Session trouvée pour: [email]');
  console.log('👤 Rôle utilisateur: admin');
  console.log('✅ Accès admin autorisé');
  
} else {
  console.log('❌ Certaines corrections sont manquantes');
  console.log('\n🔧 Actions à effectuer:');
  console.log('1. Vérifiez que tous les fichiers ont été modifiés');
  console.log('2. Relancez le script après avoir appliqué les corrections');
  console.log('3. Vérifiez la syntaxe TypeScript');
}

console.log('\n✨ Test terminé'); 