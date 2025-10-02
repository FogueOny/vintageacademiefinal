#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Correction automatique des erreurs ESLint...\n');

// Fichiers à corriger automatiquement
const filesToFix = [
  'src/components/ui/separator.tsx',
  'src/components/ui/textarea.tsx', 
  'src/components/ui/use-toast.ts',
  'src/components/whatsapp-button.tsx',
  'src/hooks/use-toast.ts'
];

// Corrections automatiques
const fixes = {
  // Remplacer les interfaces vides
  'interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {}': 
    'type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>',
    
  'interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}':
    'type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>',
    
  // Corriger les apostrophes
  "d'expression": "d&apos;expression",
  "l'examen": "l&apos;examen",
  
  // Supprimer les imports inutilisés
  "import { useEffect } from 'react';\n": "",
  "import React, { useEffect } from 'react';": "import React from 'react';",
  
  // Préfixer les variables inutilisées avec _
  'const { error }': 'const { error: _error }',
  'const { data }': 'const { data: _data }',
  '(error)': '(_error)',
  '(data)': '(_data)'
};

function applyFixes() {
  let totalFixed = 0;
  
  filesToFix.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let fileFixed = 0;
    
    Object.entries(fixes).forEach(([search, replace]) => {
      if (content.includes(search)) {
        content = content.replace(new RegExp(search, 'g'), replace);
        fileFixed++;
        totalFixed++;
      }
    });
    
    if (fileFixed > 0) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ ${filePath}: ${fileFixed} corrections appliquées`);
    }
  });
  
  console.log(`\n🎉 Total: ${totalFixed} corrections appliquées`);
}

function runEslintFix() {
  try {
    console.log('\n🔧 Exécution de ESLint --fix...');
    execSync('npm run lint -- --fix', { stdio: 'inherit' });
    console.log('✅ ESLint --fix terminé');
  } catch (error) {
    console.log('⚠️  ESLint --fix terminé avec des erreurs restantes');
  }
}

// Exécution
applyFixes();
runEslintFix();

console.log('\n📊 Vérification finale...');
try {
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('🎉 Aucune erreur ESLint restante !');
} catch (error) {
  console.log('⚠️  Des erreurs ESLint persistent. Vérifiez manuellement.');
}
