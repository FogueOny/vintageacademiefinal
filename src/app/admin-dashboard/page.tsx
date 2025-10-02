'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RecentActivity } from "@/components/admin/recent-activity";

export default function AdminDashboardPage() {
  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
            <p className="text-gray-600">Bienvenue dans l'interface d'administration</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Système opérationnel</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Statistiques */}
        <DashboardStats />

        {/* Contenu principal */}
        <div className="mt-8">
          <RecentActivity />
        </div>
      </div>
    </>
  );
}