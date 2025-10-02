"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Headphones, MessageSquare, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { User } from '@supabase/supabase-js';
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { ProfessionalFooter } from "@/components/professional-footer";

// Données statiques des modules (pour garantir l'affichage même en cas d'erreur)
const moduleData = [
  {
    id: "comprehension_ecrite",
    title: "Compréhension Écrite",
    description: "Lisez des textes et répondez aux questions pour évaluer votre compréhension de l'écrit",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700",
    path: "/comprehension-ecrite"
  },
  {
    id: "comprehension_orale",
    title: "Compréhension Orale",
    description: "Écoutez des enregistrements audio et répondez aux questions pour évaluer votre compréhension orale",
    icon: Headphones,
    color: "bg-amber-100 text-amber-700",
    path: "/comprehension-orale"
  },
  {
    id: "expression_ecrite",
    title: "Expression Écrite",
    description: "Rédigez des textes sur différents sujets pour évaluer votre capacité à vous exprimer à l'écrit",
    icon: FileText,
    color: "bg-green-100 text-green-700",
    path: "/expression-ecrite"
  },
  {
    id: "expression_orale",
    title: "Expression Orale",
    description: "Présentez des sujets à l'oral pour évaluer votre capacité à vous exprimer verbalement",
    icon: MessageSquare,
    color: "bg-purple-100 text-purple-700",
    path: "/expression-orale"
  }
];

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

export default function TCFTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const { data: { session } } = await supabase().auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Erreur de session:", error);
      }
    };
    
    checkLoginStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero section */}
      <section className="relative bg-gradient-to-b from-orange-50 to-white py-12 mb-8">
        <div className="container px-4 md:px-6">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Test de Connaissance du Français (TCF)
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Préparez-vous efficacement au TCF avec nos exercices d'entraînement adaptés à tous les niveaux
            </p>
            {!user && (
              <Link href="/auth/login">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Connectez-vous pour commencer
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Video explicative */}
      <section className="container px-4 md:px-6 my-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
            Qu'est-ce que le TCF?
          </h2>
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/2D9ZzsvLVFw" 
              title="Présentation du TCF" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Modules cards - version statique uniquement */}
      <section className="container px-4 md:px-6 my-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Modules d'entraînement TCF
        </h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {moduleData.map((module) => {
            const ModuleIcon = module.icon;
            
            return (
              <motion.div key={module.id} variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className={`p-3 inline-flex rounded-lg ${module.color} mb-3`}>
                      <ModuleIcon className="h-6 w-6" />
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Contenu statique - pas de progression */}
                  </CardContent>
                  
                  <CardFooter>
                    {user ? (
                      <Link href={module.path} className="w-full" onClick={() => console.log(`Navigation vers: ${module.path}`)}>
                        <Button className="w-full gap-2">
                          Commencer
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/login" className="w-full">
                        <Button variant="outline" className="w-full">
                          Connectez-vous pour accéder
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
      
      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}
