-- Script pour insérer des données d'exemple pour Expression Écrite TCF
-- À exécuter APRÈS le script expression_ecrite_database.sql

-- Insérer les périodes (mois/années)
INSERT INTO expression_ecrite_periods (month, year, slug, title, description, total_combinations) VALUES
('juin', 2025, 'juin-2025', 'Sujets Expression Écrite - Juin 2025', 'Sujets d''actualité pour la préparation TCF Canada - Juin 2025', 3),
('mai', 2025, 'mai-2025', 'Sujets Expression Écrite - Mai 2025', 'Sujets d''actualité pour la préparation TCF Canada - Mai 2025', 0),
('avril', 2025, 'avril-2025', 'Sujets Expression Écrite - Avril 2025', 'Sujets d''actualité pour la préparation TCF Canada - Avril 2025', 0),
('mars', 2025, 'mars-2025', 'Sujets Expression Écrite - Mars 2025', 'Sujets d''actualité pour la préparation TCF Canada - Mars 2025', 0),
('fevrier', 2025, 'fevrier-2025', 'Sujets Expression Écrite - Février 2025', 'Sujets d''actualité pour la préparation TCF Canada - Février 2025', 0),
('janvier', 2025, 'janvier-2025', 'Sujets Expression Écrite - Janvier 2025', 'Sujets d''actualité pour la préparation TCF Canada - Janvier 2025', 0),
('decembre', 2024, 'decembre-2024', 'Sujets Expression Écrite - Décembre 2024', 'Sujets d''actualité pour la préparation TCF Canada - Décembre 2024', 0),
('novembre', 2024, 'novembre-2024', 'Sujets Expression Écrite - Novembre 2024', 'Sujets d''actualité pour la préparation TCF Canada - Novembre 2024', 0)
ON CONFLICT (slug) DO NOTHING;

-- Récupérer l'ID de la période juin-2025 pour les exemples
DO $$
DECLARE
    juin_2025_id UUID;
    combination_1_id UUID;
    combination_2_id UUID;
    combination_3_id UUID;
    task_id UUID;
BEGIN
    -- Récupérer l'ID de juin 2025
    SELECT id INTO juin_2025_id FROM expression_ecrite_periods WHERE slug = 'juin-2025';
    
    -- Insérer les combinaisons pour juin 2025
    INSERT INTO expression_ecrite_combinations (period_id, combination_number, title) VALUES
    (juin_2025_id, 1, 'Combinaison 1 - Juin 2025'),
    (juin_2025_id, 2, 'Combinaison 2 - Juin 2025'),
    (juin_2025_id, 3, 'Combinaison 3 - Juin 2025');
    
    -- Récupérer les IDs des combinaisons
    SELECT id INTO combination_1_id FROM expression_ecrite_combinations WHERE period_id = juin_2025_id AND combination_number = 1;
    SELECT id INTO combination_2_id FROM expression_ecrite_combinations WHERE period_id = juin_2025_id AND combination_number = 2;
    SELECT id INTO combination_3_id FROM expression_ecrite_combinations WHERE period_id = juin_2025_id AND combination_number = 3;
    
    -- COMBINAISON 1
    -- Tâche 1
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_1_id, 1, 'Invitation au restaurant', 'Vous organisez un dîner d''affaires dans un restaurant réputé de votre ville. Rédigez un courriel professionnel pour inviter un client important. Mentionnez la date, l''heure, le lieu et l''objectif de cette rencontre.', 60, 120, 'courriel', 15, 'Adoptez un ton professionnel et courtois. Incluez tous les détails pratiques nécessaires.');
    
    SELECT id INTO task_id FROM expression_ecrite_tasks WHERE combination_id = combination_1_id AND task_number = 1;
    
    -- Tâche 2
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_1_id, 2, 'Nouvelle activité sportive', 'Vous avez récemment découvert une nouvelle activité sportive qui vous passionne. Rédigez un article de blog pour partager votre expérience, décrire les bienfaits de cette activité et encourager vos lecteurs à l''essayer.', 120, 150, 'blog', 20, 'Utilisez un ton personnel et engageant. Partagez des détails concrets de votre expérience.');
    
    -- Tâche 3
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_1_id, 3, 'Animaux de compagnie au bureau', 'De plus en plus d''entreprises autorisent les employés à amener leurs animaux de compagnie au travail. En vous appuyant sur les documents fournis, rédigez un texte argumenté présentant votre position sur cette pratique.', 120, 180, 'argumentation', 25, 'Prenez position clairement et utilisez les arguments des documents pour étayer votre point de vue.');
    
    SELECT id INTO task_id FROM expression_ecrite_tasks WHERE combination_id = combination_1_id AND task_number = 3;
    
    -- Documents pour Tâche 3 - Combinaison 1
    INSERT INTO expression_ecrite_documents (task_id, document_number, title, content, source) VALUES
    (task_id, 1, 'Les bienfaits des animaux au bureau', 'Une étude menée par l''Université de Virginie révèle que la présence d''animaux de compagnie dans les bureaux réduit significativement le stress des employés. Les participants à l''étude ont montré une diminution de 12% de leur niveau de cortisol, l''hormone du stress, lorsqu''ils travaillaient en présence d''animaux. De plus, 78% des employés interrogés déclarent que les animaux favorisent les interactions sociales et créent une atmosphère plus détendue. Les entreprises qui ont adopté cette politique rapportent également une amélioration de la satisfaction au travail et une réduction de l''absentéisme de 8%.', 'Étude Université de Virginie, 2024'),
    (task_id, 2, 'Les défis et contraintes', 'Malgré les avantages potentiels, l''introduction d''animaux en milieu professionnel soulève plusieurs préoccupations. Les allergies représentent un défi majeur : environ 15% de la population souffre d''allergies aux animaux domestiques. Les questions d''hygiène et de sécurité sont également cruciales, notamment dans les secteurs alimentaire et médical. Par ailleurs, certains animaux peuvent être source de distractions ou de nuisances sonores, affectant la concentration et la productivité. Les entreprises doivent aussi considérer les aspects légaux et d''assurance, car elles deviennent responsables des éventuels incidents impliquant les animaux de leurs employés.', 'Rapport Association des Ressources Humaines, 2024');
    
    -- COMBINAISON 2
    -- Tâche 1
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_2_id, 1, 'Réclamation produit défectueux', 'Vous avez acheté un appareil électronique en ligne qui s''est révélé défectueux dès le déballage. Rédigez un courriel de réclamation au service client pour demander un remboursement ou un échange. Expliquez le problème rencontré et vos attentes.', 60, 120, 'courriel', 15, 'Adoptez un ton ferme mais poli. Mentionnez les références de commande et décrivez précisément le défaut.');
    
    -- Tâche 2
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_2_id, 2, 'Découverte d''un nouveau quartier', 'Vous venez d''emménager dans un nouveau quartier de votre ville. Rédigez un article pour le journal local présentant vos premières impressions, les commerces et services que vous avez découverts, et ce qui vous plaît le plus dans cet environnement.', 120, 150, 'article', 20, 'Adoptez un ton descriptif et positif. Donnez des exemples concrets de lieux et d''expériences.');
    
    -- Tâche 3
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_2_id, 3, 'Le télétravail : avantages et inconvénients', 'Le télétravail s''est généralisé depuis la pandémie et transforme notre rapport au travail. En vous basant sur les documents fournis, rédigez un texte argumenté sur les impacts du télétravail sur les employés et les entreprises.', 120, 180, 'argumentation', 25, 'Présentez une analyse équilibrée en vous appuyant sur les éléments des documents.');
    
    SELECT id INTO task_id FROM expression_ecrite_tasks WHERE combination_id = combination_2_id AND task_number = 3;
    
    -- Documents pour Tâche 3 - Combinaison 2
    INSERT INTO expression_ecrite_documents (task_id, document_number, title, content, source) VALUES
    (task_id, 1, 'Les avantages du télétravail', 'Une enquête menée auprès de 5000 télétravailleurs révèle des bénéfices significatifs. 89% des répondants apprécient la flexibilité horaire qui leur permet de mieux concilier vie professionnelle et personnelle. L''économie de temps de transport représente en moyenne 1h30 par jour, temps réinvesti dans le sommeil, la famille ou les loisirs. Sur le plan financier, les employés économisent environ 200€ par mois en frais de transport, repas et vêtements professionnels. Pour les entreprises, la réduction des coûts immobiliers peut atteindre 30%, tandis que la productivité augmente de 13% selon plusieurs études. Le télétravail favorise également l''inclusion en permettant l''emploi de personnes à mobilité réduite ou vivant dans des zones géographiquement isolées.', 'Étude Institut du Travail à Distance, 2024'),
    (task_id, 2, 'Les défis du travail à distance', 'Le télétravail présente néanmoins des inconvénients non négligeables. L''isolement social touche 67% des télétravailleurs réguliers, pouvant conduire à une détérioration de la santé mentale. La frontière floue entre vie privée et professionnelle génère du stress chez 45% des employés, qui peinent à "déconnecter". Les managers signalent des difficultés à maintenir la cohésion d''équipe et à évaluer la performance. La créativité et l''innovation peuvent également pâtir du manque d''interactions spontanées. Enfin, tous les logements ne sont pas adaptés au travail à domicile, créant des inégalités entre les employés selon leur situation personnelle et financière.', 'Rapport Observatoire du Télétravail, 2024');
    
    -- COMBINAISON 3
    -- Tâche 1
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_3_id, 1, 'Demande d''informations cours de langue', 'Vous souhaitez vous inscrire à des cours de français langue étrangère dans une école de langues. Rédigez un courriel pour demander des informations sur les programmes disponibles, les horaires, les tarifs et les modalités d''inscription.', 60, 120, 'courriel', 15, 'Adoptez un ton poli et précis. Posez des questions concrètes sur vos besoins spécifiques.');
    
    -- Tâche 2
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_3_id, 2, 'Expérience culinaire mémorable', 'Vous avez récemment vécu une expérience culinaire exceptionnelle dans un restaurant ou lors d''un voyage. Rédigez un article pour un magazine gastronomique décrivant cette expérience, les saveurs découvertes et l''ambiance du lieu.', 120, 150, 'article', 20, 'Utilisez un vocabulaire riche et des descriptions sensorielles. Transmettez votre enthousiasme.');
    
    -- Tâche 3
    INSERT INTO expression_ecrite_tasks (combination_id, task_number, title, description, word_count_min, word_count_max, task_type, duration_minutes, instructions) VALUES
    (combination_3_id, 3, 'Impact des réseaux sociaux sur les jeunes', 'Les réseaux sociaux occupent une place centrale dans la vie des adolescents et jeunes adultes. En vous appuyant sur les documents fournis, rédigez un texte argumenté sur l''influence des réseaux sociaux sur cette génération.', 120, 180, 'argumentation', 25, 'Analysez les aspects positifs et négatifs en vous référant aux données des documents.');
    
    SELECT id INTO task_id FROM expression_ecrite_tasks WHERE combination_id = combination_3_id AND task_number = 3;
    
    -- Documents pour Tâche 3 - Combinaison 3
    INSERT INTO expression_ecrite_documents (task_id, document_number, title, content, source) VALUES
    (task_id, 1, 'Les bénéfices des réseaux sociaux', 'Les réseaux sociaux offrent aux jeunes de nombreuses opportunités. 82% des 16-25 ans utilisent ces plateformes pour maintenir le contact avec leurs amis et leur famille, renforçant ainsi leurs liens sociaux. Ces outils facilitent également l''accès à l''information et à l''éducation : 76% des étudiants déclarent utiliser les réseaux sociaux pour leurs recherches académiques et leurs projets scolaires. Les plateformes créatives comme Instagram, TikTok ou YouTube permettent aux jeunes de développer leurs talents artistiques et d''acquérir de nouvelles compétences. De plus, 34% des jeunes entrepreneurs ont lancé leur activité grâce aux réseaux sociaux, qui offrent des opportunités professionnelles inédites et permettent de construire un réseau professionnel dès le plus jeune âge.', 'Enquête Jeunesse et Numérique, 2024'),
    (task_id, 2, 'Les risques et dérives', 'L''usage intensif des réseaux sociaux présente des risques préoccupants pour les jeunes. Une étude révèle que 58% des adolescents passent plus de 3 heures par jour sur ces plateformes, au détriment du sommeil et des activités physiques. Le cyberharcèlement touche 23% des jeunes utilisateurs, avec des conséquences graves sur leur santé mentale. La comparaison sociale constante génère de l''anxiété chez 41% des utilisateurs, particulièrement les jeunes filles exposées aux standards de beauté irréalistes. Les fake news et la désinformation prolifèrent, 67% des jeunes ayant déjà partagé une information sans en vérifier la source. Enfin, la dépendance aux réseaux sociaux affecte les performances scolaires de 29% des étudiants selon les enseignants interrogés.', 'Rapport Santé Numérique des Jeunes, 2024');

    -- Insérer quelques corrections d'exemple
    INSERT INTO expression_ecrite_corrections (task_id, correction_type, title, content, score, feedback, strengths, improvements, corrector_name, is_public) 
    SELECT 
        t.id,
        'example',
        'Correction modèle - ' || t.title,
        'Voici un exemple de correction détaillée pour cette tâche...',
        16,
        'Bon travail dans l''ensemble. La structure est claire et les arguments sont bien développés.',
        ARRAY['Structure claire', 'Arguments pertinents', 'Vocabulaire approprié'],
        ARRAY['Attention aux accords', 'Développer davantage certains points'],
        'Marie Dubois',
        true
    FROM expression_ecrite_tasks t 
    WHERE t.combination_id IN (combination_1_id, combination_2_id, combination_3_id)
    AND t.task_number = 1;

END $$;
