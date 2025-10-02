"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, Award, Volume2, Pen } from "lucide-react";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { ProfessionalFooter } from "@/components/professional-footer";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function TestsPage() {
  const [user, setUser] = useState<any>(null);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const { data: { session } } = await supabase().auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Erreur de vérification de session:", error);
      }
    };
    
    checkLoginStatus();
  }, []);

  // Tests disponibles - structure de données
  const tests = [
    {
      id: "tcf",
      title: "TCF Canada",
      description: "Test de Connaissance du Français pour l'immigration au Canada",
      icon: <BookOpen className="w-10 h-10 text-orange-500" />,
      href: "/tests/tcf",
      color: "orange"
    },
    {
      id: "tef",
      title: "TEF Canada",
      description: "Test d'Évaluation de Français pour l'immigration au Canada",
      icon: <BookOpen className="w-10 h-10 text-blue-500" />,
      href: "/tests/tef",
      color: "blue"
    },
    {
      id: "co",
      title: "Compréhension Orale",
      description: "Exercices pour améliorer votre compréhension orale",
      icon: <Volume2 className="w-10 h-10 text-green-500" />,
      href: "/comprehension-orale",
      color: "green"
    },
    {
      id: "ce",
      title: "Compréhension Écrite",
      description: "Exercices pour améliorer votre compréhension écrite",
      icon: <BookOpen className="w-10 h-10 text-purple-500" />,
      href: "/tests/comprehension-ecrite",
      color: "purple"
    },
    {
      id: "eo",
      title: "Expression Orale",
      description: "Exercices pour améliorer votre expression orale",
      icon: <Volume2 className="w-10 h-10 text-indigo-500" />,
      href: "/tests/expression-orale",
      color: "indigo"
    },
    {
      id: "ee",
      title: "Expression Écrite",
      description: "Exercices pour améliorer votre expression écrite",
      icon: <Pen className="w-10 h-10 text-pink-500" />,
      href: "/tests/expression-ecrite",
      color: "pink"
    }
  ];

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Accès Restreint</h1>
          <p className="text-lg text-gray-600 mb-8">
            Vous devez être connecté pour accéder aux tests. Veuillez vous connecter ou vous inscrire pour continuer.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button className="bg-orange-500 hover:bg-orange-600">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        {/* En-tête de page */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-16">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Passer un Test</h1>
              <p className="text-xl text-gray-600 mb-8">
                Sélectionnez le type de test que vous souhaitez passer ou la compétence que vous désirez améliorer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Grille de tests disponibles */}
        <section className="py-12 container mx-auto px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tests.map((test) => (
              <motion.div key={test.id} variants={fadeIn}>
                <Link href={test.href}>
                  <Card className={`hover:shadow-lg transition-shadow hover:border-${test.color}-300 h-full cursor-pointer`}>
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className={`p-2 rounded-lg bg-${test.color}-50`}>
                        {test.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{test.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{test.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      <div className={`text-${test.color}-600 font-medium flex items-center`}>
                        Commencer <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}