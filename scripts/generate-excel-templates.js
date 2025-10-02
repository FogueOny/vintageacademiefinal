/**
 * Script pour générer les modèles Excel à partir des fichiers CSV
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Chemins des fichiers
const baseDir = path.resolve(__dirname, '..');
const publicDir = path.join(baseDir, 'public');
const templatesDir = path.join(publicDir, 'templates');

// Assurez-vous que le répertoire templates existe
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
  console.log(`Création du répertoire: ${templatesDir}`);
}

// Liste des fichiers CSV à convertir
const filesToConvert = [
  'modules-template.csv',
  'test-series-template.csv',
  'questions-template.csv'
];

// Conversion de chaque fichier CSV en Excel
filesToConvert.forEach(csvFileName => {
  const csvFilePath = path.join(templatesDir, csvFileName);
  
  // Vérifier si le fichier CSV existe
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Le fichier ${csvFilePath} n'existe pas.`);
    return;
  }
  
  // Lire le fichier CSV
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  
  // Convertir le contenu CSV en objet workbook
  const workbook = xlsx.read(csvContent, { type: 'string', raw: true });
  
  // Générer le nom du fichier Excel
  const excelFileName = csvFileName.replace('.csv', '.xlsx');
  const excelFilePath = path.join(templatesDir, excelFileName);
  
  // Écrire le fichier Excel
  xlsx.writeFile(workbook, excelFilePath);
  console.log(`Modèle Excel créé: ${excelFilePath}`);
});

console.log('Génération des modèles Excel terminée.');

// Ajouter des instructions dans les fichiers Excel
// Cette étape nécessiterait des fonctionnalités plus avancées de xlsx
// Pour l'instant, nous nous appuyons sur les notes dans les fichiers CSV
