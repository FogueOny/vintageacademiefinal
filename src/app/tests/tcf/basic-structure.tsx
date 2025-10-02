"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, Headphones, MessageSquare, Mic, CheckCircle, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { ProfessionalFooter } from "@/components/professional-footer";

// Interfaces pour les types de données
interface User {
  id: string;
  email?: string;
}

interface Exercise {
  id: string;
  title: string;
  level: string;
  description: string;
  category: string;
  questions?: number;
  duration: string;
  preparation?: string;
  wordCount?: string;
  completed: boolean;
}

interface ExampleQuestion {
  id: string;
  content: string;
  options?: {
    id: string;
    label: string;
    content: string;
    is_correct: boolean;
  }[];
  media?: {
    id: string;
    url: string;
    media_type: string;
  }[];
}

interface UserProgress {
  comprehensionEcrite: number;
  comprehensionOrale: number;
  expressionEcrite: number;
  expressionOrale: number;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

// Exemple de question pour une démonstration
const sampleQuestion = {
  text: "D'après le texte, quelle est la principale raison de l'augmentation des températures globales?",
  options: [
    { id: "a", text: "La déforestation massive dans les régions tropicales" },
    { id: "b", text: "L'émission excessive de gaz à effet de serre" },
    { id: "c", text: "L'urbanisation croissante dans les pays développés" },
    { id: "d", text: "Le réchauffement naturel cyclique de la planète" },
  ],
  correctAnswer: "b"
};

// Composant principal pour la page TCF
export default function TCFTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textareaContent, setTextareaContent] = useState<string>("");
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused'>('idle');
  
  // États pour les exercices par catégorie
  const [comprehensionEcriteExercices, setComprehensionEcriteExercices] = useState<Exercise[]>([]);
  const [comprehensionOraleExercices, setComprehensionOraleExercices] = useState<Exercise[]>([]);
  const [expressionEcriteExercices, setExpressionEcriteExercices] = useState<Exercise[]>([]);
  const [expressionOraleExercices, setExpressionOraleExercices] = useState<Exercise[]>([]);
  
  // États pour les questions d'exemple
  const [sampleQuestions, setSampleQuestions] = useState<{[key: string]: ExampleQuestion | null}>({});
  
  // États pour la progression utilisateur
  const [userProgress, setUserProgress] = useState<UserProgress>({
    comprehensionEcrite: 0,
    comprehensionOrale: 0,
    expressionEcrite: 0,
    expressionOrale: 0,
  });
  
  // État de chargement et erreurs
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const { data: { session } } = await supabase().auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
          });
        }
      } catch (error) {
        console.error("Erreur de vérification de session:", error);
      }
    };
    
    checkLoginStatus();
  }, []);
  
  // Charger les données des exercices depuis Supabase
  useEffect(() => {
    if (!user) return;
    
    const fetchExercises = async () => {
      setLoading(true);
      try {
        // 1. Récupérer les exercices par catégorie
        const categories = [
          'comprehension_ecrite', 
          'comprehension_orale', 
          'expression_ecrite', 
          'expression_orale'
        ];
        
        // Pour chaque catégorie, récupérer les exercices
        const { data: exercisesData, error: exercisesError } = await supabase()
          .from('test_series')
          .select('*')
          .eq('test_type', 'tcf')
          .in('category', categories);
        
        if (exercisesError) throw exercisesError;
        
        // 2. Récupérer la progression de l'utilisateur
        const { data: userProgressData, error: progressError } = await supabase()
          .from('user_tests')
          .select('test_series_id, score, completed_at')
          .eq('user_id', user.id);
        
        if (progressError) throw progressError;
        
        // 3. Récupérer un exemple de question pour chaque catégorie
        const { data: sampleQuestionData, error: questionError } = await supabase()
          .from('questions')
          .select(`
            id, 
            content, 
            type,
            test_series!inner(category)
          `)
          .eq('is_sample', true)
          .in('test_series.category', categories);
        
        if (questionError) throw questionError;
        
        // 4. Pour chaque question exemple, récupérer ses options
        const questionsWithOptions = await Promise.all(
          (sampleQuestionData || []).map(async (question: ExampleQuestion) => {
            const { data: optionsData } = await supabase()
              .from('options')
              .select('*')
              .eq('question_id', question.id);
              
            const { data: mediaData } = await supabase()
              .from('question_media')
              .select('*')
              .eq('question_id', question.id);
            
            return {
              ...question,
              options: optionsData || [],
              media: mediaData || []
            };
          })
        );
        
        // 5. Traiter et organiser les données récupérées
        // Transformer les données en format exploitable
        const processExercises = (exercises: any[], category: string, completedTests: any[]) => {
          return exercises
            .filter(ex => ex.category === category)
            .map(ex => ({
              id: ex.id,
              title: ex.title || 'Sans titre',
              level: ex.level || 'Non défini',
              description: ex.description || '',
              category: ex.category,
              questions: ex.question_count || 0,
              duration: `${ex.time_limit || 0} min`,
              wordCount: ex.word_count ? `${ex.word_count}` : undefined,
              preparation: ex.preparation_time ? `${ex.preparation_time} min` : undefined,
              completed: completedTests.some(test => test.test_series_id === ex.id && test.completed_at)
            }));
        };
        
        // Organiser les échantillons de questions par catégorie
        const questionsByCat: {[key: string]: any} = {};
        questionsWithOptions.forEach((q: any) => {
          if (q.test_series && 
              typeof q.test_series === 'object' && 
              'category' in q.test_series && 
              typeof q.test_series.category === 'string') {
            questionsByCat[q.test_series.category] = q;
          }
        });
        
        // Calculer la progression de l'utilisateur par catégorie
        const calculateProgress = (category: string) => {
          const exs = exercisesData?.filter((ex: Exercise) => ex.category === category) || [];
          if (!exs.length) return 0;
          
          const completed = exs.filter((ex: Exercise) => 
            userProgressData?.some((up: any) => up.test_series_id === ex.id && up.completed_at)
          ).length;
          
          return Math.round((completed / exs.length) * 100);
        };
        
        // Mettre à jour les états avec les données récupérées
        setComprehensionEcriteExercices(processExercises(exercisesData || [], 'comprehension_ecrite', userProgressData || []));
        setComprehensionOraleExercices(processExercises(exercisesData || [], 'comprehension_orale', userProgressData || []));
        setExpressionEcriteExercices(processExercises(exercisesData || [], 'expression_ecrite', userProgressData || []));
        setExpressionOraleExercices(processExercises(exercisesData || [], 'expression_orale', userProgressData || []));
        
        setSampleQuestions(questionsByCat);
        
        setUserProgress({
          comprehensionEcrite: calculateProgress('comprehension_ecrite'),
          comprehensionOrale: calculateProgress('comprehension_orale'),
          expressionEcrite: calculateProgress('expression_ecrite'),
          expressionOrale: calculateProgress('expression_orale'),
        });
        
      } catch (error: any) {
        console.error('Erreur lors du chargement des données:', error);
        setError(error.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercises();
  }, [user]);
  
  // Fonctions pour gérer l'enregistrement audio
  const handleStartRecording = () => {
    setRecordingStatus('recording');
    // Ici on pourrait implémenter la vraie fonctionnalité d'enregistrement
  };
  
  const handleStopRecording = () => {
    setRecordingStatus('idle');
    // Ici on arrêterait l'enregistrement
  };

  // Structure de base du composant avec quelques fonctions et placeholder pour les onglets
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 max-w-7xl">
          <h1 className="text-3xl font-bold mb-2">Préparation au TCF</h1>
          <p className="text-xl text-gray-600 mb-8">Test de Connaissance du Français</p>
          
          {/* Placeholder pour structure de base */}
          <div className="mt-8 grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Structure de base</CardTitle>
                <CardDescription>Ce fichier sert de structure de base pour reconstruire la page TCF</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Le fichier original contient des erreurs structurelles importantes qui nécessitent une reconstruction complète</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}
