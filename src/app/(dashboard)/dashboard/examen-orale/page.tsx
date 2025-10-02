'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Simple helper
const fmt = (n: number) => n.toString().padStart(2, '0');

export default function ExamenOralePage() {
  const router = useRouter();
  // Note: do NOT call getSupabaseBrowser() during SSR. We'll call it inside effects (client-only).
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [periods, setPeriods] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [taskNumber, setTaskNumber] = useState<number | null>(null);
  const [periodId, setPeriodId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [availablePeriodIds, setAvailablePeriodIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 24;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const recorderCardRef = useRef<HTMLDivElement | null>(null);

  const limitSec = useMemo(() => {
    if (taskNumber === 2) return 120; // 2 minutes (interaction)
    if (taskNumber === 3) return 240; // 4 minutes max (point de vue)
    return 180; // default safety
  }, [taskNumber]);

  // Derived subjects with search filtering and pagination
  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? subjects.filter((s: any) => {
          const t = (s.title || '').toLowerCase();
          const qu = (s.question || '').toLowerCase();
          const c = (s.content || '').toLowerCase();
          return t.includes(q) || qu.includes(q) || c.includes(q);
        })
      : subjects;
    return base;
  }, [subjects, query]);

  const pagedSubjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredSubjects.length / pageSize)), [filteredSubjects.length]);

  // Init auth and load periods
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: sessionRes } = await supabase.auth.getSession();
        const currentUser = sessionRes?.session?.user ?? null;
        setUser(currentUser);
        if (!currentUser) {
          setLoading(false);
          return;
        }
        // Load periods (public read assumed via RLS)
        const { data: periodsData, error: pErr } = await supabase
          .from('expression_orale_periods')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false });
        if (pErr) throw pErr;
        setPeriods(periodsData || []);
        setPage(1);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When task number changes, compute periods that have that task available
  useEffect(() => {
    (async () => {
      setPeriodId('');
      setTaskId('');
      setSubjects([]);
      setSubjectId('');
      if (!taskNumber) {
        setAvailablePeriodIds(new Set());
        setPage(1);
        return;
      }
      try {
        const supabase = getSupabaseBrowser();
        const { data, error: tErr } = await supabase
          .from('expression_orale_tasks')
          .select('id, period_id')
          .eq('task_number', taskNumber);
        if (tErr) throw tErr;
        const ids = new Set<string>((data || []).map((r: any) => r.period_id));
        setAvailablePeriodIds(ids);
        setPage(1);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Erreur de chargement');
      }
    })();
  }, [taskNumber]);

  // When period changes with selected taskNumber, find the task id and then load subjects
  useEffect(() => {
    (async () => {
      setTaskId('');
      setSubjects([]);
      setSubjectId('');
      if (!periodId || !taskNumber) return;
      try {
        const supabase = getSupabaseBrowser();
        const { data: taskRows, error: tErr } = await supabase
          .from('expression_orale_tasks')
          .select('id')
          .eq('period_id', periodId)
          .eq('task_number', taskNumber)
          .limit(1);
        if (tErr) throw tErr;
        const tid = taskRows && taskRows[0]?.id;
        if (!tid) {
          setTaskId('');
          setSubjects([]);
          return;
        }
        setTaskId(tid);
        const { data: subjRows, error: sErr } = await supabase
          .from('expression_orale_subjects')
          .select('*')
          .eq('task_id', tid)
          .order('subject_number', { ascending: true });
        if (sErr) throw sErr;
        setSubjects(subjRows || []);
        setPage(1);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Erreur de chargement des sujets');
      }
    })();
  }, [periodId, taskNumber]);

  // (obsolete effect removed)

  // Recording controls
  const startRecording = async () => {
    setError(null);
    setRecordedBlob(null);
    setElapsed(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 64000, // 64 kbps to keep small size
      });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(1000);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s + 1 >= limitSec) {
            stopRecording();
          }
          return s + 1;
        });
      }, 1000);
      // Scroll to recorder on start
      setTimeout(() => {
        recorderCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (e: any) {
      console.error(e);
      setError('Autorisez le micro pour enregistrer votre réponse.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch (e) {}
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setElapsed(0);
    setError(null);
  };

  const canSubmit = !!(user && periodId && taskId && subjectId && recordedBlob && taskNumber);

  const onSubmit = async () => {
    if (!canSubmit || !recordedBlob) return;
    if (recordedBlob.size > 7 * 1024 * 1024) {
      setError('Le fichier audio est trop volumineux (> 7 Mo). Veuillez enregistrer plus court.');
      toast({
        title: 'Fichier trop volumineux',
        description: 'Veuillez limiter votre enregistrement à ~7 Mo.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('period_id', periodId);
      fd.append('task_id', taskId);
      fd.append('subject_id', subjectId);
      fd.append('task_number', String(taskNumber));
      fd.append('duration_sec', String(elapsed));
      fd.append('user_email', user?.email || '');
      fd.append('user_name', user?.user_metadata?.full_name || user?.email || '');

      const fileName = `eo-t${taskNumber}-${Date.now()}.webm`;
      const audioFile = new File([recordedBlob], fileName, { type: 'audio/webm' });
      fd.append('audio', audioFile);

      const res = await fetch('/api/expression-orale/submit', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erreur lors de l\'envoi');
      const metaDesc = json?.meta
        ? `Période: ${json.meta.period} • ${json.meta.task} • ${json.meta.subject}`
        : 'Votre enregistrement a été envoyé par email. Nous vous répondrons bientôt.';
      toast({
        title: 'Soumission envoyée',
        description: metaDesc,
      });
      // Give the toast a brief moment to render in case of immediate navigation/state changes
      await new Promise((r) => setTimeout(r, 350));
      // Reset recording only, keep selections 
      resetRecording();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erreur lors de l\'envoi');
      toast({
        title: 'Échec de l\'envoi',
        description: e.message || 'Veuillez réessayer dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!user) return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Expression Orale (TCF)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Vous devez être connecté pour soumettre une réponse.</p>
          <div className="mt-4">
            <Button onClick={() => router.push('/login')}>Se connecter</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: selections + subjects (scrollable) */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Expression Orale — Sélection</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            {/* Selectors */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Tâche</label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  value={taskNumber ?? ''}
                  onChange={(e) => setTaskNumber(e.target.value ? Number(e.target.value) : null)}
                  disabled={isRecording}
                >
                  <option value="">Sélectionner…</option>
                  <option value="2">Tâche 2 — Interaction</option>
                  <option value="3">Tâche 3 — Point de vue</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Période</label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  disabled={!taskNumber || isRecording}
                >
                  <option value="">Sélectionner…</option>
                  {periods
                    .filter((p) => !taskNumber || availablePeriodIds.has(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.title || `${p.month}/${p.year}`}</option>
                    ))}
                </select>
                {taskNumber && periods.filter((p) => availablePeriodIds.has(p.id)).length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">Aucune période disponible pour T{taskNumber}.</p>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Rechercher dans les sujets…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full border rounded-md px-3 py-2 text-sm"
                disabled={!periodId || !taskNumber}
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Sujets</div>
                <div className="text-xs text-gray-500">{filteredSubjects.length} sujets</div>
              </div>
              <div className="max-h-[60vh] overflow-auto pr-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredSubjects.length === 0 && periodId && taskId && (
                    <div className="text-sm text-gray-500">Aucun sujet disponible pour cette période et cette tâche.</div>
                  )}
                  {pagedSubjects.map((s, i) => {
                    const selected = subjectId === s.id;
                    const globalIndex = (page - 1) * pageSize + i;
                    const displayNumber = globalIndex + 1;
                    const heading = s.title || s.question || 'Sujet';
                    const showQuestionBelow = s.question && s.title && s.title !== s.question;
                    const body = s.content || (showQuestionBelow ? s.question : undefined);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSubjectId(s.id)}
                        disabled={isRecording}
                        className={`text-left rounded-md border p-3 hover:shadow-sm transition ${selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200'} ${isRecording ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-xs font-medium text-gray-600">Sujet {String(displayNumber).padStart(2, '0')}</div>
                        <div className="mt-1 font-semibold">{heading}</div>
                        {showQuestionBelow && (
                          <div className="mt-1 text-sm text-gray-700 line-clamp-2">{s.question}</div>
                        )}
                        {body && (
                          <div className="mt-1 text-xs text-gray-500 line-clamp-3">{body}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pagination */}
              {filteredSubjects.length > pageSize && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Page {page} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: recorder and actions (sticky) */}
        <div className="h-full">
          <Card className="md:sticky md:top-6" ref={recorderCardRef}>
            <CardHeader>
              <CardTitle>Lancer le test & Enregistrer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject preview */}
              {subjectId && (
                <div className="rounded-md border border-gray-200 p-3">
                  {(() => {
                    const s = subjects.find((x: any) => x.id === subjectId);
                    if (!s) return null;
                    const idx = filteredSubjects.findIndex((x: any) => x.id === subjectId);
                    const displayNumber = idx >= 0 ? idx + 1 : 1;
                    const heading = s.title || s.question || 'Sujet';
                    const showQuestionBelow = s.question && s.title && s.title !== s.question;
                    return (
                      <div>
                        <div className="mb-1 text-xs font-medium text-gray-600">Sujet {String(displayNumber).padStart(2, '0')}</div>
                        <div className="font-semibold leading-snug">{heading}</div>
                        {showQuestionBelow && (
                          <div className="mt-1 text-sm text-gray-700">{s.question}</div>
                        )}
                        {s.content && (
                          <CollapsibleText text={s.content} />
                        )}
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(heading + (s.question && showQuestionBelow ? `\n${s.question}` : '')); toast({ title: 'Copié', description: 'Texte copié dans le presse-papiers' }); } catch {} }}>Copier</Button>
                          {s.content && (
                            <Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(s.content); toast({ title: 'Copié', description: 'Contenu copié' }); } catch {} }}>Copier le contenu</Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="text-sm text-gray-600">
                Limite: {taskNumber ? (taskNumber === 2 ? '2 minutes' : '3-4 minutes') : '—'}
              </div>
              <div className="text-3xl font-semibold tabular-nums">{fmt(Math.floor(elapsed/60))}:{fmt(elapsed%60)}</div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded bg-gray-100">
                <div
                  className="h-2 rounded bg-orange-500 transition-all"
                  style={{ width: `${Math.min(100, (elapsed / (limitSec || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex gap-3">
                {!isRecording && (
                  <Button onClick={startRecording} disabled={!subjectId}>Démarrer</Button>
                )}
                {isRecording && (
                  <Button variant="destructive" onClick={stopRecording}>Arrêter</Button>
                )}
                {recordedBlob && !isRecording && (
                  <Button variant="outline" onClick={resetRecording}>Réenregistrer</Button>
                )}
              </div>
              {recordedBlob && (
                <div className="space-y-2">
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                  <div className="text-xs text-gray-500">Taille: {(recordedBlob.size/1024/1024).toFixed(2)} Mo</div>
                </div>
              )}
              <div className="pt-2">
                <Button onClick={onSubmit} disabled={!canSubmit || submitting} className="bg-orange-500 hover:bg-orange-600 w-full">
                  {submitting ? 'Envoi…' : 'Envoyer par email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Collapsible text helper component (local)
function CollapsibleText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const preview = text.length > 400 ? text.slice(0, 400) + '…' : text;
  return (
    <div className="mt-2 text-sm text-gray-700">
      <div className={open ? '' : 'line-clamp-4'}>{open ? text : preview}</div>
      {text.length > 400 && (
        <button type="button" className="mt-1 text-xs text-orange-600 hover:underline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

