'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/use-session';

interface Submission {
  id: string;
  plan_id: string;
  status: 'in_progress' | 'submitted' | 'graded';
  score?: number | null;
  submitted_at?: string | null;
  created_at: string;
}

export default function MesExamensPage() {
  const { user, loading: authLoading } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/exam-submissions?user_id=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        setSubmissions(json?.data || []);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Examens Blancs</h1>
        <p className="text-gray-600">Consultez vos examens passés et leurs résultats</p>
      </div>

      <div className="space-y-4">
        {submissions.map((submission) => {
          const statusLabel = submission.status === 'graded' 
            ? 'Corrigé' 
            : submission.status === 'submitted' 
            ? 'Soumis' 
            : 'En cours';
          
          const statusVariant = submission.status === 'graded' 
            ? 'default' 
            : submission.status === 'submitted' 
            ? 'secondary' 
            : 'outline';

          return (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Examen Blanc</span>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-600">
                      Créé le {new Date(submission.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    {submission.submitted_at && (
                      <div className="text-gray-600">
                        Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                    {submission.score !== null && submission.score !== undefined && (
                      <div className="text-lg font-bold text-primary">
                        Score: {submission.score}/100
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {submission.status === 'in_progress' && (
                      <Link href={`/dashboard/exam-blanc/${submission.plan_id}`}>
                        <Button size="sm">Continuer</Button>
                      </Link>
                    )}
                    {(submission.status === 'submitted' || submission.status === 'graded') && (
                      <Link href={`/dashboard/exam-blanc/results/${submission.id}`}>
                        <Button size="sm" variant={submission.status === 'graded' ? 'default' : 'outline'}>
                          {submission.status === 'graded' ? 'Voir les résultats' : 'Voir ma soumission'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && submissions.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-600 mb-4">Vous n'avez pas encore passé d'examen blanc</p>
            <Link href="/dashboard/exam-blanc">
              <Button>Commencer un examen</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
