const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction pour détecter le type de média à partir de l'URL
function detectMediaType(mediaUrl) {
  if (!mediaUrl) return null;
  
  const url = mediaUrl.toLowerCase();
  
  // Extensions audio
  if (url.includes('/audio/') || url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/)) {
    return 'audio';
  }
  
  // Extensions vidéo  
  if (url.includes('/video/') || url.match(/\.(mp4|webm|ogv|avi|mov|wmv)(\?|$)/)) {
    return 'video';
  }
  
  // Extensions image
  if (url.includes('/image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/)) {
    return 'image';
  }
  
  return 'document';
}

async function fixMediaTypes() {
  try {
    console.log('🔍 Récupération des questions avec médias...');
    
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, media_url, media_type')
      .not('media_url', 'is', null)
      .neq('media_url', '');
    
    if (error) {
      throw error;
    }
    
    console.log(`📋 ${questions.length} questions avec médias trouvées`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const question of questions) {
      const detectedType = detectMediaType(question.media_url);
      
      // Si le type détecté est différent du type actuel
      if (detectedType && detectedType !== question.media_type) {
        console.log(`🔄 Mise à jour question ${question.id}: ${question.media_type || 'null'} → ${detectedType}`);
        console.log(`   URL: ${question.media_url}`);
        
        const { error: updateError } = await supabase
          .from('questions')
          .update({ media_type: detectedType })
          .eq('id', question.id);
        
        if (updateError) {
          console.error(`❌ Erreur pour question ${question.id}:`, updateError.message);
        } else {
          updated++;
        }
      } else {
        skipped++;
      }
    }
    
    console.log('\n📊 Résultats:');
    console.log(`✅ ${updated} questions mises à jour`);
    console.log(`⏭️  ${skipped} questions ignorées (déjà correctes)`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixMediaTypes(); 