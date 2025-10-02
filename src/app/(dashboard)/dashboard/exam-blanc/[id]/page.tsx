'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/hooks/use-session';
import { AudioRecorder } from '@/components/exam/AudioRecorder';

type Plan = {
  comprehension_co?: Array<{ id: string; type?: 'CO'; content?: string; title?: string; }>
  comprehension_ce?: Array<{ id: string; type?: 'CE'; content?: string; title?: string; }>
  // Legacy fallback (mixed)
  comprehension?: Array<{ id: string; type: 'CO' | 'CE'; content?: string; title?: string; }>
  expression_ecrite: Array<{
    id: string;
    task_number: number;
    title?: string;
    description?: string;
    word_count_max?: number;
    documents?: Array<{ id: string; document_number: number; content: string }>;
  }>
  expression_orale: Array<{ id: string; task_number: number; title?: string }>
};

export default function TakeExamBlancPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<'co' | 'ce' | 'ee' | 'eo' | 'summary'>('co');
  const [index, setIndex] = useState(0);

  // Local-only responses (no persistence per scope)
  const [compCOAnswers, setCompCOAnswers] = useState<Record<string, string>>({});
  const [compCEAnswers, setCompCEAnswers] = useState<Record<string, string>>({});
  const [eeNotes, setEeNotes] = useState<Record<number, string>>({});
  const [eoNotes, setEoNotes] = useState<Record<number, string>>({});
  const [eoAudios, setEoAudios] = useState<Record<number, { url: string; duration: number }>>({});
  const [questionDetails, setQuestionDetails] = useState<Record<string, any>>({});
  const { user, loading: authLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ co_done?: boolean; ce_done?: boolean; ee_done?: boolean; eo_done?: boolean }>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/exam-plans/${id}`);
        const json = await res.json();
        setPlan(json?.data?.plan || null);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // Resume existing submission and set initial step based on server progress
  useEffect(() => {
    const syncSubmission = async () => {
      if (!user?.id || !id) return;
      try {
        const res = await fetch(`/api/exam-submissions?user_id=${encodeURIComponent(user.id)}&plan_id=${encodeURIComponent(String(id))}`);
        const json = await res.json();
        if (res.ok && json?.data) {
          if (json.data.id) setSubmissionId(json.data.id);
          if (json.data.progress) setProgress(json.data.progress || {});
          const p = json.data.progress || {};
          if (!p.co_done) { setStep('co'); setIndex(0); return; }
          if (!p.ce_done) { setStep('ce'); setIndex(0); return; }
          if (!p.ee_done) { setStep('ee'); setIndex(0); return; }
          if (!p.eo_done) { setStep('eo'); setIndex(0); return; }
          setStep('summary');
        }
      } catch {}
    };
    syncSubmission();
  }, [user?.id, id]);

  // Submit a specific stage
  const submitStage = async (stage: 'CO' | 'CE' | 'EE' | 'EO') => {
    if (!user) {
      setSubmitError('Veuillez vous connecter pour soumettre.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let comprehension_answers: Array<{ question_id: string; user_option_id?: string | null; user_label?: string | null }> = [];
      if (stage === 'CO' || stage === 'CE') {
        const list = stage === 'CO' ? (plan?.comprehension_co || []) : (plan?.comprehension_ce || []);
        const answersMap = stage === 'CO' ? compCOAnswers : compCEAnswers;
        comprehension_answers = list.map((q) => {
          const value = answersMap[q.id];
          const qd = questionDetails[q.id];
          const options: Array<any> = qd?.options || [];
          const match = options.find((o: any) => o.id === value);
          return {
            question_id: q.id,
            user_option_id: match ? value : null,
            user_label: match ? null : String(value || ''),
          };
        });
      }

      const res = await fetch('/api/exam-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          plan_id: id,
          submission_id: submissionId,
          user_id: user.id,
          user_email: user.email,
          comprehension_answers,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Échec de soumission');
      if (!submissionId && json?.data?.id) setSubmissionId(json.data.id);
      if (json?.data?.progress) setProgress(json.data.progress);
      return true;
    } catch (e: any) {
      setSubmitError(e?.message || 'Erreur inconnue');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour soumettre Expression Écrite avec textes
  const submitStageEE = async () => {
    if (!submissionId || !user) return false;
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Enregistrer chaque tâche EE
      for (const task of ee) {
        const text = eeNotes[task.task_number];
        if (!text || !text.trim()) continue;
        
        const wordCount = text.trim().split(/\s+/).length;
        
        const res = await fetch(`/api/exam-submissions/${submissionId}/expressions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expression_ecrite',
            task_id: task.id,
            task_number: task.task_number,
            text_response: text,
            word_count: wordCount,
          }),
        });
        
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Erreur enregistrement EE');
        }
      }
      
      // Marquer EE comme terminé
      return await submitStage('EE');
    } catch (e: any) {
      setSubmitError(e?.message || 'Erreur soumission EE');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour soumettre Expression Orale avec audios
  const submitStageEO = async () => {
    if (!submissionId || !user) return false;
    
    // Vérifier que tous les audios sont enregistrés
    for (let i = 0; i < eo.length; i++) {
      if (!eoAudios[i]) {
        setSubmitError(`Veuillez enregistrer votre réponse pour la partie ${i + 1}`);
        return false;
      }
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Enregistrer chaque audio EO
      for (let i = 0; i < eo.length; i++) {
        const audio = eoAudios[i];
        const task = eo[i] as any;
        
        const res = await fetch(`/api/exam-submissions/${submissionId}/expressions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expression_orale',
            task_id: task.id,
            partie_number: task.partie_number,
            audio_url: audio.url,
            audio_duration_seconds: audio.duration,
          }),
        });
        
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Erreur enregistrement EO');
        }
      }
      
      // Marquer EO comme terminé
      return await submitStage('EO');
    } catch (e: any) {
      setSubmitError(e?.message || 'Erreur soumission EO');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const compCO = (plan?.comprehension_co || []).map((q) => ({ ...q, type: 'CO' as const }));
  const compCE = (plan?.comprehension_ce || []).map((q) => ({ ...q, type: 'CE' as const }));
  // Fallback legacy: if both arrays missing, use mixed comprehension
  const compLegacy = plan?.comprehension || [];
  const ee = plan?.expression_ecrite || [];
  const eo = plan?.expression_orale || [];

  // Load options and media for comprehension questions
  useEffect(() => {
    const fetchDetails = async () => {
      const allIds = [...compCO.map(q=>q.id), ...compCE.map(q=>q.id), ...compLegacy.map(q=>q.id)];
      if (!allIds.length) return;
      const missing = allIds.filter(id => !questionDetails[id]);
      if (missing.length === 0) return;
      try {
        const res = await fetch('/api/questions/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: missing })
        });
        const json = await res.json();
        const map: Record<string, any> = { ...questionDetails };
        for (const q of json?.data || []) {
          map[q.id] = q;
        }
        setQuestionDetails(map);
      } catch (e) {
        // best-effort; show text-only if failure
      }
    };
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([...compCO.map(q=>q.id), ...compCE.map(q=>q.id), ...compLegacy.map(q=>q.id)])]);

  // Navigation helpers
  const canPrev = useMemo(() => {
    if (step === 'co') return index > 0;
    if (step === 'ce') return index > 0 || compCO.length > 0;
    if (step === 'ee') return index > 0 || compCE.length > 0; 
    if (step === 'eo') return index > 0 || ee.length > 0;   
    return true;
  }, [step, index, compCO.length, compCE.length, ee.length]);

  const next = () => {
    if (step === 'co') {
      if (index + 1 < compCO.length) setIndex((i) => i + 1);
      // else wait for submit CO to move to CE
    } else if (step === 'ce') {
      if (index + 1 < compCE.length) setIndex((i) => i + 1);
      // else wait for submit CE to move to EE
    } else if (step === 'ee') {
      if (index + 1 < ee.length) setIndex((i) => i + 1);
      else { setStep('eo'); setIndex(0); }
    } else if (step === 'eo') {
      if (index + 1 < eo.length) setIndex((i) => i + 1);
      else { setStep('summary'); }
    }
  };

  const prev = () => {
    if (step === 'co') {
      if (index > 0) setIndex((i) => i - 1);
    } else if (step === 'ce') {
      if (index > 0) setIndex((i) => i - 1);
      else if (compCO.length > 0) { setStep('co'); setIndex(compCO.length - 1); }
    } else if (step === 'ee') {
      if (index > 0) setIndex((i) => i - 1);
      else if (compCE.length > 0) { setStep('ce'); setIndex(compCE.length - 1); }
    } else if (step === 'eo') {
      if (index > 0) setIndex((i) => i - 1);
      else if (ee.length > 0) { setStep('ee'); setIndex(ee.length - 1); }
    } else if (step === 'summary') {
      if (eo.length > 0) { setStep('eo'); setIndex(eo.length - 1); }
    }
  };

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!plan) return <div className="p-6">Aucun plan trouvé.</div>;

  // Progress across the whole exam
  const compTotal = compCO.length + compCE.length || (compLegacy.length);
  const totalItems = compTotal + (ee?.length || 0) + (eo?.length || 0);
  const currentIndexGlobal = (() => {
    if (step === 'co') return index + 1;
    if (step === 'ce') return (compCO.length) + index + 1;
    if (step === 'ee') return (compTotal) + index + 1;
    if (step === 'eo') return (compTotal) + (ee?.length || 0) + index + 1;
    return totalItems;
  })();
  const progressPct = totalItems > 0 ? (currentIndexGlobal / totalItems) * 100 : 0;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Server progress banner */}
        {(progress?.co_done || progress?.ce_done || progress?.ee_done || progress?.eo_done) && (
          <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded p-2">
            Avancement serveur — CO: {progress.co_done ? 'OK' : '—'} · CE: {progress.ce_done ? 'OK' : '—'} · EE: {progress.ee_done ? 'OK' : '—'} · EO: {progress.eo_done ? 'OK' : '—'}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Examen blanc</h1>
            <p className="text-gray-600 text-sm">Sections: CO (39) → CE (39) → Expression écrite → Expression orale</p>
          </div>
          <div className="space-x-2">
            <Badge variant={step==='co'?'default':'outline'}>CO</Badge>
            <Badge variant={step==='ce'?'default':'outline'}>CE</Badge>
            <Badge variant={step==='ee'?'default':'outline'}>EE</Badge>
            <Badge variant={step==='eo'?'default':'outline'}>EO</Badge>
            <Badge variant={step==='summary'?'default':'outline'}>Résumé</Badge>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progression</span>
            <span>{currentIndexGlobal}/{totalItems}</span>
          </div>
          <Progress value={progressPct} />
        </div>
        {(step === 'co' || step === 'ce') && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>
                {step === 'co' ? 'Compréhension Orale (CO)' : 'Compréhension Écrite (CE)'} ({index+1}/{step==='co' ? compCO.length : compCE.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Context/description first */}
            {(() => {
              const currentList = step==='co' ? compCO : compCE;
              const q = questionDetails[currentList[index].id];
              const ctx = q?.context_text;
              if (!ctx) return null;
              return (
                <div className="text-sm bg-gray-50 border rounded p-2 whitespace-pre-wrap text-gray-700">{ctx}</div>
              );
            })()}
            {/* Then the question line */}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{step==='co' ? 'CO' : 'CE'}</Badge>
              {(() => {
                const isCO = step==='co';
                const currentList = isCO ? compCO : compCE;
                const q = questionDetails[currentList[index].id];
                const subject = isCO
                  ? (q?.content || currentList[index]?.title || currentList[index]?.content || '—')
                  : (q?.question_text || '—');
                return <span className="text-base">{subject}</span>;
              })()}
            </div>
            {/* Media */}
            {(() => {
              const currentList = step==='co' ? compCO : compCE;
              const q = questionDetails[currentList[index].id];
              const media = q?.media || [];
              if (!media.length) return null;
              return (
                <div className="space-y-3">
                  {media
                    .slice()
                    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
                    .map((m: any) => (
                      <div key={`media_${m.id}`} className="rounded-lg border bg-gray-50 p-3">
                        {m.media_type === 'audio' && (
                          <audio controls src={m.media_url} className="w-full" />
                        )}
                        {m.media_type === 'image' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.media_url} alt={m.description || 'image'} className="mx-auto max-h-96 object-contain rounded" />
                        )}
                        {m.media_type === 'video' && (
                          <video controls src={m.media_url} className="w-full max-h-96 rounded" />
                        )}
                        {m.description && <div className="text-xs text-gray-500 mt-2">{m.description}</div>}
                      </div>
                    ))}
                </div>
              );
            })()}

            {/* Options */}
            {(() => {
              const currentList = step==='co' ? compCO : compCE;
              const q = questionDetails[currentList[index].id];
              const optionsRaw = q?.options || [];
              // safety de-duplication by id; if id missing, by normalized label+content
              const seen = new Set<string>();
              const options = optionsRaw.filter((o: any) => {
                const key = o?.id || `${(o?.label||'').trim().toLowerCase()}::${(o?.content||'').trim().toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              if (!options.length) return (
                <div className="space-y-2">
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                    Cette question ne comporte pas d'options prédéfinies. Veuillez saisir votre réponse en texte libre; elle sera envoyée au coach lors de la soumission.
                  </div>
                  <label className="text-sm">Votre réponse (texte libre):</label>
                  <input
                    className="w-full border rounded p-2 text-sm"
                    value={(step==='co' ? compCOAnswers : compCEAnswers)[(step==='co' ? compCO : compCE)[index].id] || ''}
                    onChange={(e) => {
                      const qid = (step==='co' ? compCO : compCE)[index].id;
                      if (step==='co') setCompCOAnswers({ ...compCOAnswers, [qid]: e.target.value });
                      else setCompCEAnswers({ ...compCEAnswers, [qid]: e.target.value });
                    }}
                    placeholder="Saisissez votre réponse (sera enregistrée à l'envoi)"
                  />
                </div>
              );
              return (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Choisissez la bonne réponse</div>
                  <div className="grid gap-2">
                    {options
                      .slice()
                      .sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''))
                      .map((opt: any) => (
                        <label
                          key={`opt_${opt.id}`}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition bg-white hover:bg-gray-50 ${
                            ((step==='co' ? compCOAnswers : compCEAnswers)[(step==='co' ? compCO : compCE)[index].id] === opt.id) ? 'border-orange-500 ring-1 ring-orange-200' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${(step==='co' ? compCO : compCE)[index].id}`}
                            checked={((step==='co' ? compCOAnswers : compCEAnswers)[(step==='co' ? compCO : compCE)[index].id] === opt.id)}
                            onChange={() => {
                              const qid = (step==='co' ? compCO : compCE)[index].id;
                              if (step==='co') setCompCOAnswers({ ...compCOAnswers, [qid]: opt.id });
                              else setCompCEAnswers({ ...compCEAnswers, [qid]: opt.id });
                            }}
                          />
                          <div>
                            <div className="text-xs font-semibold text-gray-600">{opt.label}</div>
                            <div className="text-sm leading-relaxed">{opt.content}</div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              );
            })()}

            {/* Stage submission control for CO/CE */}
            {(() => {
              const currentList = step==='co' ? compCO : compCE;
              const answersMap = step==='co' ? compCOAnswers : compCEAnswers;
              const expected = currentList.length;
              const answeredCount = currentList.filter(q => answersMap[q.id] !== undefined && answersMap[q.id] !== null).length;
              const canSubmitStage = index === currentList.length - 1 && answeredCount === expected;
              const stageLabel = step==='co' ? 'Soumettre CO' : 'Soumettre CE';
              const stageKey = step==='co' ? 'CO' : 'CE';
              const isDone = step==='co' ? Boolean(progress.co_done) : Boolean(progress.ce_done);
              const currentId = currentList[index]?.id;
              const currentAnswered = currentId ? (answersMap[currentId] !== undefined && answersMap[currentId] !== null && String(answersMap[currentId]).length > 0) : false;
              const canNext = index < currentList.length - 1 && currentAnswered;
              return (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">Répondu: {answeredCount}/{expected}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={prev}
                      disabled={index === 0}
                    >Précédent</Button>
                    {index < currentList.length - 1 && (
                      <Button
                        onClick={next}
                        disabled={!canNext}
                      >Suivant</Button>
                    )}
                    {!isDone ? (
                      <Button
                        onClick={async () => {
                          const ok = await submitStage(stageKey as 'CO'|'CE');
                          if (ok) {
                            if (stageKey === 'CO') { setStep('ce'); setIndex(0); }
                            if (stageKey === 'CE') { setStep('ee'); setIndex(0); }
                          }
                        }}
                        disabled={!canSubmitStage || isSubmitting}
                      >{isSubmitting ? 'Envoi…' : stageLabel}</Button>
                    ) : (
                      <Badge>Section validée</Badge>
                    )}
                  </div>
                </div>
              );
            })()}
            </CardContent>
          </Card>
        )}

      {step === 'ee' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expression écrite ({index+1}/{ee.length}) — T{ee[index]?.task_number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm font-medium">{ee[index]?.title || 'Sujet'}</div>
            {/* Documents for Task 3 */}
            {ee[index]?.task_number === 3 && Array.isArray(ee[index]?.documents) && ee[index]!.documents!.length > 0 && (
              <div className="space-y-2">
                {ee[index]!.documents!
                  .slice()
                  .sort((a, b) => (a.document_number || 0) - (b.document_number || 0))
                  .map((doc) => (
                    <div key={doc.id} className="space-y-1">
                      <div className="text-[11px] text-gray-600">Document {doc.document_number}</div>
                      <div className="text-sm bg-gray-50 p-2 rounded border whitespace-pre-wrap text-gray-800">{doc.content}</div>
                    </div>
                  ))}
              </div>
            )}
            {ee[index]?.description && (
              <div className="text-xs bg-gray-50 p-2 rounded border whitespace-pre-wrap text-gray-700">{ee[index]?.description}</div>
            )}
            {(() => {
              const t = ee[index];
              const defaults: Record<number, number> = { 1: 120, 2: 150, 3: 180 };
              const maxWords = typeof t.word_count_max === 'number' && t.word_count_max > 0 ? t.word_count_max : (defaults[t.task_number] || 150);
              const val = eeNotes[t.task_number] || '';
              const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
              const words = countWords(val);
              return (
                <div className="space-y-1">
                  <textarea
                    className="w-full border rounded p-2 text-sm min-h-[160px]"
                    value={val}
                    onChange={(e) => {
                      const next = e.target.value;
                      const nWords = countWords(next);
                      if (nWords <= maxWords) {
                        setEeNotes({ ...eeNotes, [t.task_number]: next });
                      } else {
                        // Soft cap: prevent adding more words beyond limit
                        const trimmed = next.trim().split(/\s+/).slice(0, maxWords).join(' ');
                        setEeNotes({ ...eeNotes, [t.task_number]: trimmed });
                      }
                    }}
                    placeholder={`Rédigez ici vos notes (non enregistrées)`}
                  />
                  <div className={`text-[11px] ${words > maxWords ? 'text-red-600' : 'text-gray-600'}`}>Mots: {words}/{maxWords}</div>
                </div>
              );
            })()}
            <div className="text-xs text-gray-500">Astuce: respectez les limites de mots selon la tâche.</div>
          </CardContent>
        </Card>
      )}

      {step === 'eo' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expression orale ({index+1}/{eo.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const s = eo[index] as any;
              const partie = s?.partie_number;
              const sujet = s?.subject_number;
              const question = s?.question;
              const content = s?.content;
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    {typeof partie !== 'undefined' && <Badge variant="outline">Partie {partie}</Badge>}
                    {typeof sujet !== 'undefined' && <Badge variant="outline">Sujet #{sujet}</Badge>}
                  </div>
                  {question && <div className="text-sm font-medium">{question}</div>}
                  {content && (
                    <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">{content}</div>
                  )}
                </div>
              );
            })()}
            
            {/* Composant d'enregistrement audio */}
            {user && submissionId && (
              <AudioRecorder
                userId={user.id}
                submissionId={submissionId}
                taskIndex={index}
                maxDurationSeconds={180}
                onAudioReady={(audioUrl, duration) => {
                  setEoAudios(prev => ({
                    ...prev,
                    [index]: { url: audioUrl, duration }
                  }));
                }}
              />
            )}
            
            {/* Notes optionnelles */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Notes personnelles (optionnel)</div>
              <textarea
                className="w-full border rounded p-2 text-sm min-h-[80px]"
                value={eoNotes[index] || ''}
                onChange={(e) => setEoNotes({ ...eoNotes, [index]: e.target.value })}
                placeholder="Notes pour vous aider (non enregistrées)"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'summary' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>CO: {Object.keys(compCOAnswers).length} réponses · CE: {Object.keys(compCEAnswers).length} réponses</div>
            <div>Expression écrite: {ee.length} tâches notées</div>
            <div>Expression orale: {eo.length} tâches notées</div>
            {!submissionId ? (
              <div className="text-xs text-gray-500">Les réponses seront enregistrées en soumettant ci-dessous.</div>
            ) : (
              <div className="text-xs text-green-600">Soumission enregistrée avec succès.</div>
            )}
            {submitError && (
              <div className="text-xs text-red-600">{submitError}</div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/exam-blanc')}>Retour à la liste</Button>
              <Button onClick={() => { setStep('co'); setIndex(0); }}>Recommencer</Button>
              <Button
                onClick={async () => {
                  // Ensure staged order if user reaches summary without submitting
                  if (!progress.co_done) {
                    const ok = await submitStage('CO');
                    if (!ok) return;
                  }
                  if (!progress.ce_done) {
                    const ok = await submitStage('CE');
                    if (!ok) return;
                  }
                  if (!progress.ee_done) {
                    const ok = await submitStageEE();
                    if (!ok) return;
                  }
                  if (!progress.eo_done) {
                    const ok = await submitStageEO();
                    if (!ok) return;
                  }
                }}
                disabled={isSubmitting || authLoading}
              >Finaliser</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky footer navigation (EE/EO only; CO/CE have inline submit) */}
      {(step === 'ee' || step === 'eo') && (
        <div className="sticky bottom-0 left-0 right-0 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
            <Button variant="outline" onClick={prev} disabled={!canPrev}>Précédent</Button>
            {step === 'ee' ? (
              <div className="flex gap-2">
                <Button onClick={next}>{index === ee.length - 1 ? 'Aller à EO' : 'Suivant'}</Button>
                {!progress.ee_done && (
                  <Button onClick={submitStageEE} disabled={isSubmitting}>Soumettre EE</Button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={next}>{index === eo.length - 1 ? 'Résumé' : 'Suivant'}</Button>
                {!progress.eo_done && (
                  <Button onClick={submitStageEO} disabled={isSubmitting}>Soumettre EO</Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
