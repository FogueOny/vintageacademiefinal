-- Fichier de données de l'entreprise Vintage Académie
-- À exécuter après avoir créé la structure de la base de données

-- Vérifier si la table company_info existe, sinon la créer
CREATE TABLE IF NOT EXISTS company_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  social_media JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supprimer les données existantes pour éviter les doublons
DELETE FROM company_info;

-- Insérer les informations de l'entreprise
INSERT INTO company_info (
  name, 
  address, 
  phone, 
  email, 
  description,
  social_media
) VALUES (
  'Vintage Académie',
  '123 Rue de Paris, 75001 Paris, France', -- Remplacer par l'adresse réelle
  '+33 1 23 45 67 89', -- Remplacer par le téléphone réel
  'contact@vintageacademie.fr', -- Remplacer par l'email réel
  'Centre d''excellence pour la préparation aux examens de français et la formation linguistique',
  '{"facebook": "https://facebook.com/vintageacademie", "instagram": "https://instagram.com/vintageacademie", "linkedin": "https://linkedin.com/company/vintage-academie"}'
);

-- Configuration des buckets de stockage (documentation)
-- Note: Cette section est informative seulement, les buckets doivent être créés manuellement
/*
BUCKETS À CRÉER:
1. 'avatars' - Pour les images de profil
   - Politique publique pour lecture
   - Politique authentifiée pour écriture (utilisateur peut modifier son propre avatar)

2. 'question-media' - Pour les médias des questions de test
   - Politique publique pour lecture
   - Politique admin uniquement pour écriture
   
3. 'marketing-assets' - Pour les images du site web
   - Politique publique pour lecture
   - Politique admin uniquement pour écriture
*/

-- Insérer des paramètres système si nécessaire
INSERT INTO system_settings (key, value)
VALUES 
  ('site_name', 'Vintage Académie'),
  ('contact_email', 'contact@vintageacademie.fr'),
  ('support_phone', '+33 1 23 45 67 89'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;
