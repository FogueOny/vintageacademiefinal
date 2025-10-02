/**
 * Utilitaires pour la gestion des slugs
 */

/**
 * Génère un slug à partir du nom du mois et de l'année
 * Ex: "janvier" + 2023 => "janvier-2023"
 */
export function generatePeriodSlug(month: string, year: number): string {
  // Convertir le mois en minuscules et retirer les accents
  const normalizedMonth = month.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
  
  return `${normalizedMonth}-${year}`;
}

/**
 * Convertit un slug de période en texte formaté pour l'affichage
 * Ex: "janvier-2023" => "Janvier 2023"
 */
export function formatPeriodFromSlug(slug: string): string {
  if (!slug) return '';
  
  const parts = slug.split('-');
  if (parts.length < 2) return slug;
  
  const month = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const year = parts[parts.length - 1];
  
  return `${month} ${year}`;
}
