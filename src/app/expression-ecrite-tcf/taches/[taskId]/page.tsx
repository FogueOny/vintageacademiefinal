import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
// Utilisation de simples div au lieu du composant breadcrumb qui n'existe pas
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Utiliser la version serveur de getTaskById
import { getTaskByIdServer } from '@/lib/supabase/expression-ecrite-server-utils';
import { FloatingWhatsAppButton } from '@/components/floating-whatsapp-button';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Sujet d\'Expression Écrite TCF | Vintage Académie',
  description: 'Sujet détaillé d\'expression écrite TCF avec instructions complètes et documents de référence.',
};

// Données temporaires de tâches pour démo
const DEMO_TASKS = {
  // Tâche 1 - Invitation restaurant
  'task1': {
    id: 'fallback-task1',
    title: 'Invitation à un restaurant',
    description: 'Vous souhaitez inviter un collègue à un dîner professionnel dans un nouveau restaurant.',
    instructions: 'Rédigez un courriel pour inviter votre collègue en précisant la date, l\'heure, le lieu et l\'objet du dîner.',
    word_count_min: 60,
    word_count_max: 120,
    task_number: 1,
    task_type: 'courriel',
    difficulty_level: 'Facile',
    combination_id: 'fallback-combination1',
    combination: {
      title: 'Combinaison 1 - Juin 2025',
      period: {
        title: 'Juin 2025'
      }
    }
  },
  // Tâche 2 - Nouvelle activité sportive
  'task2': {
    id: 'fallback-task2',
    title: 'Nouvelle activité sportive',
    description: 'Vous avez récemment commencé une nouvelle activité sportive qui vous plaît beaucoup.',
    instructions: 'Rédigez un article de blog pour partager votre expérience, décrire cette activité et expliquer pourquoi vous la recommandez.',
    word_count_min: 120,
    word_count_max: 150,
    task_number: 2,
    task_type: 'blog',
    difficulty_level: 'Moyen',
    combination_id: 'fallback-combination1',
    combination: {
      title: 'Combinaison 1 - Juin 2025',
      period: {
        title: 'Juin 2025'
      }
    }
  },
  // Tâche 3 - Animaux au bureau
  'task3': {
    id: 'fallback-task3',
    title: 'Animaux de compagnie au bureau',
    description: 'De plus en plus d\'entreprises autorisent leurs employés à venir avec leurs animaux de compagnie au bureau.',
    instructions: 'À l\'aide des documents proposés, rédigez un texte argumenté présentant les avantages et inconvénients de cette pratique.',
    word_count_min: 120,
    word_count_max: 180,
    task_number: 3,
    task_type: 'argumentation',
    difficulty_level: 'Difficile',
    combination_id: 'fallback-combination1',
    combination: {
      title: 'Combinaison 1 - Juin 2025',
      period: {
        title: 'Juin 2025'
      }
    },
    documents: [
      {
        id: 'doc1',
        task_id: 'fallback-task3',
        document_number: 1,
        title: 'Étude sur la productivité',
        content: 'Selon une étude menée auprès de 500 employés dans des entreprises autorisant les animaux, 67% rapportent une réduction du stress et 43% une augmentation de la productivité. Cependant, 21% des participants mentionnent des distractions occasionnelles.',
        source: 'Institut de Recherche sur le Bien-être au Travail, 2024',
        document_type: 'étude'
      },
      {
        id: 'doc2',
        task_id: 'fallback-task3',
        document_number: 2,
        title: 'Témoignages d\'employeurs',
        content: 'Nous avons observé une amélioration notable de l\'ambiance de travail depuis que nous autorisons les animaux. Toutefois, nous avons dû mettre en place des règles strictes concernant la propreté et le comportement des animaux pour respecter ceux qui pourraient avoir des allergies ou des craintes.',
        source: 'Marie Durant, Directrice RH, TechInnovation',
        document_type: 'témoignage'
      }
    ]
  }
};

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  // Log pour débogage
  console.log('Tentative de récupération de la tâche avec ID:', taskId);
  
  // Récupérer la tâche depuis Supabase avec la version serveur
  const { data: task, error } = await getTaskByIdServer(taskId);
  
  // Log pour débogage
  if (error) {
    console.error('Erreur lors de la récupération de la tâche:', error);
  } else if (task) {
    console.log('Tâche récupérée avec succès:', task.title);
  } else {
    console.log('Aucune tâche trouvée avec ID:', taskId);
  }

  // Si la tâche n'est pas trouvée, afficher une page de secours au lieu de 404
  if (!task) {
    console.error('Erreur lors de la récupération de la tâche - tâche non disponible');
    
    // Afficher une page de secours au lieu de 404
    return (
      <div className="container mx-auto py-8 px-4">
        <nav className="mb-6">
          <div className="flex flex-wrap items-center text-sm text-muted-foreground">
            <Link href="/" className="text-orange-600 hover:text-orange-700">Accueil</Link>
            <span className="mx-2">/</span>
            <Link href="/expression-ecrite-tcf" className="text-orange-600 hover:text-orange-700">Expression Écrite TCF</Link>
            <span className="mx-2">/</span>
            <Link href="/expression-ecrite-tcf/sujets-actualite" className="text-orange-600 hover:text-orange-700">Sujets d'actualité</Link>
          </div>
        </nav>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-orange-600 mb-4">Tâche introuvable</h1>
          <p className="mb-4">Nous n'avons pas pu trouver la tâche demandée. Cela peut être dû à l'une des raisons suivantes :</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>L'ID de tâche ({taskId}) est incorrect</li>
            <li>La tâche a été supprimée ou déplacée</li>
            <li>La base de données est en cours de maintenance</li>
          </ul>
          <Link href="/expression-ecrite-tcf/sujets-actualite">
            <Button className="bg-orange-600 hover:bg-orange-700">Retour aux sujets d'actualité</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Formater le type de tâche pour l'affichage
  const formatTaskType = (type: string) => {
    const types: Record<string, string> = {
      'email': 'Courriel',
      'message': 'Message',
      'blog': 'Blog',
      'article': 'Article',
      'argumentation': 'Argumentation',
    };
    return types[type] || type;
  };

  // Mapper le niveau de difficulté (enum anglais) vers label FR et classes 
  const difficultyLabel = (level: string) => {
    const map: Record<string, string> = {
      beginner: 'Facile',
      intermediate: 'Moyen',
      advanced: 'Difficile',
    };
    return map[level] ?? level;
  };

  const difficultyClass = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-700';
      case 'intermediate':
        return 'text-orange-700';
      case 'advanced':
        return 'text-red-700';
      default:
        return 'text-muted-foreground';
    }
  };

  // Récupérer les informations de la combinaison et période associées
  const combination = task.combination as any;
  const period = combination?.period as any;

  // Préparer le lien WhatsApp pour prise de rendez-vous de correction
  const WHATSAPP_NUMBER = '237652385531';
  const buildWhatsAppLink = () => {
    const periodTitle = period?.title ? ` (${period.title})` : '';
    const message = `Bonjour, je souhaite réserver une correction pour la tâche ${task.task_number} - ${task.title}${periodTitle}. Mon identifiant de tâche est ${task.id}. Pourriez-vous me proposer un créneau ?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex flex-wrap items-center text-sm text-muted-foreground">
          <Link href="/" className="text-orange-600 hover:text-orange-700">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/expression-ecrite-tcf" className="text-orange-600 hover:text-orange-700">Expression Écrite TCF</Link>
          <span className="mx-2">/</span>
          <Link href="/expression-ecrite-tcf/sujets-actualite" className="text-orange-600 hover:text-orange-700">Sujets d'actualité</Link>
          {period && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/expression-ecrite-tcf/sujets-actualite/${period.slug}`} className="text-orange-600 hover:text-orange-700">{period.title}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">Tâche {task.task_number}</span>
        </div>
      </nav>

      {/* Bouton retour */}
      <div className="mb-6">
        <Link href={period ? `/expression-ecrite-tcf/sujets-actualite/${period.slug}` : '/expression-ecrite-tcf/sujets-actualite'}>
          <Button variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Retour aux sujets
          </Button>
        </Link>
      </div>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">
          {task.title}
        </h1>
        <div className="flex flex-wrap gap-2 items-center mt-3">
          <Badge className="bg-orange-600">{`Tâche ${task.task_number}`}</Badge>
          <Badge variant="outline" className="border-orange-300 text-orange-800">
            {formatTaskType(task.task_type)}
          </Badge>
          <Badge variant="outline" className="border-orange-300 text-orange-800">
            {`${task.word_count_min}-${task.word_count_max} mots`}
          </Badge>
          <Badge variant="outline" className={cn("border-orange-300", difficultyClass(task.difficulty_level))}>
            {difficultyLabel(task.difficulty_level)}
          </Badge>
          {combination && (
            <Badge variant="outline" className="border-orange-300 text-orange-800">
              Combinaison {combination.combination_number}
            </Badge>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-orange-600">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="mb-6">
              <p className="text-lg font-medium mb-2">Description :</p>
              {task.description && task.description.includes("Document 1") ? (
                // Format spécial pour les tâches avec documents (tâche 3)
                <div className="mt-4">
                  {(() => {
                    // Régex pour extraire les documents avec leur contenu complet
                    const docRegex = /(Document \d+[^]*?)(?=Document \d+|$)/g;
                    const documents = [];
                    let match;
                    
                    // Trouver tous les documents dans la description
                    const descriptionText = task.description || "";
                    const i = 1;
                    while ((match = docRegex.exec(descriptionText)) !== null) {
                      documents.push(match[1].trim());
                    }

                    // Afficher chaque document dans un cadre séparé
                    return documents.map((doc, index) => {
                      const docNumber = doc.match(/Document (\d+)/)?.[1] || (index + 1);
                      const docContent = doc.replace(/Document \d+ :/, "").trim();
                      
                      return (
                        <div key={index} className="mb-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                          <p className="font-medium text-orange-600 mb-2">Document {docNumber} :</p>
                          <p className="whitespace-pre-wrap">{docContent}</p>
                        </div>
                      );
                    });
                  })()
                  }
                </div>
              ) : (
                // Format standard pour les tâches sans documents
                <p className="whitespace-pre-wrap">{task.description}</p>
              )}
            </div>

            <div className="mb-6">
              <div className="whitespace-pre-wrap">{task.instructions}</div>
            </div>
            
            {/* Documents (uniquement pour la tâche 3) */}
            {task.task_number === 3 && 'documents' in task && Array.isArray(task.documents) && task.documents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Documents de référence :</h3>
                <Tabs defaultValue="document-1" className="mt-2">
                  <TabsList className="bg-orange-50">
                    {Array.isArray(task.documents) && task.documents.map((doc: any, index: number) => (
                      <TabsTrigger key={doc.id || index} value={`document-${index + 1}`}>
                        Document {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Array.isArray(task.documents) && task.documents.map((doc: any, index: number) => (
                    <TabsContent key={doc.id || index} value={`document-${index + 1}`}>
                      <Card className="border border-orange-200">
                        <CardHeader className="bg-orange-50 border-b border-orange-200">
                          <CardTitle className="text-lg">{doc.title || `Document ${index + 1}`}</CardTitle>
                          {doc.source && (
                            <p className="text-sm text-muted-foreground">Source: {doc.source}</p>
                          )}
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="whitespace-pre-wrap">{doc.content || ''}</div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Nombre de mots requis : <span className="font-medium">{task.word_count_min}-{task.word_count_max}</span></p>
          </div>
          <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
            <Button className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
              Demander une correction
            </Button>
          </a>
        </CardFooter>
      </Card>

      {/* Suggestions et Conseils */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-orange-600">Conseils pour cette tâche</CardTitle>
        </CardHeader>
        <CardContent>
          {task.task_number === 1 && (
            <ul className="list-disc pl-5 space-y-2">
              <li>Respectez la forme d'un message ou courriel : formule d'appel, corps, formule de politesse.</li>
              <li>Utilisez un ton adapté au contexte et au destinataire.</li>
              <li>Allez droit au but et soyez concis (60-120 mots).</li>
              <li>Relisez-vous pour vérifier la ponctuation et l'orthographe.</li>
            </ul>
          )}
          
          {task.task_number === 2 && (
            <ul className="list-disc pl-5 space-y-2">
              <li>Structurez votre texte avec une introduction, un développement et une conclusion.</li>
              <li>Utilisez des connecteurs logiques pour lier vos idées.</li>
              <li>Illustrez vos points avec des exemples concrets.</li>
              <li>Adaptez votre registre de langue à un blog ou article.</li>
              <li>Respectez le nombre de mots demandé (120-150 mots).</li>
            </ul>
          )}
          
          {task.task_number === 3 && (
            <ul className="list-disc pl-5 space-y-2">
              <li>Prenez le temps d'analyser les deux documents attentivement.</li>
              <li>Identifiez les points communs et les divergences entre les documents.</li>
              <li>Structurez votre argumentation en 3-4 paragraphes.</li>
              <li>Donnez votre opinion de façon nuancée en vous appuyant sur les documents.</li>
              <li>Utilisez un vocabulaire varié et des structures complexes.</li>
              <li>Respectez le nombre de mots demandé (120-180 mots).</li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-orange-600">Besoin d'aide avec ce sujet ?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Obtenez une correction personnalisée de votre production écrite par nos professeurs certifiés.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                Demander une correction
              </Button>
            </a>
            <Link href="/expression-ecrite-tcf/formations">
              <Button variant="outline" className="w-full">
                Voir nos formations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <FloatingWhatsAppButton />
    </div>
  );
}
