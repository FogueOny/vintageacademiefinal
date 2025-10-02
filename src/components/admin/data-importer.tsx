import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, Upload, FileSpreadsheet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

interface ImportStats {
  total: number;
  processed: number;
  success: number;
  errors: number;
}

export function DataImporter() {
  const [importing, setImporting] = useState(false);
  const [fileModules, setFileModules] = useState<File | null>(null);
  const [fileTestSeries, setFileTestSeries] = useState<File | null>(null);
  const [fileQuestions, setFileQuestions] = useState<File | null>(null);
  const [importStats, setImportStats] = useState<ImportStats>({ total: 0, processed: 0, success: 0, errors: 0 });
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const { toast } = useToast();
  // Utilisation de l'instance unique de Supabase pour le client
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const fileInputModulesRef = useRef<HTMLInputElement>(null);
  const fileInputSeriesRef = useRef<HTMLInputElement>(null);
  const fileInputQuestionsRef = useRef<HTMLInputElement>(null);

  // Récupérer la session et le token au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Vérification complète des informations d'authentification
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Vérification session dans DataImporter:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasToken: !!session?.access_token,
          tokenLength: session?.access_token ? session.access_token.length : 0,
          tokenStart: session?.access_token ? session.access_token.substring(0, 10) + '...' : 'aucun'
        });
        
        if (session?.user) {
          setUserId(session.user.id);
          console.log('ID utilisateur récupéré pour l\'importation:', session.user.id);
          
          // Vérification du rôle admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          console.log('Vérification rôle dans DataImporter:', {
            hasProfile: !!profile,
            role: profile?.role || 'non défini'
          });
          
          if (!profile || profile.role !== 'admin') {
            console.error('Utilisateur non admin');
            toast({
              variant: "destructive",
              title: "Accès refusé",
              description: "Vous n'avez pas les droits administrateur requis.",
            });
            router.push('/dashboard');
            return;
          }
        } else {
          console.error('Aucune session active dans DataImporter');
          toast({
            variant: "destructive",
            title: "Non authentifié",
            description: "Vous devez être connecté pour utiliser cette fonctionnalité.",
          });
          router.push('/login');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        toast({
          variant: "destructive",
          title: "Erreur d'authentification",
          description: "Impossible de vérifier votre identité. Veuillez vous reconnecter.",
        });
        router.push('/login');
      }
    };
    
    checkSession();
  }, [supabase, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      // Les URL des modèles Excel stockés dans le bucket public
      const templateUrls = {
        modules: "/templates/modules-template.xlsx",
        series: "/templates/test-series-template.xlsx",
        questions: "/templates/questions-template.xlsx",
      };

      const url = templateUrls[type as keyof typeof templateUrls];
      if (!url) {
        throw new Error("Modèle non disponible");
      }

      // On télécharge le fichier
      window.open(url, "_blank");

      toast({
        title: "Téléchargement du modèle",
        description: "Le modèle Excel a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement du modèle:", error);
      toast({
        variant: "destructive",
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le modèle. Veuillez réessayer.",
      });
    }
  };

  const importData = async (type: string, file: File | null) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Fichier manquant",
        description: "Veuillez sélectionner un fichier à importer.",
      });
      return;
    }

    setImporting(true);
    setImportLogs([`Début de l'importation des ${type}...`]);
    setImportStats({ total: 0, processed: 0, success: 0, errors: 0 });

    try {
      // Vérification de l'extension du fichier
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        throw new Error(`Format de fichier non supporté: ${fileExtension}. Utilisez CSV, XLS ou XLSX.`);
      }
      
      setImportLogs(prev => [...prev, `Traitement du fichier ${file.name} (${formatFileSize(file.size)})...`]);
      
      // Récupération du token d'accès pour l'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Récupération du token pour importation:', { 
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenTaille: session?.access_token?.length || 0
      });
      
      if (!session?.access_token) {
        console.error('Pas de token disponible pour l\'API d\'importation');
        throw new Error('Aucun token d\'authentification disponible. Veuillez vous reconnecter.');
      }
      
      // S'assurer que l'utilisateur est admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (profileError || !profile || profile.role !== 'admin') {
        console.error('Vérification admin échouée lors de l\'importation:', profileError?.message || 'Utilisateur non admin');
        throw new Error('Vous devez être administrateur pour effectuer cette opération.');
      }
      
      // Création de FormData pour l'envoi du fichier
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      console.log('Préparation de la requête avec authentification pour utilisateur:', userId);

      // Appel à l'API d'importation avec token d'authentification
      setImportLogs(prev => [...prev, `Envoi des données au serveur...`]);
      
      // Afficher le début du token pour le débogage
      const tokenPreview = session.access_token.substring(0, 10) + '...' + session.access_token.substring(session.access_token.length - 5);
      console.log(`Envoi de la requête avec token: ${tokenPreview}`);
      
      const response = await fetch('/api/admin/import-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`, // Envoi du token dans l'en-tête Authorization
        },
        body: formData
      });

      // Récupération du texte de réponse pour diagnostic
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Erreur serveur: ${response.status} ${response.statusText}`;
        try {
          // Essayer de parser la réponse comme JSON pour obtenir le message d'erreur
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Si pas du JSON, utiliser le texte brut de la réponse
          if (responseText) {
            errorMessage += ` - ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Parsing de la réponse JSON après avoir vérifié que response.ok
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
        throw new Error(`Erreur de parsing de la réponse: ${errorMessage}. Réponse: ${responseText.substring(0, 100)}...`);
      }
      
      // Mise à jour des statistiques et logs
      setImportStats({
        total: result.total || 0,
        processed: result.total || 0,
        success: result.success || 0,
        errors: result.errors || 0
      });

      setImportLogs(prev => [
        ...prev,
        `Importation terminée: ${result.success} réussis, ${result.errors} échoués.`,
        ...(result.logs || [])
      ]);

      toast({
        title: "Importation terminée",
        description: `${result.success} enregistrements importés avec succès, ${result.errors} erreurs.`,
      });
    } catch (error: any) {
      console.error("Erreur lors de l'importation:", error);
      
      setImportLogs(prev => [
        ...prev,
        `Erreur: ${error.message || "Erreur inconnue lors de l'importation."}`
      ]);
      
      toast({
        variant: "destructive",
        title: "Erreur d'importation",
        description: error.message || "Une erreur s'est produite lors de l'importation.",
      });
    } finally {
      setImporting(false);
    }
  };
  
  // Fonction utilitaire pour formater la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fonction pour calculer le pourcentage de progression
  const calculateProgress = () => {
    if (importStats.total === 0) return 0;
    return Math.round((importStats.processed / importStats.total) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Importation en masse de données</CardTitle>
        <CardDescription>
          Importez des modules, séries de tests et questions à partir de fichiers Excel ou CSV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="modules">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="series">Séries de tests</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          
          {/* Tab Modules */}
          <TabsContent value="modules" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Importer des modules</h3>
                <p className="text-sm text-muted-foreground">
                  Importez une liste de modules à partir d'un fichier Excel ou CSV
                </p>
              </div>
              <Button variant="outline" onClick={() => downloadTemplate('modules')}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le modèle
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputModulesRef}
                onChange={(e) => handleFileChange(e, setFileModules)}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Button 
                variant="secondary" 
                onClick={() => fileInputModulesRef.current?.click()}
                disabled={importing}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {fileModules ? fileModules.name : "Sélectionner un fichier"}
              </Button>
              <Button 
                onClick={() => importData('modules', fileModules)}
                disabled={importing || !fileModules}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer les modules
              </Button>
            </div>
          </TabsContent>
          
          {/* Tab Séries de tests */}
          <TabsContent value="series" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Importer des séries de tests</h3>
                <p className="text-sm text-muted-foreground">
                  Importez une liste de séries de tests à partir d'un fichier Excel ou CSV
                </p>
              </div>
              <Button variant="outline" onClick={() => downloadTemplate('series')}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le modèle
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputSeriesRef}
                onChange={(e) => handleFileChange(e, setFileTestSeries)}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Button 
                variant="secondary" 
                onClick={() => fileInputSeriesRef.current?.click()}
                disabled={importing}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {fileTestSeries ? fileTestSeries.name : "Sélectionner un fichier"}
              </Button>
              <Button 
                onClick={() => importData('series', fileTestSeries)}
                disabled={importing || !fileTestSeries}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer les séries
              </Button>
            </div>
          </TabsContent>
          
          {/* Tab Questions */}
          <TabsContent value="questions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Importer des questions</h3>
                <p className="text-sm text-muted-foreground">
                  Importez une liste de questions à partir d'un fichier Excel ou CSV
                </p>
              </div>
              <Button variant="outline" onClick={() => downloadTemplate('questions')}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le modèle
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputQuestionsRef}
                onChange={(e) => handleFileChange(e, setFileQuestions)}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Button 
                variant="secondary" 
                onClick={() => fileInputQuestionsRef.current?.click()}
                disabled={importing}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {fileQuestions ? fileQuestions.name : "Sélectionner un fichier"}
              </Button>
              <Button 
                onClick={() => importData('questions', fileQuestions)}
                disabled={importing || !fileQuestions}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer les questions
              </Button>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Les médias associés aux questions (audio, images) devront être ajoutés manuellement après l'importation.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        {importing && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">Importation en cours...</p>
            <Progress value={calculateProgress()} />
            <p className="text-xs text-muted-foreground">
              {importStats.processed} sur {importStats.total} enregistrements traités
            </p>
          </div>
        )}
        
        {importLogs.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">Journal d'importation</p>
            <div className="max-h-48 overflow-y-auto bg-muted p-4 rounded-md">
              {importLogs.map((log, index) => (
                <p key={index} className="text-xs">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}