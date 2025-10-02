'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QAItem {
  id: string;
  type?: string; // e.g., CO/CE
  prompt?: string;
  options?: { label?: string; content?: string; id?: string; is_correct?: boolean }[];
  correct_option_id?: string | null;
  correct_label?: string | null;
  user_option_id?: string | null;
  user_label?: string | null;
}

interface SubmissionDetail {
  id: string;
  user_email?: string;
  user_name?: string;
  plan_type?: string;
  status?: 'in_progress' | 'submitted' | 'graded';
  score?: number | null;
  submitted_at?: string | null;
  progress?: { co_done?: boolean; ce_done?: boolean; ee_done?: boolean; eo_done?: boolean };
  comprehension?: QAItem[]; // auto-gradable items
  expression_ecrite?: Array<{
    id: string;
    task_number?: number;
    title?: string;
    description?: string;
    documents?: Array<{ id: string; document_number: number; content: string }>;
  }>;  
  expression_orale?: Array<{ id: string; partie_number?: number; subject_number?: number; question?: string; content?: string }>;
}

export default function ExamBlancSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [eePicking, setEePicking] = useState<string>('');
  const [eoPicking, setEoPicking] = useState<string>('');
  // Read-only view: no saving/actions

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

  useEffect(() => { load(); }, [id]);

  // Replace EE task with a random one when current is empty
  const pickRandomEE = async (taskNumber: number, currentId?: string) => {
    try {
      setEePicking(String(taskNumber));
      const params = new URLSearchParams({ task_number: String(taskNumber) });
      if (currentId) params.set('exclude', String(currentId));
      const res = await fetch(`/api/exam-blanc/random-ee?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      const item = json?.data;
      if (!item) return;
      setData(prev => {
        if (!prev) return prev;
        const list = Array.isArray(prev.expression_ecrite) ? prev.expression_ecrite.slice() : [];
        // Replace first matching task_number or push if not found
        let replaced = false;
        const mapped = list.map((t: any) => {
          if (typeof t?.task_number !== 'undefined' && t.task_number === taskNumber) {
            replaced = true;
            return { id: item.id, task_number: item.task_number, title: item.title, description: item.description };
          }
          return t;
        });
        const finalList = replaced ? mapped : [...mapped, { id: item.id, task_number: item.task_number, title: item.title, description: item.description }];
        return { ...prev, expression_ecrite: finalList };
      });
    } finally {
      setEePicking('');
    }
  };

  // Replace EO subject with a random one when current is empty
  const pickRandomEO = async (partieNumber: number, currentId?: string) => {
    try {
      setEoPicking(String(partieNumber));
      const params = new URLSearchParams({ partie_number: String(partieNumber) });
      if (currentId) params.set('exclude', String(currentId));
      const res = await fetch(`/api/exam-blanc/random-eo?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      const item = json?.data;
      if (!item) return;
      setData(prev => {
        if (!prev) return prev;
        const list = Array.isArray(prev.expression_orale) ? prev.expression_orale.slice() : [];
        let replaced = false;
        const mapped = list.map((s: any) => {
          if (typeof s?.partie_number !== 'undefined' && s.partie_number === partieNumber) {
            replaced = true;
            return { id: item.id, partie_number: item.partie_number, subject_number: item.subject_number, question: item.question, content: item.content };
          }
          return s;
        });
        const finalList = replaced ? mapped : [...mapped, { id: item.id, partie_number: item.partie_number, subject_number: item.subject_number, question: item.question, content: item.content }];
        return { ...prev, expression_orale: finalList };
      });
    } finally {
      setEoPicking('');
    }
  };

  const isCorrect = (q: QAItem) => {
    if (!q) return false;
    if (q.correct_option_id && q.user_option_id) return q.correct_option_id === q.user_option_id;
    if (q.correct_label && q.user_label) return q.correct_label === q.user_label;
    return false;
  };

  const computeCOCEScore = (items?: QAItem[]) => {
    const comp = (items || []).filter(q => q.type === 'comprehension_orale' || q.type === 'comprehension_ecrite');
    return comp.reduce((acc, q) => acc + (((q.correct_option_id && q.user_option_id && q.correct_option_id === q.user_option_id) || (q.correct_label && q.user_label && q.correct_label === q.user_label)) ? 1 : 0), 0);
  };

  const displayedScore = typeof data?.score === 'number' ? data.score : computeCOCEScore(data?.comprehension);

  const typeShort = (t?: string) => {
    if (!t) return '—';
    if (t === 'comprehension_orale') return 'CO';
    if (t === 'comprehension_ecrite') return 'CE';
    return t.toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Soumission #{id.slice(0, 8)}</h1>
          {data && (
            <p className="text-gray-600">{data.user_name || data.user_email || 'Étudiant'} — {data.plan_type || 'examen_blanc'}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load()}>Actualiser</Button>
          <Button variant="outline" onClick={() => router.back()}>Retour</Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Statut</div>
            <div className="flex items-center gap-2">{data?.status ? <Badge>{data.status}</Badge> : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Score</div>
            <div className="text-2xl font-bold">{displayedScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Soumis le</div>
            <div>{data?.submitted_at ? new Date(data.submitted_at).toLocaleString() : '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Read-only: no actions */}

      {/* Server progress */}
      {data?.progress && (
        <Card>
          <CardContent className="pt-4 text-xs text-gray-700">
            Avancement — CO: {data.progress.co_done ? 'OK' : '—'} · CE: {data.progress.ce_done ? 'OK' : '—'} · EE: {data.progress.ee_done ? 'OK' : '—'} · EO: {data.progress.eo_done ? 'OK' : '—'}
          </CardContent>
        </Card>
      )}

      {/* Comprehension answers — CO */}
      <Card>
        <CardHeader>
          <CardTitle>Compréhension — CO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="text-sm text-gray-600">Chargement…</div>}
          {!loading && (!data?.comprehension || data.comprehension.filter(q => q.type === 'comprehension_orale').length === 0) && (
            <div className="text-sm text-gray-500">Aucune réponse CO.</div>
          )}
          {!loading && (data?.comprehension || []).filter(q => q.type === 'comprehension_orale').map((q, idx) => (
            <div key={`co_${q.id}_${idx}`} className={`p-3 border rounded ${isCorrect(q) ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{typeShort(q.type)}</Badge>
                <span className="font-medium">Question {q.id.slice(0, 6)}</span>
                {isCorrect(q) ? (
                  <Badge className="bg-green-600">Correct</Badge>
                ) : (
                  <Badge className="bg-red-600">Incorrect</Badge>
                )}
              </div>
              <div className="text-sm text-gray-800 mb-2">{q.prompt || '—'}</div>
              <div className="text-sm">
                <div>Réponse de l'étudiant: <span className="font-semibold">{q.user_label || q.user_option_id || '—'}</span></div>
                <div>Bonne réponse: <span className="font-semibold">{q.correct_label || q.correct_option_id || '—'}</span></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Comprehension answers — CE */}
      <Card>
        <CardHeader>
          <CardTitle>Compréhension — CE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="text-sm text-gray-600">Chargement…</div>}
          {!loading && (!data?.comprehension || data.comprehension.filter(q => q.type === 'comprehension_ecrite').length === 0) && (
            <div className="text-sm text-gray-500">Aucune réponse CE.</div>
          )}
          {!loading && (data?.comprehension || []).filter(q => q.type === 'comprehension_ecrite').map((q, idx) => (
            <div key={`ce_${q.id}_${idx}`} className={`p-3 border rounded ${isCorrect(q) ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{typeShort(q.type)}</Badge>
                <span className="font-medium">Question {q.id.slice(0, 6)}</span>
                {isCorrect(q) ? (
                  <Badge className="bg-green-600">Correct</Badge>
                ) : (
                  <Badge className="bg-red-600">Incorrect</Badge>
                )}
              </div>
              <div className="text-sm text-gray-800 mb-2">{q.prompt || '—'}</div>
              <div className="text-sm">
                <div>Réponse de l'étudiant: <span className="font-semibold">{q.user_label || q.user_option_id || '—'}</span></div>
                <div>Bonne réponse: <span className="font-semibold">{q.correct_label || q.correct_option_id || '—'}</span></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Expression Écrite — à corriger en salle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expression Écrite — à corriger en salle</CardTitle>
            {(!data?.expression_ecrite || data.expression_ecrite.length === 0) && (
              <Button variant="outline" size="sm" onClick={() => load()}>Actualiser EE</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!data?.expression_ecrite || data.expression_ecrite.length === 0) && (
            <div className="text-sm text-gray-600">Aucun sujet EE dans le plan.</div>
          )}
          {[1,2,3].map((num) => {
            const t = (data?.expression_ecrite || []).find((x:any) => x?.task_number === num) || { id: `placeholder-ee-${num}`, task_number: num } as any;
            const titleText = (t?.title || '').toString().trim();
            const empty = !titleText || titleText === '-' || !(t?.description && String(t.description).trim().length > 0);
            return (
            <div key={`ee_${t.id}`} className="p-3 border rounded">
              <div className="flex items-center gap-2 text-xs text-gray-700 mb-1">
                <Badge variant="outline">T{num}</Badge>
                {typeof t.task_number !== 'undefined' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eePicking === String(num)}
                    onClick={() => pickRandomEE(num, t.id?.toString().startsWith('placeholder-ee-') ? undefined : t.id)}
                  >{eePicking === String(num) ? 'Chargement…' : 'Sujet aléatoire'}</Button>
                )}
              </div>
              <div className="text-sm font-medium">{t.title || 'Sujet EE'}</div>
              {/* Documents for Task 3 */}
              {t?.task_number === 3 && Array.isArray(t?.documents) && t.documents.length > 0 && (
                <div className="space-y-2 mt-1">
                  {t.documents
                    .slice()
                    .sort((a: any, b: any) => (a.document_number || 0) - (b.document_number || 0))
                    .map((doc: any) => (
                      <div key={doc.id} className="text-xs bg-gray-50 border rounded p-2 whitespace-pre-wrap text-gray-800">
                        {doc.content}
                      </div>
                    ))}
                </div>
              )}
              {t.description && (
                <div className="text-xs bg-gray-50 border rounded p-2 mt-1 whitespace-pre-wrap">{t.description}</div>
              )}
            </div>
          )})}
        </CardContent>
      </Card>

      {/* Expression Orale — à corriger en salle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expression Orale — à corriger en salle</CardTitle>
            {(!data?.expression_orale || data.expression_orale.length === 0) && (
              <Button variant="outline" size="sm" onClick={() => load()}>Actualiser EO</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!data?.expression_orale || data.expression_orale.length === 0) && (
            <div className="text-sm text-gray-600">Aucun sujet EO dans le plan.</div>
          )}
          {[2,3].map((part) => {
            const s = (data?.expression_orale || []).find((x:any) => x?.partie_number === part) || { id: `placeholder-eo-${part}`, partie_number: part } as any;
            const qTxt = (s?.question || '').toString().trim();
            const cTxt = (s?.content || '').toString().trim();
            const empty = (!qTxt && !cTxt) || qTxt === '-';
            return (
            <div key={`eo_${s.id}`} className="p-3 border rounded">
              <div className="flex items-center gap-2 text-xs text-gray-700 mb-1">
                <Badge variant="outline">Partie {part}</Badge>
                {typeof s.subject_number !== 'undefined' && <Badge variant="outline">Sujet #{s.subject_number}</Badge>}
                {(
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eoPicking === String(part)}
                    onClick={() => pickRandomEO(part, s.id?.toString().startsWith('placeholder-eo-') ? undefined : s.id)}
                  >{eoPicking === String(part) ? 'Chargement…' : 'Sujet aléatoire'}</Button>
                )}
              </div>
              {s.question && <div className="text-sm font-medium">{s.question}</div>}
              {s.content && (
                <div className="text-xs bg-gray-50 border rounded p-2 mt-1 whitespace-pre-wrap">{s.content}</div>
              )}
            </div>
          )})}
        </CardContent>
      </Card>
    </div>
  );
}
