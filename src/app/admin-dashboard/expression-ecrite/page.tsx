"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Users, BarChart3, Download, Upload } from "lucide-react";
import { toast, Toaster } from "sonner";
import { ExpressionEcritePeriod } from "@/types/expression-ecrite";

// Importation des composants modulaires
import PeriodsManager from "@/components/admin/expression-ecrite/periods-manager";
import { CombinationsManager } from "@/components/admin/expression-ecrite/combinations-manager";
import { TasksManager } from "@/components/admin/expression-ecrite/tasks-manager";
import { CorrectionsManager } from "@/components/admin/expression-ecrite/corrections-manager";

export default function ExpressionEcriteAdminPage() {
  const [periods, setPeriods] = useState<ExpressionEcritePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPeriods: 0,
    totalCombinations: 0,
    totalTasks: 0,
    totalCorrections: 0
  });

  useEffect(() => {
    // Chargement des périodes depuis Supabase
    const loadData = async () => {
      setLoading(true);
      
      try {
        const { getAllPeriods } = await import('@/lib/supabase/expression-ecrite-utils');
        const response = await getAllPeriods();
        
        if (response.error) {
          console.error('Erreur lors du chargement des périodes:', response.error);
          toast.error(`Erreur: ${response.error}`);
          setPeriods([]);
          
          // Même en cas d'erreur, mettre à jour les statistiques avec des valeurs vides
          setStats({
            totalPeriods: 0,
            totalCombinations: 0,
            totalTasks: 0,
            totalCorrections: 0
          });
        } else if (response.data) {
          // Tri des périodes par année décroissante puis par mois décroissant
          const sortedPeriods = [...response.data].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
            return months.indexOf(b.month) - months.indexOf(a.month);
          });
          
          setPeriods(sortedPeriods);
          
          // Mettre à jour les statistiques avec les données récupérées
          const totalCombinations = response.data.reduce((acc, period) => acc + (period.total_combinations || 0), 0);
          
          setStats({
            totalPeriods: response.data.length,
            totalCombinations,
            totalTasks: totalCombinations * 3, // Approximation: 3 tâches par combinaison
            totalCorrections: Math.floor(totalCombinations * 1.5) // Approximation: ~1.5 corrections par combinaison
          });
        } else {
          setPeriods([]);
          
          // En cas de réponse vide, mettre à jour les statistiques avec des valeurs vides
          setStats({
            totalPeriods: 0,
            totalCombinations: 0,
            totalTasks: 0,
            totalCorrections: 0
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des périodes:', error);
        toast.error('Impossible de charger les périodes. Veuillez réessayer.');
        setPeriods([]);
        
        // En cas d'exception, mettre à jour les statistiques avec des valeurs vides
        setStats({
          totalPeriods: 0,
          totalCombinations: 0,
          totalTasks: 0,
          totalCorrections: 0
        });
      }
      
      setLoading(false);
    };
    
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expression Écrite TCF</h1>
          <p className="text-gray-600">Gestion des sujets, combinaisons et tâches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Périodes</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalPeriods}</div>
            <p className="text-xs text-gray-600">Total des périodes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combinaisons</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalCombinations}</div>
            <p className="text-xs text-gray-600">Total des combinaisons</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalTasks}</div>
            <p className="text-xs text-gray-600">Total des tâches</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corrections</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalCorrections}</div>
            <p className="text-xs text-gray-600">Total des corrections</p>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Tabs defaultValue="periods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="periods">Périodes</TabsTrigger>
          <TabsTrigger value="combinations">Combinaisons</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="corrections">Corrections</TabsTrigger>
        </TabsList>

        {/* Onglet Périodes */}
        <TabsContent value="periods" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données...</p>
            </div>
          ) : (
            <PeriodsManager 
              initialPeriods={periods} 
              onPeriodsChange={(updatedPeriods: ExpressionEcritePeriod[]) => {
                setPeriods(updatedPeriods);
                const totalCombinations = updatedPeriods.reduce((acc: number, period: ExpressionEcritePeriod) => acc + period.total_combinations, 0);
                const totalTasks = totalCombinations * 3;
                const totalCorrections = Math.round(totalTasks * 1.3);
                setStats({
                  totalPeriods: updatedPeriods.length,
                  totalCombinations,
                  totalTasks,
                  totalCorrections
                });
              }} 
            />
          )}
        </TabsContent>

        {/* Onglet Combinaisons */}
        <TabsContent value="combinations" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données...</p>
            </div>
          ) : (
            <CombinationsManager periods={periods} />
          )}
        </TabsContent>

        {/* Onglet Tâches */}
        <TabsContent value="tasks" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données...</p>
            </div>
          ) : (
            <TasksManager periods={periods} />
          )}
        </TabsContent>

        {/* Onglet Corrections */}
        <TabsContent value="corrections" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données...</p>
            </div>
          ) : (
            <CorrectionsManager periods={periods} />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Toaster pour les notifications */}
      <Toaster position="top-right" />
    </div>
  );
} 