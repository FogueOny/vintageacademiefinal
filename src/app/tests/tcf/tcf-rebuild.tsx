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
      } finally {
        setLoading(false);
      }
    };
    
    checkLoginStatus();
  }, []);
  
  // Rendu conditionnel selon connexion utilisateur
  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-6 text-center">
          <div className="mb-4">
            <Image 
              src="/logo.png" 
              alt="Vintage Académie Logo" 
              width={150}
              height={60}
              className="mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Accès Restreint</h2>
          <p className="text-gray-600">
            Vous devez être connecté pour accéder aux tests TCF. Veuillez vous connecter ou vous inscrire pour continuer.
          </p>
          <div className="pt-4 space-x-4">
            <Button>Se connecter</Button>
            <Button variant="outline">S'inscrire</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Version minimale du reste de la page pendant le chargement
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 max-w-7xl">
          <h1 className="text-3xl font-bold mb-2">Préparation au TCF</h1>
          <p className="text-xl text-gray-600 mb-8">Test de Connaissance du Français</p>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
              <p className="text-gray-600">Chargement de vos exercices...</p>
            </div>
          ) : (
            <Tabs defaultValue="comprehension-ecrite" className="space-y-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <TabsTrigger value="comprehension-ecrite" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> 
                  <span className="hidden md:inline">Compréhension Écrite</span>
                  <span className="md:hidden">C. Écrite</span>
                </TabsTrigger>
                <TabsTrigger value="comprehension-orale" className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" /> 
                  <span className="hidden md:inline">Compréhension Orale</span>
                  <span className="md:hidden">C. Orale</span>
                </TabsTrigger>
                <TabsTrigger value="expression-ecrite" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> 
                  <span className="hidden md:inline">Expression Écrite</span>
                  <span className="md:hidden">E. Écrite</span>
                </TabsTrigger>
                <TabsTrigger value="expression-orale" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" /> 
                  <span className="hidden md:inline">Expression Orale</span>
                  <span className="md:hidden">E. Orale</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Placeholder pour le contenu des onglets */}
              <TabsContent value="comprehension-ecrite">
                <Card>
                  <CardHeader>
                    <CardTitle>Compréhension Écrite</CardTitle>
                    <CardDescription>
                      Les exercices de cette section seront disponibles prochainement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Bientôt disponible</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="comprehension-orale">
                <Card>
                  <CardHeader>
                    <CardTitle>Compréhension Orale</CardTitle>
                    <CardDescription>
                      Les exercices de cette section seront disponibles prochainement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Bientôt disponible</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="expression-ecrite">
                <Card>
                  <CardHeader>
                    <CardTitle>Expression Écrite</CardTitle>
                    <CardDescription>
                      Les exercices de cette section seront disponibles prochainement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Bientôt disponible</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="expression-orale">
                <Card>
                  <CardHeader>
                    <CardTitle>Expression Orale</CardTitle>
                    <CardDescription>
                      Les exercices de cette section seront disponibles prochainement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Bientôt disponible</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}
