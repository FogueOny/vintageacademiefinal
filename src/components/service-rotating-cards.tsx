"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe2, Languages, Monitor, Award, Calendar, Users, Star, Clock, CheckCircle2, Sparkles } from "lucide-react";

// Définition des services
const services = [
  {
    title: "Test de Connaissance du Français (TCF)",
    description: "L'examen officiel pour l'immigration au Canada et au Québec. Maximisez vos points avec notre préparation intensive.",
    icon: <Languages className="h-6 w-6 text-orange-500" />,
    bgPattern: "radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 40%)",
    color: "from-orange-500 to-orange-600",
    textColor: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-500",
    badgeText: "Session Prochaine: 3 Juillet",
    link: "/services/tcf",
    linkText: "Réserver une place",
    stats: [
      { icon: <Users className="h-4 w-4" />, value: "97%", label: "Taux de réussite" },
      { icon: <Star className="h-4 w-4" />, value: "B2+", label: "Niveau moyen" },
      { icon: <Clock className="h-4 w-4" />, value: "3h", label: "Durée de l'examen" }
    ]
  },
  {
    title: "Test d'Évaluation de Français (TEF)",
    description: "La certification reconnue pour l'immigration et les études supérieures. Entraînement complet aux 4 compétences.",
    icon: <Languages className="h-6 w-6 text-blue-500" />,
    bgPattern: "radial-gradient(circle at top left, rgba(255,255,255,0.2) 0%, transparent 40%)",
    color: "from-blue-500 to-blue-600",
    textColor: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
    badgeText: "Session Prochaine: 10 Juillet",
    link: "/services/tef",
    linkText: "Réserver une place",
    stats: [
      { icon: <Users className="h-4 w-4" />, value: "95%", label: "Taux de réussite" },
      { icon: <Star className="h-4 w-4" />, value: "7/10", label: "Score moyen" },
      { icon: <Clock className="h-4 w-4" />, value: "2h30", label: "Durée de l'examen" }
    ]
  },
  {
    title: "ICE Certification",
    description: "Certification internationale reconnue pour les professionnels. Valorisez votre parcours avec une attestation de prestige.",
    icon: <Award className="h-6 w-6 text-purple-500" />,
    bgPattern: "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
    color: "from-purple-500 to-purple-600",
    textColor: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-500",
    badgeText: "Sur demande",
    link: "/services/ice-certification",
    linkText: "Demander un devis",
    stats: [
      { icon: <Users className="h-4 w-4" />, value: "350+", label: "Certifiés" },
      { icon: <Star className="h-4 w-4" />, value: "100%", label: "Reconnaissance" },
      { icon: <Clock className="h-4 w-4" />, value: "2j", label: "Formation" }
    ]
  },
  {
    title: "Immigration Canada",
    description: "Un accompagnement personnalisé pour votre projet d'immigration. De l'évaluation initiale au suivi du dossier.",
    icon: <Globe2 className="h-6 w-6 text-red-500" />,
    bgPattern: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 60%)",
    color: "from-red-500 to-red-600",
    textColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-500",
    badgeText: "Consultations ouvertes",
    link: "/services/immigration-canada",
    linkText: "Prendre rendez-vous",
    stats: [
      { icon: <Users className="h-4 w-4" />, value: "780+", label: "Clients accompagnés" },
      { icon: <Star className="h-4 w-4" />, value: "98%", label: "Satisfaction" },
      { icon: <Calendar className="h-4 w-4" />, value: "10 ans", label: "Expérience" }
    ]
  },
  {
    title: "Développement Web",
    description: "Solutions numériques adaptées à vos besoins professionnels. Site vitrine, e-commerce ou application sur mesure.",
    icon: <Monitor className="h-6 w-6 text-green-500" />,
    bgPattern: "linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
    color: "from-green-500 to-green-600",
    textColor: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-500",
    badgeText: "Devis gratuit",
    link: "/services/developpement-web",
    linkText: "Voir notre portfolio",
    stats: [
      { icon: <Users className="h-4 w-4" />, value: "120+", label: "Projets livrés" },
      { icon: <Star className="h-4 w-4" />, value: "4.9/5", label: "Évaluation clients" },
      { icon: <Clock className="h-4 w-4" />, value: "5j", label: "Délai moyen" }
    ]
  }
];

export function ServiceRotatingCards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Effet pour changer automatiquement l'index toutes les 2 secondes
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % services.length);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isPaused]);
  
  return (
    <div 
      className="relative w-full max-w-[500px] lg:w-[550px] h-[350px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <Card className={`h-full overflow-hidden ${services[currentIndex].borderColor} rounded-xl bg-white shadow-xl flex flex-col`}>
            {/* Header avec gradient et badge */}
            <div 
              className={`relative h-[80px] bg-gradient-to-r ${services[currentIndex].color} p-4 flex items-center overflow-hidden`}
              style={{ backgroundImage: services[currentIndex].bgPattern }}
            >
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: services[currentIndex].bgPattern }}></div>
              
              <div className="flex items-center gap-3 z-10 w-full">
                <div className={`p-2 rounded-full bg-white/90 ${services[currentIndex].textColor}`}>
                  {services[currentIndex].icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{services[currentIndex].title}</h3>
                </div>
              </div>
            </div>
            
            {/* Badge calendrier */}
            <Badge className="absolute top-2 right-2 bg-white/90 text-gray-800 border-0">
              {services[currentIndex].badgeText}
            </Badge>
            
            {/* Contenu */}
            <div className="p-4 flex-1">
              <p className="text-gray-700">
                {services[currentIndex].description}
              </p>
              
              {/* Statistiques */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {services[currentIndex].stats.map((stat, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-lg ${services[currentIndex].bgColor} flex flex-col items-center text-center`}
                  >
                    <div className={services[currentIndex].textColor}>
                      {stat.icon}
                    </div>
                    <span className="font-bold">{stat.value}</span>
                    <span className="text-xs text-gray-600">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer avec navigation */}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex space-x-1">
                {services.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex ? `w-6 bg-gradient-to-r ${services[currentIndex].color}` : "w-2 bg-gray-300"
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Voir le service ${idx + 1}`}
                  />
                ))}
              </div>
              
              <Link href={services[currentIndex].link}>
                <Button 
                  size="sm"
                  className={`bg-gradient-to-r ${services[currentIndex].color} text-white hover:opacity-90 group`}
                >
                  {services[currentIndex].linkText}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
