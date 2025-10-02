"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Users, Upload, Database, Settings } from "lucide-react";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Gérer les modules",
      description: "Créer et modifier les modules de formation",
      icon: <BookOpen className="h-4 w-4" />,
      onClick: () => router.push("/admin-dashboard/modules"),
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Gérer les séries",
      description: "Organiser les séries de tests",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => router.push("/admin-dashboard/test-series"),
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Gérer les utilisateurs",
      description: "Gérer les comptes utilisateurs",
      icon: <Users className="h-4 w-4" />,
      onClick: () => router.push("/admin-dashboard/users"),
      color: "bg-orange-600 hover:bg-orange-700"
    },
    {
      title: "Importation",
      description: "Importer des données depuis des fichiers",
      icon: <Upload className="h-4 w-4" />,
      onClick: () => router.push("/admin-dashboard/import"),
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Base de données",
      description: "Gérer et optimiser la base de données",
      icon: <Database className="h-4 w-4" />,
      onClick: () => router.push("/admin-dashboard/database"),
      color: "bg-red-600 hover:bg-red-700"
    },
    {
      title: "Paramètres",
      description: "Configurer l'application",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => router.push("/admin-dashboard/settings"),
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Actions rapides</span>
            <div className="h-1 w-1 bg-orange-500 rounded-full"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={`w-full h-auto p-4 flex flex-col items-center space-y-2 text-white ${action.color} transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-center space-x-2">
                  {action.icon}
                  <span className="font-medium">{action.title}</span>
                </div>
                <p className="text-xs opacity-90 text-center">{action.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 