"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TestSeries {
  id: string;
  name: string;
  description?: string;
  module_id: string;
  time_limit?: number;
  slug?: string;
  is_free?: boolean;
}

interface QuestionOption {
  id: string;
  label?: string;
  content: string;
  is_correct?: boolean;
}

interface QuestionMedia {
  id: string;
  media_type: string;
  media_url: string;
  description?: string;
  display_order?: number;
}

interface QuestionItem {
  id: string;
  question_number?: number;
  content?: string;
  points?: number;
  speaker_name?: string | null;
  question_text?: string | null;
  context_text?: string | null;
  options?: QuestionOption[];
  question_media?: QuestionMedia[];
}

export default function TestSeriesPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [series, setSeries] = useState<TestSeries | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seriesId = params?.id;

  useEffect(() => {
    if (!seriesId) return;
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();

      // Fetch series details
      const { data: seriesData, error: seriesErr } = await supabase
        .from("test_series")
        .select("*")
        .eq("id", seriesId)
        .single();

      if (seriesErr) throw seriesErr;
      setSeries(seriesData as TestSeries);

      // Fetch questions with options and media
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select(`
          *,
          options(*),
          question_media(*)
        `)
        .eq("test_series_id", seriesId)
        .order("question_number", { ascending: true });

      if (qErr) throw qErr;

      const normalized = (qData || []).map((q: any) => ({
        id: q.id,
        question_number: q.question_number ?? null,
        content: q.content ?? "",
        points: q.points ?? null,
        speaker_name: q.speaker_name ?? null,
        question_text: q.question_text ?? null,
        context_text: q.context_text ?? null,
        options: (q.options || []).sort((a: any, b: any) => String(a.label || "").localeCompare(String(b.label || ""), "fr", { sensitivity: "base" })),
        question_media: (q.question_media || []).sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)),
      })) as QuestionItem[];

      setQuestions(normalized);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = useMemo(() => questions.length, [questions]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
        <Button variant="outline" onClick={() => router.push("/admin-dashboard/test-series")}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aperçu de la série</h1>
          <p className="text-gray-600">
            {series?.name || "Série"} • {totalQuestions} question{totalQuestions > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin-dashboard/test-series")}>Retour</Button>
        </div>
      </div>

      {/* Series metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {typeof series?.time_limit === "number" && (
              <Badge variant="outline">Durée: {Math.floor((series!.time_limit || 0) / 60)} min</Badge>
            )}
            {series?.is_free != null && (
              <Badge className={series.is_free ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                {series.is_free ? "Gratuit" : "Payant"}
              </Badge>
            )}
            {series?.slug && <Badge variant="outline">Slug: {series.slug}</Badge>}
          </div>
          {series?.description && (
            <div className="text-gray-700 whitespace-pre-wrap">{series.description}</div>
          )}
        </CardContent>
      </Card>

      {/* Questions list */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-sm text-gray-600">Aucune question dans cette série.</div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="p-4 border rounded-lg bg-white shadow-sm lg:flex lg:items-start lg:gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                      <Badge variant="outline">Q#{q.question_number ?? "—"}</Badge>
                      {typeof q.points === "number" && (
                        <Badge variant="outline">{q.points} pt</Badge>
                      )}
                      {/* counts */}
                      {Array.isArray(q.options) && (
                        <Badge variant="outline">{q.options.length} option{q.options.length > 1 ? 's' : ''}</Badge>
                      )}
                      {Array.isArray(q.question_media) && (
                        <Badge variant="outline">{q.question_media.length} média{q.question_media.length > 1 ? 's' : ''}</Badge>
                      )}
                    </div>

                    {/* Written test specific fields */}
                    {(q.speaker_name || q.question_text || q.context_text) && (
                      <div className="space-y-1">
                        {q.speaker_name && (
                          <div className="italic text-sm text-gray-700">{q.speaker_name}</div>
                        )}
                        {q.question_text && (
                          <div className="font-semibold text-gray-900">{q.question_text}</div>
                        )}
                        {q.context_text && (
                          <div className="text-xs bg-gray-50 p-2 rounded border whitespace-pre-wrap">
                            {q.context_text}
                          </div>
                        )}
                      </div>
                    )}

                    {q.content && (
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">{q.content}</div>
                    )}
                    {!q.content && (!q.options || q.options.length === 0) && (!q.question_media || q.question_media.length === 0) && (
                      <div className="text-xs text-gray-600 bg-orange-50 border border-orange-200 p-2 rounded">
                        Aucun contenu, option ou média pour cette question.
                      </div>
                    )}

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="text-sm">
                        <div className="font-medium mb-1">Options</div>
                        <ul className="space-y-1">
                          {q.options.map((opt) => (
                            <li key={opt.id} className="flex items-start gap-2 text-sm">
                              <Badge variant={opt.is_correct ? "default" : "outline"}>{opt.label || ""}</Badge>
                              <span className={opt.is_correct ? "font-medium" : ""}>{opt.content}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Media (render inline) */}
                    {q.question_media && q.question_media.length > 0 && (
                      <div className="text-sm">
                        <div className="font-medium mb-2">Médias</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {q.question_media.map((m) => (
                            <div key={m.id} className="border rounded p-2 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="capitalize">{m.media_type || 'media'}</Badge>
                                {typeof m.display_order === 'number' && (
                                  <span className="text-[10px] text-gray-500">Ordre {m.display_order}</span>
                                )}
                              </div>
                              {(() => {
                                const t = (m.media_type || '').toLowerCase();
                                if (t.includes('audio')) {
                                  return (
                                    <audio controls className="w-full">
                                      <source src={m.media_url} />
                                    </audio>
                                  );
                                }
                                if (t.includes('video')) {
                                  return (
                                    <video controls className="w-full rounded" src={m.media_url} />
                                  );
                                }
                                if (t.includes('image')) {
                                  return (
                                    <img src={m.media_url} alt={m.description || 'image'} className="w-full h-40 object-cover rounded" />
                                  );
                                }
                                if (t.includes('pdf') || t.includes('document')) {
                                  return (
                                    <iframe src={m.media_url} className="w-full h-48 rounded" title={m.description || 'document'} />
                                  );
                                }
                                // Fallback: show link
                                return (
                                  <a href={m.media_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-xs">
                                    {m.media_url}
                                  </a>
                                );
                              })()}
                              {m.description && (
                                <div className="mt-2 text-xs text-gray-700">{m.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-3 lg:hidden" />

                  <div className="mt-3 lg:mt-0 flex-shrink-0 flex items-start">
                    <Button variant="outline" onClick={() => {
                      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
                      const url = `/admin-dashboard/questions/${q.id}?returnUrl=${encodeURIComponent(current)}`
                      router.push(url)
                    }}>
                      Modifier
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
