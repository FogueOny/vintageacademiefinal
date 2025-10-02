"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText, BookOpen } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'user_registration' | 'test_completion' | 'module_creation' | 'question_added';
  description: string;
  timestamp: string;
  user_email?: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) return;

        // Récupérer les utilisateurs récents
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        // Récupérer les séries de tests récentes
        const { data: recentTestSeries } = await supabase
          .from('test_series')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        // Simuler des activités récentes (à remplacer par une vraie table d'activités)
        const mockActivities: ActivityItem[] = [
          ...(recentUsers?.map((user: any) => ({
            id: user.id,
            type: 'user_registration' as const,
            description: `Nouvel utilisateur inscrit`,
            timestamp: user.created_at,
            user_email: user.email
          })) || []),
          ...(recentTestSeries?.map((series: any) => ({
            id: series.id,
            type: 'module_creation' as const,
            description: `Nouvelle série créée: ${series.name}`,
            timestamp: series.created_at
          })) || [])
        ];

        setActivities(mockActivities.slice(0, 8));

      } catch (error) {
        console.error("Erreur lors de la récupération des activités:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivity();
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'test_completion':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'module_creation':
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      case 'question_added':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Inscription</Badge>;
      case 'test_completion':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Test</Badge>;
      case 'module_creation':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Module</Badge>;
      case 'question_added':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Question</Badge>;
      default:
        return <Badge variant="secondary">Autre</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Il y a quelques minutes";
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)} jour${Math.floor(diffInHours / 24) > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <span>Activité récente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {activity.user_email && `par ${activity.user_email}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 