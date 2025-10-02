"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Clock, Users, Target, CheckCircle, Star, MessageCircle, Calendar, Search, Filter } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function SujetsActualiteOraleePage() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedTache, setSelectedTache] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Données temporaires pour démonstration
  const sujetsParPeriode = [
    {
      year: 2024,
      month: "Décembre",
      sujets: [
        {
          id: 1,
          tache: "Tâche 2",
          titre: "Organiser une fête de fin d'année",
          description: "Vous organisez une fête de fin d'année au bureau et devez convaincre vos collègues de participer.",
          difficulte: "Intermédiaire",
          themes: ["Travail", "Événements", "Persuasion"]
        },
        {
          id: 2,
          tache: "Tâche 3",
          titre: "L'impact de l'intelligence artificielle sur l'emploi",
          description: "Pensez-vous que l'IA va créer plus d'emplois qu'elle n'en détruira ?",
          difficulte: "Avancé",
          themes: ["Technologie", "Emploi", "Société"]
        }
      ]
    },
    {
      year: 2024,
      month: "Novembre",
      sujets: [
        {
          id: 3,
          tache: "Tâche 2",
          titre: "Réclamation dans un restaurant",
          description: "Votre repas n'était pas satisfaisant et vous souhaitez obtenir un geste commercial.",
          difficulte: "Intermédiaire",
          themes: ["Service client", "Réclamation", "Négociation"]
        },
        {
          id: 4,
          tache: "Tâche 3",
          titre: "Le télétravail : avantages et inconvénients",
          description: "Le télétravail devrait-il devenir la norme dans toutes les entreprises ?",
          difficulte: "Intermédiaire",
          themes: ["Travail", "Société", "Modernité"]
        }
      ]
    },
    {
      year: 2024,
      month: "Octobre",
      sujets: [
        {
          id: 5,
          tache: "Tâche 2",
          titre: "Recherche d'appartement",
          description: "Vous contactez une agence immobilière pour trouver un logement adapté à vos besoins.",
          difficulte: "Débutant",
          themes: ["Logement", "Services", "Négociation"]
        },
        {
          id: 6,
          tache: "Tâche 3",
          titre: "L'importance de la protection de l'environnement",
          description: "Chacun devrait-il modifier son mode de vie pour protéger l'environnement ?",
          difficulte: "Intermédiaire",
          themes: ["Environnement", "Responsabilité", "Société"]
        }
      ]
    },
    {
      year: 2024,
      month: "Septembre",
      sujets: [
        {
          id: 7,
          tache: "Tâche 2",
          titre: "Inscription à un cours de langue",
          description: "Vous vous renseignez sur les cours de français disponibles dans une école de langues.",
          difficulte: "Débutant",
          themes: ["Éducation", "Services", "Information"]
        },
        {
          id: 8,
          tache: "Tâche 3",
          titre: "Les réseaux sociaux et la vie privée",
          description: "Les réseaux sociaux représentent-ils une menace pour notre vie privée ?",
          difficulte: "Avancé",
          themes: ["Technologie", "Vie privée", "Société"]
        }
      ]
    },
    {
      year: 2023,
      month: "Décembre",
      sujets: [
        {
          id: 9,
          tache: "Tâche 2",
          titre: "Échange d'un produit défectueux",
          description: "Vous retournez dans un magasin pour échanger un article qui ne fonctionne pas.",
          difficulte: "Intermédiaire",
          themes: ["Commerce", "Réclamation", "Service client"]
        },
        {
          id: 10,
          tache: "Tâche 3",
          titre: "L'éducation en ligne vs l'éducation traditionnelle",
          description: "L'enseignement à distance peut-il remplacer l'enseignement en présentiel ?",
          difficulte: "Avancé",
          themes: ["Éducation", "Technologie", "Société"]
        }
      ]
    }
  ];

  const years = Array.from(new Set(sujetsParPeriode.map(s => s.year))).sort((a, b) => b - a);

  const filteredSujets = sujetsParPeriode.filter(sujet => {
    const matchesYear = selectedYear === "all" || sujet.year.toString() === selectedYear;
    const matchesSearch = searchTerm === "" || 
      sujet.sujets.some(s => 
        s.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    if (selectedTache === "all") {
      return matchesYear && matchesSearch;
    } else {
      const hasTacheMatch = sujet.sujets.some(s => s.tache === selectedTache);
      return matchesYear && matchesSearch && hasTacheMatch;
    }
  });

  const getDifficultyColor = (difficulte: string) => {
    switch (difficulte) {
      case "Débutant": return "bg-green-100 text-green-800";
      case "Intermédiaire": return "bg-yellow-100 text-yellow-800";
      case "Avancé": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTacheColor = (tache: string) => {
    switch (tache) {
      case "Tâche 2": return "bg-blue-100 text-blue-800";
      case "Tâche 3": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalSujets = sujetsParPeriode.reduce((acc, periode) => acc + periode.sujets.length, 0);
  const totalTache2 = sujetsParPeriode.reduce((acc, periode) => 
    acc + periode.sujets.filter(s => s.tache === "Tâche 2").length, 0);
  const totalTache3 = sujetsParPeriode.reduce((acc, periode) => 
    acc + periode.sujets.filter(s => s.tache === "Tâche 3").length, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {/* Breadcrumb et Header */}
        <section className="w-full py-8 bg-white border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/expression-orale-tcf" className="hover:text-blue-600">
                Expression Orale TCF
              </Link>
              <span>/</span>
              <span className="text-gray-900">Sujets d'Actualité</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/expression-orale-tcf">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Sujets d'Actualité Expression Orale
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Entraînez-vous avec des sujets récents et variés pour les tâches 2 et 3 
                de l'expression orale du TCF Canada.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Statistiques */}
        <section className="w-full py-12 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{totalSujets}</div>
                  <div className="text-sm text-gray-600">Sujets disponibles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{totalTache2}</div>
                  <div className="text-sm text-gray-600">Tâche 2 (Interaction)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{totalTache3}</div>
                  <div className="text-sm text-gray-600">Tâche 3 (Point de vue)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">2</div>
                  <div className="text-sm text-gray-600">Années couvertes</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filtres */}
        <section className="w-full py-8 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Filtres :</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un sujet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Année" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTache} onValueChange={setSelectedTache}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Tâche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="Tâche 2">Tâche 2</SelectItem>
                      <SelectItem value="Tâche 3">Tâche 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Liste des sujets */}
        <section className="w-full py-8 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              {filteredSujets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">Aucun sujet trouvé avec ces filtres</div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedYear("all");
                      setSelectedTache("all");
                      setSearchTerm("");
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredSujets.map((periode, index) => (
                    <motion.div
                      key={`${periode.year}-${periode.month}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">
                              {periode.month} {periode.year}
                            </CardTitle>
                            <Badge variant="outline">
                              {periode.sujets.filter(s => 
                                selectedTache === "all" || s.tache === selectedTache
                              ).length} sujets
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {periode.sujets
                              .filter(sujet => selectedTache === "all" || sujet.tache === selectedTache)
                              .map((sujet) => (
                              <Card key={sujet.id} className="border border-gray-200">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-lg leading-tight">
                                      {sujet.titre}
                                    </CardTitle>
                                    <div className="flex flex-col gap-1">
                                      <Badge className={getTacheColor(sujet.tache)}>
                                        {sujet.tache}
                                      </Badge>
                                      <Badge className={getDifficultyColor(sujet.difficulte)}>
                                        {sujet.difficulte}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <p className="text-gray-600 mb-3 text-sm">
                                    {sujet.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {sujet.themes.map((theme, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {theme}
                                      </Badge>
                                    ))}
                                  </div>
                                  <Button size="sm" variant="outline" className="w-full">
                                    <MessageCircle className="h-3 w-3 mr-2" />
                                    Voir les corrections
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Information sur les tâches */}
        <section className="w-full py-16 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Comprendre les Tâches
                </h2>
                <p className="text-lg text-gray-600">
                  Rappel des spécificités de chaque tâche d'expression orale
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">2</span>
                      </div>
                      Tâche 2 - Exercice en interaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-blue-500 mt-1" />
                        <span className="text-sm"><strong>Durée :</strong> 5 minutes 30</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-500 mt-1" />
                        <span className="text-sm"><strong>Objectif :</strong> Jeu de rôle dans une situation quotidienne</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />
                        <span className="text-sm"><strong>Compétences :</strong> Interaction, négociation, adaptation</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">3</span>
                      </div>
                      Tâche 3 - Expression d'un point de vue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-purple-500 mt-1" />
                        <span className="text-sm"><strong>Durée :</strong> 4 minutes 30 + 10 min préparation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-purple-500 mt-1" />
                        <span className="text-sm"><strong>Objectif :</strong> Présenter et défendre un point de vue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-500 mt-1" />
                        <span className="text-sm"><strong>Compétences :</strong> Argumentation, structure, exemples</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 bg-blue-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Besoin d'aide pour vous entraîner ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Nos formateurs vous accompagnent dans la pratique de l'expression orale 
                avec des corrections personnalisées et des conseils d'experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/expression-orale-tcf/formations">
                    <Users className="h-5 w-5 mr-2" />
                    Découvrir nos Formations
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite des informations sur les sujets d'actualité pour l'expression orale TCF Canada."}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Nous Contacter
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}
