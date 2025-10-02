'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// This page previews a draft exam plan stored in sessionStorage under 'examPlanDraft'.
// Flow expected:
// 1) Builder page serializes a plan object to sessionStorage.setItem('examPlanDraft', JSON.stringify(plan))
// 2) Navigate here: /admin-dashboard/exam-blanc/preview
// 3) This page hydrates content via /api/exam-plans/preview and lets user confirm/save or go back

export default function ExamPlanPreviewPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState<any | null>(null);
  const [rawPlan, setRawPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);
  const [overlaps, setOverlaps] = useState<{ comp: string[]; ee: string[]; eo: string[] } | null>(null);
  const [questionDetails, setQuestionDetails] = useState<Record<string, any>>({});
  const [eoDetails, setEoDetails] = useState<Record<string, any>>({});
  const [returnUrl, setReturnUrl] = useState<string>('');
  const [eePicking, setEePicking] = useState<number | null>(null);
  const [eoPicking, setEoPicking] = useState<number | null>(null);

  // Load draft from sessionStorage and preview directly (no server hydrate)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('examPlanDraft');
      if (!stored) {
        setError("Aucun plan en cours. Retournez à la construction du plan.");
        return;
      }
      const plan = JSON.parse(stored);
      setRawPlan(plan);
      // Use the plan directly for preview
      setHydrated(plan);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement du plan');
    }
    try {
      const href = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      setReturnUrl(href || '/admin-dashboard/exam-blanc/preview');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hydrate function removed: we preview raw plan directly
  const hydrate = async (_plan: any) => { setHydrated(_plan); };

  // Helpers to persist draft locally
  const persistPlan = (plan: any) => {
    setRawPlan(plan);
    try { sessionStorage.setItem('examPlanDraft', JSON.stringify(plan)); } catch {}
    setHydrated(plan);
  };

  // EE: pick random task for given task_number (1,2,3)
  const pickRandomEE = async (taskNumber: 1 | 2 | 3) => {
    if (!rawPlan) return;
    try {
      setEePicking(taskNumber);
      const current = (Array.isArray(rawPlan.expression_ecrite) ? rawPlan.expression_ecrite : []).find((x: any) => x?.task_number === taskNumber);
      const params = new URLSearchParams({ task_number: String(taskNumber) });
      if (current?.id) params.set('exclude', String(current.id));
      const res = await fetch(`/api/exam-blanc/random-ee?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Échec EE');
      const item = json?.data;
      const next = { ...rawPlan };
      const list = Array.isArray(next.expression_ecrite) ? next.expression_ecrite.slice() : [];
      let found = false;
      const mapped = list.map((t: any) => {
        if (t?.task_number === taskNumber) { found = true; return item; }
        return t;
      });
      next.expression_ecrite = found ? mapped : [...mapped, item];
      persistPlan(next);
    } catch (e) {
      // silent for preview
    } finally {
      setEePicking(null);
    }
  };

  // EO: pick random subject for partie_number (2,3)
  const pickRandomEO = async (partieNumber: 2 | 3) => {
    if (!rawPlan) return;
    try {
      setEoPicking(partieNumber);
      const current = (Array.isArray(rawPlan.expression_orale) ? rawPlan.expression_orale : []).find((x: any) => x?.partie_number === partieNumber);
      const params = new URLSearchParams({ partie_number: String(partieNumber) });
      if (current?.id) params.set('exclude', String(current.id));
      const res = await fetch(`/api/exam-blanc/random-eo?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Échec EO');
      const item = json?.data;
      const next = { ...rawPlan };
      const list = Array.isArray(next.expression_orale) ? next.expression_orale.slice() : [];
      let found = false;
      const mapped = list.map((s: any) => {
        if (s?.partie_number === partieNumber) { found = true; return item; }
        return s;
      });
      next.expression_orale = found ? mapped : [...mapped, item];
      persistPlan(next);
    } catch (e) {
      // silent for preview
    } finally {
      setEoPicking(null);
    }
  };

  const totalCO = useMemo(() => (hydrated?.comprehension_co?.length || 0), [hydrated]);
  const totalCE = useMemo(() => (hydrated?.comprehension_ce?.length || 0), [hydrated]);
  // Legacy fallback total
  const totalCompLegacy = useMemo(() => hydrated?.comprehension?.length || 0, [hydrated]);
  const totalEE = useMemo(() => hydrated?.expression_ecrite?.length || 0, [hydrated]);
  const totalEO = useMemo(() => hydrated?.expression_orale?.length || 0, [hydrated]);

  // Fetch question details (options, media, origins) for CO/CE
  useEffect(() => {
    const fetchDetails = async () => {
      if (!hydrated) return;
      const ids: string[] = [
        ...((hydrated?.comprehension_co || []).map((q: any) => String(q.id))),
        ...((hydrated?.comprehension_ce || []).map((q: any) => String(q.id))),
      ];
      if (ids.length === 0) return;
      const missing = ids.filter((id) => !questionDetails[id]);
      if (missing.length === 0) return;
      try {
        const res = await fetch('/api/questions/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: missing }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Chargement des questions échoué');
        const map: Record<string, any> = { ...questionDetails };
        for (const q of json?.data || []) map[q.id] = q;
        setQuestionDetails(map);
      } catch (e) {
        // silently ignore; preview still works with raw content
      }
    };
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({
    co: (hydrated?.comprehension_co || []).map((q: any) => q.id),
    ce: (hydrated?.comprehension_ce || []).map((q: any) => q.id)
  })]);

  // Fetch EO task details to ensure preview shows complete fields
  useEffect(() => {
    const fetchEO = async () => {
      if (!hydrated) return;
      const ids: string[] = (hydrated?.expression_orale || []).map((s: any) => String(s.id));
      if (ids.length === 0) return;
      const missing = ids.filter((id) => !eoDetails[id]);
      if (missing.length === 0) return;
      try {
        const res = await fetch('/api/expression-orale-tasks/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: missing }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Chargement EO échoué');
        const map: Record<string, any> = { ...eoDetails };
        for (const t of json?.data || []) map[t.id] = t;
        setEoDetails(map);
      } catch (e) {
        // ignore; show whatever exists
      }
    };
    fetchEO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify((hydrated?.expression_orale || []).map((s: any) => s.id))]);

  const onConfirm = async (forceReplace = false) => {
    if (!rawPlan) return;
    setLoading(true);
    setError(null);
    setOverlaps(null);
    setErrorDetails(null);
    try {
      const res = await fetch('/api/exam-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'examen_blanc', plan: rawPlan, forceReplace }),
      });
      const json = await res.json();
      if (res.status === 409) {
        setOverlaps(json?.overlaps || null);
        setError('Certains éléments sont déjà utilisés. Confirmez le remplacement si vous êtes sûr.');
        return;
      }
      if (!res.ok) {
        if (Array.isArray(json?.details)) setErrorDetails(json.details);
        throw new Error(json?.error || 'Création échouée');
      }
      // Clear draft and go back to admin list
      sessionStorage.removeItem('examPlanDraft');
      router.push('/admin-dashboard/exam-blanc');
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Remove conflicting items utilities
  const removeConflicts = async (section: 'comp' | 'ee' | 'eo', ids: string[]) => {
    if (!rawPlan || !ids?.length) return;
    const next = { ...rawPlan };
    if (section === 'comp') {
      // Remove from both new fields if exist, else legacy field
      if (Array.isArray(next.comprehension_co)) {
        next.comprehension_co = next.comprehension_co.filter((x: any) => !ids.includes(String(x?.id)));
      }
      if (Array.isArray(next.comprehension_ce)) {
        next.comprehension_ce = next.comprehension_ce.filter((x: any) => !ids.includes(String(x?.id)));
      }
      if (!next.comprehension_co && !next.comprehension_ce) {
        next.comprehension = (Array.isArray(next.comprehension) ? next.comprehension : []).filter((x: any) => !ids.includes(String(x?.id)));
      }
    } else if (section === 'ee') {
      next.expression_ecrite = (Array.isArray(next.expression_ecrite) ? next.expression_ecrite : []).filter((x: any) => !ids.includes(String(x?.id)));
    } else if (section === 'eo') {
      next.expression_orale = (Array.isArray(next.expression_orale) ? next.expression_orale : []).filter((x: any) => !ids.includes(String(x?.id)));
    }
    setRawPlan(next);
    try { sessionStorage.setItem('examPlanDraft', JSON.stringify(next)); } catch {}
    await hydrate(next);
    // Clear conflicts after modification
    setOverlaps(null);
    setError(null);
    setErrorDetails(null);
  };

  const removeAllConflicts = async () => {
    if (!rawPlan || !overlaps) return;
    const next = { ...rawPlan };
    if (Array.isArray(next.comprehension_co)) {
      next.comprehension_co = next.comprehension_co.filter((x: any) => !overlaps.comp.includes(String(x?.id)));
    }
    if (Array.isArray(next.comprehension_ce)) {
      next.comprehension_ce = next.comprehension_ce.filter((x: any) => !overlaps.comp.includes(String(x?.id)));
    }
    if (!next.comprehension_co && !next.comprehension_ce) {
      next.comprehension = (Array.isArray(next.comprehension) ? next.comprehension : []).filter((x: any) => !overlaps.comp.includes(String(x?.id)));
    }
    next.expression_ecrite = (Array.isArray(next.expression_ecrite) ? next.expression_ecrite : []).filter((x: any) => !overlaps.ee.includes(String(x?.id)));
    next.expression_orale = (Array.isArray(next.expression_orale) ? next.expression_orale : []).filter((x: any) => !overlaps.eo.includes(String(x?.id)));
    setRawPlan(next);
    try { sessionStorage.setItem('examPlanDraft', JSON.stringify(next)); } catch {}
    await hydrate(next);
    setOverlaps(null);
    setError(null);
    setErrorDetails(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prévisualisation du plan d'examen</h1>
          <p className="text-gray-600">Vérifiez le contenu complet avant sauvegarde.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => { try { sessionStorage.removeItem('examPlanDraft'); } catch {}; router.push('/admin-dashboard/exam-blanc'); }}
          >
            Annuler
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Modifier</Button>
          {/* When conflicts are detected, show explicit replacement confirm button */}
          {overlaps ? (
            <Button onClick={() => onConfirm(true)} disabled={loading || !hydrated}>
              Confirmer le remplacement et enregistrer
            </Button>
          ) : (
            <Button onClick={() => onConfirm(false)} disabled={loading || !hydrated}>Confirmer et enregistrer</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
          <div>{error}</div>
          {errorDetails && errorDetails.length > 0 && (
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {errorDetails.map((d, i) => (<li key={i}>{d}</li>))}
            </ul>
          )}
          {/* Small hint to guide the user when conflicts exist */}
          {overlaps && (
            <div className="mt-2 text-xs">
              Utilisez le bouton « Confirmer le remplacement et enregistrer » ou retirez les éléments en conflit ci‑dessous.
            </div>
          )}
        </div>
      )}

      {overlaps && (
        <Card>
          <CardHeader>
            <CardTitle>Conflits détectés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {overlaps.comp?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">CO/CE déjà utilisés:</span>
                  <Button size="sm" variant="outline" onClick={() => removeConflicts('comp', overlaps.comp)} disabled={loading}>Retirer ces éléments</Button>
                </div>
                <div className="text-xs break-all">{overlaps.comp.join(', ')}</div>
              </div>
            )}
            {overlaps.ee?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">EE déjà utilisées:</span>
                  <Button size="sm" variant="outline" onClick={() => removeConflicts('ee', overlaps.ee)} disabled={loading}>Retirer ces éléments</Button>
                </div>
                <div className="text-xs break-all">{overlaps.ee.join(', ')}</div>
              </div>
            )}
            {overlaps.eo?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">EO déjà utilisées:</span>
                  <Button size="sm" variant="outline" onClick={() => removeConflicts('eo', overlaps.eo)} disabled={loading}>Retirer ces éléments</Button>
                </div>
                <div className="text-xs break-all">{overlaps.eo.join(', ')}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={removeAllConflicts} disabled={loading}>Retirer tout</Button>
              <Button variant="destructive" onClick={() => onConfirm(true)} disabled={loading}>Forcer le remplacement et enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New structure: Separate CO and CE cards. If legacy 'comprehension' exists, show a fallback card below. */}
      <Card>
        <CardHeader>
          <CardTitle>Compréhension — CO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-600">Total: {totalCO}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(hydrated?.comprehension_co || []).map((q: any) => (
              <div key={q.id} className="p-3 border rounded text-sm space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  {(() => { const d = questionDetails[q.id]; const num = d?.question_number ?? q.question_number; return (<Badge variant="outline">Q#{num ?? '—'}</Badge>); })()}
                  {(() => {
                    const d = questionDetails[q.id];
                    const s = d?.test_series;
                    const m = s?.module;
                    if (!s && !m) return null;
                    return (
                      <span>
                        {s?.name ? `Série: ${s.name}${s?.slug ? ` (${s.slug})` : ''}` : ''}
                        {m ? ` · Module: ${m.type || ''}${m.type_module ? ` (${m.type_module})` : ''}` : ''}
                      </span>
                    );
                  })()}
                  <span className="ml-auto">{typeof q.points === 'number' ? `${q.points} pt` : ''}</span>
                  {(() => {
                    const d = questionDetails[String(q.id)];
                    const sId = d?.test_series?.id;
                    const mId = d?.test_series?.module?.id;
                    const base = `/admin-dashboard/questions/${encodeURIComponent(String(q.id))}`;
                    const params: string[] = [];
                    if (mId) params.push(`module=${encodeURIComponent(String(mId))}`);
                    if (sId) params.push(`series=${encodeURIComponent(String(sId))}`);
                    if (returnUrl) params.push(`returnUrl=${encodeURIComponent(returnUrl)}`);
                    const href = params.length ? `${base}?${params.join('&')}` : base;
                    return (
                      <a href={href} className="ml-2 underline text-blue-600 hover:text-blue-700">Modifier</a>
                    );
                  })()}
                </div>
                {(() => {
                  const d = questionDetails[String(q.id)];
                  const subject = d?.question_text ?? d?.content ?? q.content ?? q.title;
                  return (
                    <div className="text-xs text-gray-800 whitespace-pre-wrap">{subject || 'Chargement…'}</div>
                  );
                })()}
                {(() => {
                  const d = questionDetails[String(q.id)];
                  const ctx = d?.context_text;
                  if (!ctx) return null;
                  return (
                    <div className="text-[11px] text-gray-700 bg-gray-50 border rounded p-2 whitespace-pre-wrap">{ctx}</div>
                  );
                })()}
                {/* Options */}
                {(() => {
                  const d = questionDetails[String(q.id)];
                  const opts = d?.options || q?.options || [];
                  if (!opts.length) return null;
                  return (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Options</div>
                      <ul className="space-y-1">
                        {opts.map((opt: any) => (
                          <li key={opt.id} className="flex items-start gap-2">
                            <Badge variant={opt.is_correct ? 'default' : 'outline'}>{opt.label}</Badge>
                            <span className={opt.is_correct ? 'font-medium' : ''}>{opt.content}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                {/* Media */}
                {(() => {
                  const d = questionDetails[String(q.id)];
                  const media = d?.media || [];
                  if (!media.length) return null;
                  return (
                    <div className="space-y-2">
                      <div className="font-medium mb-1">Médias</div>
                      <ul className="space-y-1">
                        {media.map((m: any) => (
                          <li key={m.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{m.media_type}</Badge>
                              <a href={m.media_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">Ouvrir dans un onglet</a>
                            </div>
                            {m.media_type === 'audio' && (
                              <audio controls src={m.media_url} className="w-full" preload="none" />
                            )}
                            {m.media_type === 'image' && (
                              <img src={m.media_url} alt={m.description || 'media'} className="max-h-40 rounded border" />
                            )}
                            {m.media_type === 'video' && (
                              <video controls src={m.media_url} className="w-full max-h-56" preload="none" />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compréhension — CE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-600">Total: {totalCE}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(hydrated?.comprehension_ce || []).map((q: any) => (
              <div key={q.id} className="p-3 border rounded text-sm space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  {(() => { const d = questionDetails[String(q.id)]; const num = d?.question_number ?? q.question_number; return (<Badge variant="outline">Q#{num ?? '—'}</Badge>); })()}
                  {(() => {
                    const d = questionDetails[String(q.id)];
                    const s = d?.test_series;
                    const m = s?.module;
                    if (!s && !m) return null;
                    return (
                      <span>
                        {s?.name ? `Série: ${s.name}${s?.slug ? ` (${s.slug})` : ''}` : ''}
                        {m ? ` · Module: ${m.type || ''}${m.type_module ? ` (${m.type_module})` : ''}` : ''}
                      </span>
                    );
                  })()}
                  <span className="ml-auto">{typeof q.points === 'number' ? `${q.points} pt` : ''}</span>
                  {(() => {
                    const d = questionDetails[String(q.id)];
                    const sId = d?.test_series?.id;
                    const mId = d?.test_series?.module?.id;
                    const base = `/admin-dashboard/questions/${encodeURIComponent(String(q.id))}`;
                    const params: string[] = [];
                    if (mId) params.push(`module=${encodeURIComponent(String(mId))}`);
                    if (sId) params.push(`series=${encodeURIComponent(String(sId))}`);
                    if (returnUrl) params.push(`returnUrl=${encodeURIComponent(returnUrl)}`);
                    const href = params.length ? `${base}?${params.join('&')}` : base;
                    return (
                      <a href={href} className="ml-2 underline text-blue-600 hover:text-blue-700">Modifier</a>
                    );
                  })()}
                </div>
                {/* Context (first) */}
                {(() => {
                  const d = questionDetails[String(q.id)];
                  const ctx = d?.context_text;
                  if (!ctx) return null;
                  return (
                    <div className="text-sm text-gray-700 bg-gray-50 border rounded p-2 whitespace-pre-wrap">{ctx}</div>
                  );
                })()}
                {/* Subject: strict question_text for CE */}
                {(() => {
                  const d = questionDetails[String(q.id)];
                  const subject = d?.question_text;
                  return (
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{subject || 'Chargement…'}</div>
                  );
                })()}
                {(((questionDetails[String(q.id)]?.options?.length || 0) > 0) || ((q.options?.length || 0) > 0)) && (
                  <div className="text-xs">
                    <div className="font-medium mb-1">Options</div>
                    <ul className="space-y-1">
                      {(questionDetails[String(q.id)]?.options || q.options || []).map((opt: any) => (
                        <li key={opt.id} className="flex items-start gap-2">
                          <Badge variant={opt.is_correct ? 'default' : 'outline'}>{opt.label}</Badge>
                          <span className={opt.is_correct ? 'font-medium' : ''}>{opt.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(questionDetails[String(q.id)]?.media?.length || q.media?.length) && (
                  <div className="text-xs">
                    <div className="font-medium mb-1">Médias</div>
                    <ul className="space-y-1">
                      {(questionDetails[String(q.id)]?.media || q.media || []).map((m: any) => (
                        <li key={m.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{m.media_type}</Badge>
                            <a href={m.media_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">Ouvrir dans un onglet</a>
                          </div>
                          {m.media_type === 'audio' && (
                            <audio controls src={m.media_url} className="w-full" preload="none" />
                          )}
                          {m.media_type === 'image' && (
                            <img src={m.media_url} alt={m.description || 'media'} className="max-h-40 rounded border" />
                          )}
                          {m.media_type === 'video' && (
                            <video controls src={m.media_url} className="w-full max-h-56" preload="none" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legacy fallback when previewing older plans */}
      {totalCompLegacy > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compréhension (legacy mix)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-gray-600">Total: {totalCompLegacy}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(hydrated?.comprehension || []).map((q: any) => (
                <div key={q.id} className="p-3 border rounded text-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <Badge variant="outline">Q#{q.question_number ?? '—'}</Badge>
                    {q.series?.name && (
                      <span className="truncate">Série: {q.series.name}{q.series.slug ? ` (${q.series.slug})` : ''}</span>
                    )}
                    <span className="ml-auto">{typeof q.points === 'number' ? `${q.points} pt` : ''}</span>
                  </div>
                  {q.content && (
                    <div className="text-xs text-gray-800 whitespace-pre-wrap">{q.content}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expression écrite (EE)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-600">Total: {totalEE}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1,2,3].map((num) => {
              const t = (hydrated?.expression_ecrite || []).find((x: any) => x?.task_number === num) || { id: `placeholder-ee-${num}`, task_number: num } as any;
              const title = (t?.title || '').toString().trim();
              const empty = !title || title === '-';
              return (
                <div key={t.id} className="p-3 border rounded text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <Badge variant="outline">T{num}</Badge>
                    </div>
                    <Button size="sm" variant="outline" disabled={eePicking===num} onClick={() => pickRandomEE(num as 1|2|3)}>
                      {eePicking===num ? 'Chargement…' : 'Sujet aléatoire'}
                    </Button>
                  </div>
                  <div className="font-medium">{t.title || '—'}</div>
                  <div className="text-xs text-gray-700">Type: {t.task_type || '—'} · Mots max: {typeof t.word_count_max === 'number' ? t.word_count_max : '—'}</div>
                  {/* Documents for Task 3 */}
                  {t?.task_number === 3 && Array.isArray(t?.documents) && t.documents.length > 0 && (
                    <div className="space-y-2">
                      {t.documents
                        .slice()
                        .sort((a: any, b: any) => (a.document_number || 0) - (b.document_number || 0))
                        .map((doc: any) => (
                          <div key={doc.id} className="text-xs bg-gray-50 p-2 rounded border whitespace-pre-wrap text-gray-800">
                            {doc.content}
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Description when present (now t.description) */}
                  {t.description && (
                    <div className="text-xs bg-gray-50 p-2 rounded border whitespace-pre-wrap">{t.description}</div>
                  )}
                  {empty && (
                    <div className="text-xs text-gray-500">Aucun sujet. Utilisez « Sujet aléatoire » pour en sélectionner un.</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expression orale (EO)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-600">Total: {totalEO}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[2,3].map((part) => {
              const s = (hydrated?.expression_orale || []).find((x: any) => x?.partie_number === part) || { id: `placeholder-eo-${part}`, partie_number: part } as any;
              const d = eoDetails[s.id] || {};
              const partie = d.partie_number ?? s.partie_number;
              const sujet = d.subject_number ?? s.subject_number;
              const question = (d.question ?? s.question ?? '').toString().trim();
              const content = (d.content ?? s.content ?? '').toString().trim();
              const empty = !question && !content;
              return (
                <div key={s.id} className="p-3 border rounded text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <Badge variant="outline">Partie {partie ?? part}</Badge>
                      {typeof sujet !== 'undefined' && <Badge variant="outline">Sujet #{sujet}</Badge>}
                    </div>
                    <Button size="sm" variant="outline" disabled={eoPicking===part} onClick={() => pickRandomEO(part as 2|3)}>
                      {eoPicking===part ? 'Chargement…' : 'Sujet aléatoire'}
                    </Button>
                  </div>
                  <div className="font-medium">{question || '—'}</div>
                  {content && (
                    <div className="text-xs bg-gray-50 p-2 rounded border whitespace-pre-wrap">{content}</div>
                  )}
                  {empty && (
                    <div className="text-xs text-gray-500">Aucun sujet. Utilisez « Sujet aléatoire » pour en sélectionner un.</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
