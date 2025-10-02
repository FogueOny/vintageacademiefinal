#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminUsers() {
  console.log('🔍 Vérification des utilisateurs admin...\n');
  
  try {
    // Récupérer tous les profils avec leur rôle
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des profils:', error);
      return;
    }
    
    console.log('👥 Tous les utilisateurs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    profiles.forEach((profile, index) => {
      const roleIcon = profile.role === 'admin' ? '👑' : '👤';
      const dateCreated = new Date(profile.created_at).toLocaleDateString('fr-FR');
      
      console.log(`${index + 1}. ${roleIcon} ${profile.email}`);
      console.log(`   📧 ID: ${profile.id}`);
      console.log(`   🎯 Rôle: ${profile.role || 'user'}`);
      console.log(`   📅 Créé le: ${dateCreated}`);
      console.log('');
    });
    
    // Statistiques
    const adminCount = profiles.filter(p => p.role === 'admin').length;
    const userCount = profiles.filter(p => p.role !== 'admin').length;
    
    console.log('📊 Statistiques:');
    console.log(`   👑 Administrateurs: ${adminCount}`);
    console.log(`   👤 Utilisateurs: ${userCount}`);
    console.log(`   📝 Total: ${profiles.length}`);
    
    // Vérifier les politiques RLS
    console.log('\n🔐 Vérification des politiques de sécurité...');
    
    // Test d'accès aux questions
    const { data: questionsTest, error: questionsError } = await supabase
      .from('questions')
      .select('count')
      .limit(1);
    
    if (questionsError) {
      console.log('❌ Problème d\'accès à la table questions:', questionsError.message);
    } else {
      console.log('✅ Accès à la table questions: OK');
    }
    
    // Test d'accès aux options
    const { data: optionsTest, error: optionsError } = await supabase
      .from('options')
      .select('count')
      .limit(1);
    
    if (optionsError) {
      console.log('❌ Problème d\'accès à la table options:', optionsError.message);
    } else {
      console.log('✅ Accès à la table options: OK');
    }
    
  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Fonction pour promouvoir un utilisateur en admin
async function promoteToAdmin(email) {
  console.log(`🔄 Promotion de ${email} en administrateur...`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('❌ Erreur lors de la promotion:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ ${email} est maintenant administrateur !`);
    } else {
      console.log(`❌ Utilisateur ${email} non trouvé`);
    }
    
  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

// Interface en ligne de commande
const args = process.argv.slice(2);

if (args.length === 0) {
  checkAdminUsers();
} else if (args[0] === 'promote' && args[1]) {
  promoteToAdmin(args[1]);
} else {
  console.log('Usage:');
  console.log('  node scripts/check-admin-users.js              # Lister tous les utilisateurs');
  console.log('  node scripts/check-admin-users.js promote email@example.com  # Promouvoir un utilisateur');
} 