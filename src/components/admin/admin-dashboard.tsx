"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Users, 
  Upload, 
  Settings,
  Database,
  BarChart3
} from "lucide-react";
import { ModulesManager } from "./modules-manager";
import { TestSeriesManager } from "./test-series-manager";
import QuestionsManager from "./questions-manager";
import { UsersManager } from "./users-manager";
import { DataImporter } from "./data-importer";
import { DatabaseTest } from "./database-test";

function PermissionsTest() {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-6 w-6 text-orange-600" />
        <div>
          <h3 className="text-lg font-semibold">Test des permissions</h3>
          <p className="text-sm text-gray-600">Diagnostic et dépannage</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600 mb-4">
            Cette section permet de tester les permissions et diagnostiquer les problèmes de connectivité.
          </p>
          <Badge variant="secondary">Outils de diagnostic</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("modules");
  
  const tabs = [
    {
      value: "modules",
      label: "Modules",
      icon: <BookOpen className="h-4 w-4" />,
      title: "Gestion des modules",
      description: "Créer et gérer les modules de formation",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      value: "test-series",
      label: "Séries de tests",
      icon: <FileText className="h-4 w-4" />,
      title: "Gestion des séries de tests",
      description: "Créer et organiser les séries de tests",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      value: "questions",
      label: "Questions",
      icon: <HelpCircle className="h-4 w-4" />,
      title: "Gestion des questions",
      description: "Ajouter et modifier les questions des tests",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      value: "users",
      label: "Utilisateurs",
      icon: <Users className="h-4 w-4" />,
      title: "Gestion des utilisateurs",
      description: "Gérer les utilisateurs et leurs permissions",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      value: "import",
      label: "Importation",
      icon: <Upload className="h-4 w-4" />,
      title: "Importation de données",
      description: "Importer des données depuis des fichiers CSV/Excel",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      value: "debug",
      label: "Debug",
      icon: <Settings className="h-4 w-4" />,
      title: "Outils de diagnostic",
      description: "Diagnostic et dépannage",
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    },
    {
      value: "test-db",
      label: "Test DB",
      icon: <Database className="h-4 w-4" />,
      title: "Test de base de données",
      description: "Tester les permissions et la connectivité",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const currentTab = tabs.find(tab => tab.value === activeTab);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Modules actifs</p>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Séries de tests</p>
                <p className="text-2xl font-bold text-green-600">48</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-purple-600">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-orange-600">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {currentTab?.icon}
            <div>
              <CardTitle className="text-xl">{currentTab?.title}</CardTitle>
              <CardDescription>{currentTab?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="grid grid-cols-7 h-auto bg-transparent border-0 p-0">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 hover:bg-gray-50 ${tab.color}`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="modules" className="mt-0">
                <ModulesManager />
              </TabsContent>
              
              <TabsContent value="test-series" className="mt-0">
                <TestSeriesManager />
              </TabsContent>
              
              <TabsContent value="questions" className="mt-0">
                <div className="min-h-[400px]">
                  <QuestionsManager />
                </div>
              </TabsContent>
              
              <TabsContent value="users" className="mt-0">
                <UsersManager />
              </TabsContent>
              
              <TabsContent value="import" className="mt-0">
                <DataImporter />
              </TabsContent>
              
              <TabsContent value="debug" className="mt-0">
                <PermissionsTest />
              </TabsContent>
              
              <TabsContent value="test-db" className="mt-0">
                <DatabaseTest />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
