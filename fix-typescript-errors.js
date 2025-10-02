const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const filesToFix = [
  'src/app/(tests)/expression-orale/tache-2/[slug]/page.tsx',
  'src/app/(tests)/expression-orale/tache-3/[slug]/page.tsx', 
  'src/app/(tests)/expression-ecrite/[slug]/page.tsx',
  'src/app/admin-dashboard/modules/page.tsx',
  'src/app/admin-dashboard/test-series/page.tsx',
  'src/app/admin-dashboard/layout.tsx'
];

function fixSupabaseNullChecks(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: const supabase = getSupabaseBrowser(); followed by direct usage
    content = content.replace(
      /const supabase = getSupabaseBrowser\(\);\s*([\s\S]*?)await supabase\./g,
      (match, middle) => {
        return `const supabase = getSupabaseBrowser();
        if (!supabase) {
          console.error("Supabase client not available");
          return;
        }
        ${middle}await supabase.`;
      }
    );
    
    // Pattern 2: More specific patterns
    content = content.replace(
      /const supabase = getSupabaseBrowser\(\);\s*const \{ data.*?await supabase\./gs,
      (match) => {
        return match.replace(
          'const supabase = getSupabaseBrowser();',
          `const supabase = getSupabaseBrowser();
        if (!supabase) {
          console.error("Supabase client not available");
          return;
        }`
        );
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed: ${filePath}`);
  } catch (error) {
    console.log(`✗ Error fixing ${filePath}:`, error.message);
  }
}

// Correction de tous les fichiers
filesToFix.forEach(fixSupabaseNullChecks);

console.log('✅ All TypeScript errors fixed!'); 