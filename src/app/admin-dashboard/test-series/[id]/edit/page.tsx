"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

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

interface Module {
  id: string;
  name: string;
}

export default function TestSeriesEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [series, setSeries] = useState<TestSeries | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    series: Partial<TestSeries>;
    questions: { [id: string]: Partial<QuestionItem> };
    options: { [id: string]: Partial<QuestionOption> };
  }>({ series: {}, questions: {}, options: {} });

  const seriesId = params?.id;

  useEffect(() => {
    if (!seriesId) return;
    fetchAll();
  }, [seriesId]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, name')
        .order('name');
      
      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      const { data: seriesData, error: seriesErr } = await supabase
        .from("test_series")
        .select("*")
        .eq("id", seriesId)
        .single();

      if (seriesErr) throw seriesErr;
      setSeries(seriesData as TestSeries);

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

  const updateSeries = (field: keyof TestSeries, value: any) => {
    if (!series) return;
    
    setSeries(prev => prev ? { ...prev, [field]: value } : null);
    setPendingChanges(prev => ({
      ...prev,
      series: { ...prev.series, [field]: value }
    }));
    setHasChanges(true);
  };

  const updateQuestion = (questionId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
    setPendingChanges(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [questionId]: { ...prev.questions[questionId], [field]: value }
      }
    }));
    setHasChanges(true);
  };

  const updateOption = (optionId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => ({
      ...q,
      options: q.options?.map(opt => 
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    })));
    setPendingChanges(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [optionId]: { ...prev.options[optionId], [field]: value }
      }
    }));
    setHasChanges(true);
  };

  const saveAllChanges = async () => {
    if (!hasChanges || saving) return;
    
    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      
      // Sauvegarder les modifications de la série
      if (Object.keys(pendingChanges.series).length > 0 && series) {
        const { error: seriesError } = await supabase
          .from('test_series')
          .update(pendingChanges.series)
          .eq('id', series.id);
        if (seriesError) throw seriesError;
      }
      
      // Sauvegarder les modifications des questions
      for (const [questionId, changes] of Object.entries(pendingChanges.questions)) {
        if (Object.keys(changes).length > 0) {
          const { error: questionError } = await supabase
            .from('questions')
            .update(changes)
            .eq('id', questionId);
          if (questionError) throw questionError;
        }
      }
      
      // Sauvegarder les modifications des options
      for (const [optionId, changes] of Object.entries(pendingChanges.options)) {
        if (Object.keys(changes).length > 0) {
          const { error: optionError } = await supabase
            .from('options')
            .update(changes)
            .eq('id', optionId);
          if (optionError) throw optionError;
        }
      }
      
      // Réinitialiser les changements en attente
      setPendingChanges({ series: {}, questions: {}, options: {} });
      setHasChanges(false);
      
      alert('Modifications sauvegardées avec succès!');
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modifier la série</h1>
          <p className="text-gray-600">
            {series?.name || "Série"} • {questions.length} question{questions.length > 1 ? "s" : ""}
            {hasChanges && <span className="text-orange-600 ml-2">• Modifications non sauvegardées</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={saveAllChanges} 
            disabled={!hasChanges || saving}
            className={hasChanges ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin-dashboard/test-series")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la série</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={series?.name || ''}
                onChange={(e) => updateSeries('name', e.target.value)}
                placeholder="Nom de la série"
              />
            </div>
            <div>
              <Label htmlFor="module">Module</Label>
              <Select value={series?.module_id || ''} onValueChange={(value) => updateSeries('module_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={series?.description || ''}
              onChange={(e) => updateSeries('description', e.target.value)}
              placeholder="Description de la série"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time_limit">Durée (minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                value={Math.round((series?.time_limit || 0) / 60)}
                onChange={(e) => updateSeries('time_limit', (parseInt(e.target.value) || 0) * 60)}
                placeholder="30"
                min="1"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Input
                type="checkbox"
                id="is_free"
                checked={series?.is_free || false}
                onChange={(e) => updateSeries('is_free', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_free">Test gratuit</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune question dans cette série.
            </div>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Question #{question.question_number ?? "—"}</Badge>
                  <Input
                    type="number"
                    value={question.points || ''}
                    onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || null)}
                    placeholder="Points"
                    className="w-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom du locuteur</Label>
                    <Input
                      value={question.speaker_name || ''}
                      onChange={(e) => updateQuestion(question.id, 'speaker_name', e.target.value)}
                      placeholder="Nom du locuteur"
                    />
                  </div>
                  <div>
                    <Label>Texte de la question</Label>
                    <Input
                      value={question.question_text || ''}
                      onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                      placeholder="Texte de la question"
                    />
                  </div>
                </div>

                <div>
                  <Label>Contenu</Label>
                  <Textarea
                    value={question.content || ''}
                    onChange={(e) => updateQuestion(question.id, 'content', e.target.value)}
                    placeholder="Contenu de la question"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Contexte</Label>
                  <Textarea
                    value={question.context_text || ''}
                    onChange={(e) => updateQuestion(question.id, 'context_text', e.target.value)}
                    placeholder="Contexte de la question"
                    rows={2}
                  />
                </div>

                {question.options && question.options.length > 0 && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2 mt-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <Input
                            value={option.label || ''}
                            onChange={(e) => updateOption(option.id, 'label', e.target.value)}
                            placeholder="Label"
                            className="w-16"
                          />
                          <Input
                            value={option.content}
                            onChange={(e) => updateOption(option.id, 'content', e.target.value)}
                            placeholder="Contenu de l'option"
                            className="flex-1 w-max"
                          />
                          <Input
                            type="checkbox"
                            checked={option.is_correct || false}
                            onChange={(e) => updateOption(option.id, 'is_correct', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label className="text-sm">Correct</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.question_media && question.question_media.length > 0 && (
                  <div>
                    <Label>Médias</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {question.question_media.map((media) => (
                        <div key={media.id} className="border rounded p-2 bg-gray-50">
                          <Badge variant="outline" className="capitalize mb-2">{media.media_type || 'media'}</Badge>
                          {(() => {
                            const t = (media.media_type || '').toLowerCase();
                            if (t.includes('audio')) {
                              return <audio controls className="w-full"><source src={media.media_url} /></audio>;
                            }
                            if (t.includes('video')) {
                              return <video controls className="w-full rounded" src={media.media_url} />;
                            }
                            if (t.includes('image')) {
                              return <img src={media.media_url} alt={media.description || 'image'} className="w-full h-32 object-cover rounded" />;
                            }
                            return <a href={media.media_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-xs">{media.media_url}</a>;
                          })()}
                          <Textarea
                            value={media.description || ''}
                            placeholder="Description du média"
                            className="mt-2 text-xs"
                            rows={2}
                            readOnly
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}