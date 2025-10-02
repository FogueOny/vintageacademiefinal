"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  subscription: string;
  expiryDate: string;
  testsCompleted: string | number;
  averageScore: string | number;
}

export function StatsCards({ subscription, expiryDate, testsCompleted, averageScore }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className="bg-primary/10 border border-primary/20 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <h3 className="font-medium text-primary">Status d'abonnement</h3>
          <p className="text-2xl font-bold">{subscription}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/10 border border-primary/20 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <h3 className="font-medium text-primary">Expire le</h3>
          <p className="text-2xl font-bold">{expiryDate}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/10 border border-primary/20 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <h3 className="font-medium text-primary">Tests complétés</h3>
          <p className="text-2xl font-bold">{testsCompleted}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-primary/10 border border-primary/20 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <h3 className="font-medium text-primary">Score moyen</h3>
          <p className="text-2xl font-bold">{averageScore}</p>
        </CardContent>
      </Card>
    </div>
  );
}
