/**
 * Script de normalisation des slugs des périodes
 * 
 * Ce script parcourt toutes les périodes d'expression écrite TCF dans la base de données
 * et normalise leurs slugs en utilisant la fonction generatePeriodSlug
 * pour assurer la cohérence entre l'interface d'administration et les pages publiques.
 * 
 * Usage: 
 * 1. Exécuter avec `npx ts-node src/scripts/normalize-period-slugs.ts`
 * 2. Vérifier les logs pour voir les périodes mises à jour
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generatePeriodSlug } from '../lib/utils/slug-utils';

// Types
type PeriodRow = {
  id: string;
  month: string;
  year: number;
  slug: string;
  title: string;
};

const mapRowToPeriod = (row: PeriodRow | null): PeriodRow | null => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    month: row.month,
    year: row.year,
    slug: row.slug,
    title: row.title,
  };
};

async function normalizePeriodSlugs() {
  console.log('🔄 Démarrage de la normalisation des slugs des périodes...');

  try {
    // Initialiser le client Supabase
    const supabase = await createServerSupabaseClient();

    // Récupérer toutes les périodes
    const { data: periods, error } = await supabase
      .from('expression_ecrite_periods')
      .select('id, month, year, slug, title');

    if (error) {
      throw error;
    }

    if (!periods || periods.length === 0) {
      console.log('❌ Aucune période trouvée dans la base de données.');
      return;
    }

    console.log(`📋 ${periods.length} périodes trouvées dans la base de données.`);

    // Analyser chaque période et normaliser son slug si nécessaire
    let updatedCount = 0;
    for (const periodRow of periods) {
      const period = mapRowToPeriod(periodRow as PeriodRow | null);
      if (!period) {
        continue;
      }

      const normalizedSlug = generatePeriodSlug(period.month, period.year);

      // Si le slug actuel ne correspond pas au slug normalisé, le mettre à jour
      if (period.slug !== normalizedSlug) {
        console.log(`🔄 Mise à jour du slug pour "${period.title}": "${period.slug}" -> "${normalizedSlug}"`);
        
        const { error: updateError } = await supabase
          .from('expression_ecrite_periods')
          .update({ slug: normalizedSlug })
          .eq('id', period.id);

        if (updateError) {
          console.error(`❌ Erreur lors de la mise à jour du slug pour la période ${period.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`✅ Migration terminée. ${updatedCount} périodes mises à jour.`);

  } catch (error) {
    console.error('❌ Erreur lors de la normalisation des slugs:', error);
  }
}

// Exécuter le script
normalizePeriodSlugs().catch(console.error);
