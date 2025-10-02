"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";

interface Activity {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" /> 
          Activités récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Aucune activité récente
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center p-3 border-l-4 border-orange-300 bg-orange-50 rounded-r-md"
              >
                <div className="mr-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-gray-500">{activity.type}</p>
                </div>
                <div className="text-sm text-gray-500">{activity.date}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
