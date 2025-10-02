'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExamBlancListPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/exam-plans');
        const json = await res.json();
        setPlans(json?.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Examen blanc</h1>
        <p className="text-gray-600">Choisissez un plan d'examen pour commencer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{new Date(p.created_at).toLocaleString()}</span>
                <Badge variant="outline">{p.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <div>
                counts: CO {p.config?.counts?.CO ?? '—'} / CE {p.config?.counts?.CE ?? '—'}
              </div>
              <Link href={`/dashboard/exam-blanc/${p.id}`}>
                <Button size="sm">Commencer</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && plans.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">Aucun examen disponible pour le moment.</CardContent>
        </Card>
      )}
    </div>
  );
}
