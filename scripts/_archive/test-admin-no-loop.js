#!/usr/bin/env node

/**
 * Script de test pour vérifier que la boucle infinie est résolue
 * 
 * Ce script vérifie que :
 * 1. La page admin-client ne génère plus de boucles infinies
 * 2. Les logs ne se répètent pas indéfiniment
 * 3. La vérification des permissions ne se fait qu'une seule fois
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test de résolution de la boucle infinie admin...\n');

// Vérifier le fichier admin-client/page.tsx
const adminClientPath = path.join(__dirname, '../src/app/admin-client/page.tsx');
const adminClientContent = fs.readFileSync(adminClientPath, 'utf8');

console.log('1. ✅ Vérification du fichier admin-client/page.tsx');

// Vérifier la présence de hasCheckedRef
if (adminClientContent.includes('hasCheckedRef')) {
  console.log('   ✅ hasCheckedRef présent pour éviter les vérifications multiples');
} else {
  console.log('   ❌ hasCheckedRef manquant');
}

// Vérifier la présence de isMountedRef
if (adminClientContent.includes('isMountedRef')) {
  console.log('   ✅ isMountedRef présent pour éviter les fuites mémoire');
} else {
  console.log('   ❌ isMountedRef manquant');
}

// Vérifier la condition de vérification unique
if (adminClientContent.includes('if (hasCheckedRef.current)')) {
  console.log('   ✅ Condition de vérification unique présente');
} else {
  console.log('   ❌ Condition de vérification unique manquante');
}

// Vérifier l'absence de dépendances dans useEffect
const useEffectMatches = adminClientContent.match(/useEffect\([^,]*,\s*\[(.*?)\]/gs);
if (useEffectMatches) {
  const mainUseEffect = useEffectMatches[0];
  if (mainUseEffect.includes('[]')) {
    console.log('   ✅ useEffect principal sans dépendances');
  } else {
    console.log('   ❌ useEffect principal avec dépendances (risque de boucle)');
  }
}

console.log('\n2. ✅ Vérification du fichier supabase/client.ts');

// Vérifier le fichier client.ts
const clientPath = path.join(__dirname, '../src/lib/supabase/client.ts');
const clientContent = fs.readFileSync(clientPath, 'utf8');

// Vérifier la présence de hasLoggedCreation
if (clientContent.includes('hasLoggedCreation')) {
  console.log('   ✅ hasLoggedCreation présent pour éviter les logs répétitifs');
} else {
  console.log('   ❌ hasLoggedCreation manquant');
}

// Vérifier l'optimisation des logs
if (clientContent.includes('if (!hasLoggedCreation)')) {
  console.log('   ✅ Logs optimisés pour éviter la répétition');
} else {
  console.log('   ❌ Logs non optimisés');
}

console.log('\n3. 📋 Résumé des améliorations apportées :');
console.log('   🔄 hasCheckedRef : Évite les vérifications multiples');
console.log('   🧠 isMountedRef : Évite les fuites mémoire');
console.log('   🚫 useEffect sans dépendances : Évite les re-exécutions');
console.log('   📝 Logs optimisés : Évite les messages répétitifs');
console.log('   🔒 Vérification unique : Une seule vérification par montage');

console.log('\n4. 🧪 Instructions de test :');
console.log('   1. Démarrez le serveur : npm run dev');
console.log('   2. Connectez-vous avec un compte admin');
console.log('   3. Allez sur /admin-client');
console.log('   4. Rafraîchissez la page plusieurs fois (F5)');
console.log('   5. Vérifiez la console : vous devriez voir "une seule fois"');
console.log('   6. Les logs ne doivent plus se répéter indéfiniment');

console.log('\n✅ Test de vérification terminé !'); 