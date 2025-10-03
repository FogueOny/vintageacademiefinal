'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioPlayer } from '@/components/exam/AudioPlayer';
import { useSession } from '@/hooks/use-session';

interface QAItem {
  id: string;
  type?: string;
  prompt?: string;
  options?: { label?: string; content?: string; id?: string; is_correct?: boolean }[];
  correct_option_id?: string | null;
  correct_label?: string | null;
  user_option_id?: string | null;
  user_label?: string | null;
}

interface ExpressionResponse {
  id: string;
  type: 'expression_ecrite' | 'expression_orale';
  task_number?: number;
  partie_number?: number;
  user_text?: string;
  audio_url?: string;
  admin_score?: number | null;
  admin_feedback?: string | null;
  corrected_at?: string | null;
}

interface SubmissionDetail {
  id: string;
  user_email?: string;
  status?: 'in_progress' | 'submitted' | 'graded';
  score?: number | null;
  submitted_at?: string | null;
  comprehension?: QAItem[];
  expression_ecrite?: Array<{
    id: string;
    task_number?: number;
    title?: string;
    description?: string;
    documents?: Array<{ id: string; document_number: number; content: string }>;
  }>;
  expression_orale?: Array<{
    id: string;
    partie_number?: number;
    subject_number?: number;
    question?: string;
    content?: string;
  }>;
}

export default function ExamBlancResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useSession();
  const id = (params?.id as string) || '';
  
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [expressionResponses, setExpressionResponses] = useState<ExpressionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exam-submissions/${id}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json.data || null);
    } finally {
      setLoading(false);
    }
  };

  const loadExpressions = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/exam-submissions/${id}/expressions`);
      if (res.ok) {
        const json = await res.json();
        setExpressionResponses(json.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement expressions:', error);
    }
  };

  useEffect(() => {
    if (id) {
      load();
      loadExpressions();
    }
  }, [id]);

  // Vérifier que l'utilisateur est le propriétaire
  useEffect(() => {
    if (!authLoading && user && data && data.user_email !== user.email) {
      router.push('/dashboard');
    }
  }, [authLoading, user, data, router]);

  if (authLoading || loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-600 mb-4">Résultats non trouvés</p>
            <Link href="/dashboard">
              <Button>Retour au dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coQuestions = data.comprehension?.filter(q => q.type === 'CO') || [];
  const ceQuestions = data.comprehension?.filter(q => q.type === 'CE') || [];
  const eeResponses = expressionResponses.filter(r => r.type === 'expression_ecrite');
  const eoResponses = expressionResponses.filter(r => r.type === 'expression_orale');

  const coCorrect = coQuestions.filter(q => 
    q.user_option_id === q.correct_option_id || q.user_label === q.correct_label
  ).length;
  const ceCorrect = ceQuestions.filter(q => 
    q.user_option_id === q.correct_option_id || q.user_label === q.correct_label
  ).length;

  const eeGraded = eeResponses.filter(r => r.admin_score !== null && r.admin_score !== undefined);
  const eoGraded = eoResponses.filter(r => r.admin_score !== null && r.admin_score !== undefined);

  const totalEEScore = eeGraded.reduce((sum, r) => sum + (r.admin_score || 0), 0);
  const totalEOScore = eoGraded.reduce((sum, r) => sum + (r.admin_score || 0), 0);

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">← Retour au dashboard</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Résultats de votre Examen Blanc</span>
            <Badge variant={data.status === 'graded' ? 'default' : 'secondary'}>
              {data.status === 'graded' ? 'Corrigé' : data.status === 'submitted' ? 'Soumis' : 'En cours'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.submitted_at && (
            <div className="text-sm text-gray-600">
              Soumis le {new Date(data.submitted_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {data.score !== null && data.score !== undefined && (
            <div className="text-2xl font-bold text-primary">
              Score total: {data.score}/100
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-semibold text-blue-900">CO</div>
              <div className="text-blue-700">{coCorrect}/{coQuestions.length} correct</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-semibold text-green-900">CE</div>
              <div className="text-green-700">{ceCorrect}/{ceQuestions.length} correct</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="font-semibold text-orange-900">EE</div>
              <div className="text-orange-700">{totalEEScore}/50 points</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-semibold text-purple-900">EO</div>
              <div className="text-purple-700">{totalEOScore}/50 points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compréhension Orale */}
      {coQuestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compréhension Orale (CO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coQuestions.map((q, idx) => {
              const isCorrect = q.user_option_id === q.correct_option_id || q.user_label === q.correct_label;
              const userAnswer = q.options?.find(o => o.id === q.user_option_id)?.content || q.user_label || 'Non répondu';
              const correctAnswer = q.options?.find(o => o.id === q.correct_option_id)?.content || q.correct_label || 'N/A';

              return (
                <div key={q.id} className={`p-4 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">Question {idx + 1}</div>
                    <Badge variant={isCorrect ? 'default' : 'destructive'}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </Badge>
                  </div>
                  {q.prompt && <div className="text-sm mb-2">{q.prompt}</div>}
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Votre réponse:</span> {userAnswer}</div>
                    {!isCorrect && <div><span className="font-medium">Réponse correcte:</span> {correctAnswer}</div>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Compréhension Écrite */}
      {ceQuestions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compréhension Écrite (CE)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ceQuestions.map((q, idx) => {
              const isCorrect = q.user_option_id === q.correct_option_id || q.user_label === q.correct_label;
              const userAnswer = q.options?.find(o => o.id === q.user_option_id)?.content || q.user_label || 'Non répondu';
              const correctAnswer = q.options?.find(o => o.id === q.correct_option_id)?.content || q.correct_label || 'N/A';

              return (
                <div key={q.id} className={`p-4 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">Question {idx + 1}</div>
                    <Badge variant={isCorrect ? 'default' : 'destructive'}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </Badge>
                  </div>
                  {q.prompt && <div className="text-sm mb-2">{q.prompt}</div>}
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Votre réponse:</span> {userAnswer}</div>
                    {!isCorrect && <div><span className="font-medium">Réponse correcte:</span> {correctAnswer}</div>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Expression Écrite */}
      {eeResponses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Expression Écrite (EE)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {eeResponses.map((response) => {
              const eeTask = data.expression_ecrite?.find(t => t.task_number === response.task_number);
              
              return (
                <div key={response.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Tâche {response.task_number}</div>
                    {response.admin_score !== null && response.admin_score !== undefined ? (
                      <Badge variant="default">{response.admin_score}/25 points</Badge>
                    ) : (
                      <Badge variant="secondary">En attente de correction</Badge>
                    )}
                  </div>

                  {/* Sujet de la tâche */}
                  {eeTask && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded space-y-2">
                      {eeTask.title && <div className="font-medium text-blue-900">{eeTask.title}</div>}
                      {eeTask.description && <div className="text-sm text-blue-800 whitespace-pre-wrap">{eeTask.description}</div>}
                      
                      {/* Documents */}
                      {eeTask.documents && eeTask.documents.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {eeTask.documents.map((doc) => (
                            <div key={doc.id} className="bg-white p-2 rounded border border-blue-200">
                              <div className="text-xs font-medium text-blue-900 mb-1">Document {doc.document_number}</div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">{doc.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Votre réponse */}
                  {response.user_text && (
                    <div>
                      <div className="text-sm font-medium mb-1">Votre réponse:</div>
                      <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap border">
                        {response.user_text}
                      </div>
                    </div>
                  )}

                  {/* Feedback admin */}
                  {response.admin_feedback && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded">
                      <div className="font-medium text-green-900 mb-1">Feedback de l'examinateur:</div>
                      <div className="text-sm text-green-800 whitespace-pre-wrap">{response.admin_feedback}</div>
                    </div>
                  )}

                  {response.corrected_at && (
                    <div className="text-xs text-gray-500">
                      Corrigé le {new Date(response.corrected_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Expression Orale */}
      {eoResponses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Expression Orale (EO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {eoResponses.map((response) => {
              const eoTask = data.expression_orale?.find(t => t.partie_number === response.partie_number);
              
              return (
                <div key={response.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Partie {response.partie_number}</div>
                    {response.admin_score !== null && response.admin_score !== undefined ? (
                      <Badge variant="default">{response.admin_score}/25 points</Badge>
                    ) : (
                      <Badge variant="secondary">En attente de correction</Badge>
                    )}
                  </div>

                  {/* Sujet de la partie */}
                  {eoTask && (
                    <div className="bg-purple-50 border border-purple-200 p-3 rounded space-y-2">
                      {eoTask.subject_number && (
                        <div className="text-xs font-medium text-purple-900">Sujet #{eoTask.subject_number}</div>
                      )}
                      {eoTask.question && (
                        <div className="font-medium text-purple-900">{eoTask.question}</div>
                      )}
                      {eoTask.content && (
                        <div className="text-sm text-purple-800 whitespace-pre-wrap bg-white p-2 rounded border border-purple-200">
                          {eoTask.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Votre enregistrement */}
                  {response.audio_url && (
                    <div>
                      <div className="text-sm font-medium mb-2">Votre enregistrement:</div>
                      <AudioPlayer audioUrl={response.audio_url} />
                    </div>
                  )}

                  {/* Feedback admin */}
                  {response.admin_feedback && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded">
                      <div className="font-medium text-green-900 mb-1">Feedback de l'examinateur:</div>
                      <div className="text-sm text-green-800 whitespace-pre-wrap">{response.admin_feedback}</div>
                    </div>
                  )}

                  {response.corrected_at && (
                    <div className="text-xs text-gray-500">
                      Corrigé le {new Date(response.corrected_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {eeGraded.length === 0 && eoGraded.length === 0 && data.status === 'submitted' && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-600 mb-2">Votre examen est en cours de correction</p>
            <p className="text-sm text-gray-500">Vous recevrez une notification lorsque les résultats seront disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
