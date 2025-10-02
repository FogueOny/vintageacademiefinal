"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, FileText, Search, Filter, ChevronRight, Clock, Target } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { useState, useEffect } from "react";
import { getAllPeriods, getCombinationsByPeriod, getTasksByCombination } from "@/lib/supabase/expression-ecrite-utils";
import { getAllPeriodCorrectionCounts } from "@/lib/supabase/expression-ecrite-corrections-utils";
import { ExpressionEcritePeriod } from "@/types/expression-ecrite";
import { generatePeriodSlug } from "@/lib/utils/slug-utils";

// Type pour les données formatées pour l'affichage
type PeriodeFormatted = {
  id: string;
  month: string;
  year: number;
  slug: string;
  combinationsCount: number;
  correctionsCount: number;
  isRecent: boolean;
};

export default function CorrectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);
  const [periodes, setPeriodes] = useState<PeriodeFormatted[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [navigating, setNavigating] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  useEffect(() => {
    async function loadPeriodes() {
      try {
        setLoading(true);
        const { data: periods, error } = await getAllPeriods();
        
        if (error || !periods) {
          console.error("Erreur lors du chargement des périodes:", error);
          setLoading(false);
          return;
        }

        // Récupérer le nombre de corrections pour chaque période
        const { data: correctionCounts } = await getAllPeriodCorrectionCounts();
        const periodCorrections = correctionCounts || {};

        // Déterminer si une période est récente (dans les 3 derniers mois)
        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
        
        // Format des périodes pour l'affichage
        const formattedPeriods: PeriodeFormatted[] = await Promise.all(periods.map(async (period) => {
          // Récupérer les combinaisons pour cette période
          const { data: combinations } = await getCombinationsByPeriod(period.id);
          const combinationsCount = combinations?.length || 0;
          
          // Utiliser le nombre réel de corrections depuis la base de données
          const correctionsCount = periodCorrections[period.id] || 0;
          
          // Déterminer si la période est récente
          const periodDate = new Date(period.year, getMonthIndex(period.month), 1);
          const isRecent = periodDate >= threeMonthsAgo;
          
          return {
            id: period.id,
            month: capitalizeFirstLetter(period.month),
            year: period.year,
            slug: period.slug,
            combinationsCount,
            correctionsCount,
            isRecent
          };
        }));

        // Trier par année puis par mois (plus récents en premier)
        const sortedPeriods = formattedPeriods.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return getMonthIndex(b.month) - getMonthIndex(a.month);
        });

        setPeriodes(sortedPeriods);
        
        // Extraire les années uniques pour le filtre
        const uniqueYears = Array.from(new Set(sortedPeriods.map(p => p.year))).sort((a, b) => b - a);
        setYears(uniqueYears);
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    }

    loadPeriodes();
  }, []);

  // Fonctions utilitaires
  function getMonthIndex(month: string): number {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return months.indexOf(month.toLowerCase());
  }

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Filtres
  const filteredPeriodes = periodes.filter(periode => {
    const matchesSearch = searchTerm === "" || 
      periode.month.toLowerCase().includes(searchTerm.toLowerCase()) || 
      periode.year.toString().includes(searchTerm);
    
    const matchesYear = selectedYear === "all" || periode.year.toString() === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  return (
    <>
      <div className="container max-w-6xl px-4 py-6 md:py-10">
        {/* Titre et navigation */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <Link 
                href="/expression-ecrite-tcf" 
                className="text-slate-600 hover:text-slate-900 flex items-center text-sm mb-2"
              >
                <ArrowLeft size={16} className="mr-1" /> Retour à Expression Écrite TCF
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Corrections d&apos;Expression Écrite</h1>
              <p className="mt-2 text-slate-600 md:text-lg max-w-3xl">
                Consultez les corrections complètes et détaillées des sujets d&apos;expression écrite du TCF Canada.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filtres */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Rechercher..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Liste des périodes */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-40 bg-slate-200 rounded"></div>
                <div className="h-40 bg-slate-200 rounded"></div>
                <div className="h-40 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : filteredPeriodes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-slate-800 mb-2">Aucune période trouvée</h3>
            <p className="text-slate-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${navigating ? 'pointer-events-none select-none' : ''}`}
          >
            {filteredPeriodes.map((periode) => {
              // Génération du slug standardisé, utiliser le slug existant comme fallback
              const standardSlug = generatePeriodSlug(periode.month, periode.year);
              const slug = standardSlug || periode.slug;
              console.log(`Période: ${periode.month} ${periode.year}, Slug généré: ${standardSlug}, Slug utilisé: ${slug}`);
              
              return (
              <Link key={periode.id} href={`/expression-ecrite-tcf/corrections/${slug}`} onClick={() => setNavigating(true)}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">
                        {periode.month} {periode.year}
                      </CardTitle>
                      {periode.isRecent && (
                        <Badge className="bg-amber-500 hover:bg-amber-600">Récent</Badge>
                      )}
                    </div>
                    <CardDescription>
                      <span className="mt-1 inline-flex items-center">
                        <FileText size={16} className="mr-1" />
                        <span>{periode.combinationsCount} combinaison{periode.combinationsCount > 1 ? 's' : ''}</span>
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <Target size={14} className="text-emerald-600" /> 
                        <span>{periode.correctionsCount} correction{periode.correctionsCount > 1 ? 's' : ''} disponible{periode.correctionsCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-2" variant="default" disabled={navigating}>
                      Voir les corrections <ChevronRight className="ml-1" size={16} />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
              );
            })
            }
          </motion.div>
        )}
      </div>
      {navigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary"></div>
            <p className="mt-3 text-white">Chargement…</p>
          </div>
        </div>
      )}
      <ProfessionalFooter />
      <FloatingWhatsAppButton />
    </>
  );
}
