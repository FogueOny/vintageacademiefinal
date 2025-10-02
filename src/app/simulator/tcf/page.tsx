"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  BookOpen, 
  Headphones, 
  PenTool, 
  Mic, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Users,
  Star,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

export default function TCFSimulatorPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartSimulation = () => {
    setIsStarting(true);
    // Redirection vers le simulateur (à implémenter)
    setTimeout(() => {
      router.push('/simulator/tcf/exam');
    }, 1000);
  };

  const examSections = [
    {
      name: "Compréhension Écrite",
      icon: <BookOpen className="h-6 w-6" />,
      duration: "60 minutes",
      questions: "30 questions",
      description: "Évaluation de votre capacité à comprendre des textes écrits en français",
      color: "bg-blue-500"
    },
    {
      name: "Compréhension Orale",
      icon: <Headphones className="h-6 w-6" />,
      duration: "25 minutes",
      questions: "29 questions",
      description: "Test de votre compréhension de l'oral à travers des enregistrements",
      color: "bg-green-500"
    },
    {
      name: "Expression Écrite",
      icon: <PenTool className="h-6 w-6" />,
      duration: "60 minutes",
      questions: "2 tâches",
      description: "Évaluation de votre capacité à rédiger des textes en français",
      color: "bg-purple-500"
    },
    {
      name: "Expression Orale",
      icon: <Mic className="h-6 w-6" />,
      duration: "12 minutes",
      questions: "3 tâches",
      description: "Test de votre expression orale en français",
      color: "bg-orange-500"
    }
  ];

  const features = [
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Chronomètre Officiel",
      description: "Timing exact comme au vrai examen TCF Canada"
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Navigation Réaliste",
      description: "Interface identique aux centres d'examen officiels"
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Score Estimé TCF",
      description: "Estimation de votre score officiel TCF Canada"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Points Immigration",
      description: "Calcul des points pour l'immigration Canada/Québec"
    }
  ];

  const stats = [
    { icon: <Users className="h-4 w-4" />, value: "2,500+", label: "Simulations passées" },
    { icon: <Star className="h-4 w-4" />, value: "4.8/5", label: "Note moyenne" },
    { icon: <Target className="h-4 w-4" />, value: "85%", label: "Taux de réussite" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-4">
              <Award className="h-4 w-4 mr-2" />
              Simulateur Officiel
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Simulateur TCF Canada
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Passez le Test de Connaissance du Français dans des conditions identiques 
              aux centres d'examen officiels. Préparez-vous pour l'immigration Canada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={handleStartSimulation}
                disabled={isStarting}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Préparation...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Commencer la Simulation
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="lg" className="px-8 py-3">
                Voir les Instructions
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>

      {/* Sections de l'examen */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Structure de l'Examen TCF Canada
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {examSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-12 h-12 rounded-full ${section.color} flex items-center justify-center mx-auto mb-4`}>
                      <div className="text-white">
                        {section.icon}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {section.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {section.duration}
                      </div>
                      <div className="flex items-center justify-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {section.questions}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      {section.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Fonctionnalités */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Fonctionnalités du Simulateur
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <div className="text-orange-600">
                            {feature.icon}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Avertissement */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-2">
                    Important
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Ce simulateur reproduit fidèlement les conditions du vrai examen TCF Canada. 
                    Une fois commencé, vous ne pourrez pas revenir en arrière. 
                    Assurez-vous d'être prêt et dans un environnement calme.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 