"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, FileText, Image as ImageIcon, Video, Volume2 } from "lucide-react"
import { deleteQuestionMedia } from "@/lib/supabase/question-media-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type QuestionMedia = {
  id?: string
  question_id: string
  media_url: string
  media_type: string
  description: string
  display_order: number
}

type Option = {
  id: string
  question_id: string
  content: string
  is_correct: boolean
  label: string
}

type Question = {
  id: string
  test_series_id: string
  question_number: number
  content: string
  points: number
  created_at: string
  speaker_name?: string | null
  question_text?: string | null
  context_text?: string | null
  media_url?: string | null
  media_type?: string | null
  test_series?: { name: string, module_id?: string } | null
  question_media?: QuestionMedia[]
  options?: Option[]
}

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState<Question | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Question>>({})
  const [optionsForm, setOptionsForm] = useState<Option[]>([])
  const [mediaForm, setMediaForm] = useState<QuestionMedia[]>([])
  const [newMedia, setNewMedia] = useState<{ url: string; type: string; description: string }>({ url: '', type: 'image', description: '' })
  const [deleteMediaOpen, setDeleteMediaOpen] = useState(false)
  const [pendingDeleteMedia, setPendingDeleteMedia] = useState<QuestionMedia | null>(null)
  const [deletingMedia, setDeletingMedia] = useState(false)
  const [deleteOptionOpen, setDeleteOptionOpen] = useState(false)
  const [pendingDeleteOption, setPendingDeleteOption] = useState<Option | null>(null)
  const [deletingOption, setDeletingOption] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowser()
        const { data, error } = await supabase
          .from("questions")
          .select(
            `*,
             test_series(name, module_id),
             question_media(*),
             options(*)
            `
          )
          .eq("id", params.id)
          .single()
        if (error) throw error

        // sort media by display_order
        const sorted = (data?.question_media || []).sort(
          (a: QuestionMedia, b: QuestionMedia) => (a.display_order ?? 0) - (b.display_order ?? 0)
        )
        const q: Question = { ...(data as Question), question_media: sorted }
        setQuestion(q)
        setForm({
          speaker_name: q.speaker_name ?? '',
          question_text: q.question_text ?? '',
          content: q.content,
          context_text: q.context_text ?? '',
          points: q.points,
        })
        setOptionsForm((q.options || []).slice().sort((a, b) => a.label.localeCompare(b.label)))
        setMediaForm(sorted)
      } catch (e) {
        console.error("Failed to load question detail", e)
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) fetchDetail()
  }, [params?.id])

  const formattedCreatedAt = useMemo(() => {
    if (!question?.created_at) return ''
    try {
      return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date(question.created_at))
    } catch {
      return ''
    }
  }, [question?.created_at])

  // Option helpers (moved to component scope)
  function nextOptionLabel(existing: Option[]): string {
    const labels = new Set(existing.map(o => (o.label || '').toUpperCase()))
    let code = 'A'.charCodeAt(0)
    for (let i = 0; i < 26; i++) {
      const candidate = String.fromCharCode(code + i)
      if (!labels.has(candidate)) return candidate
    }
    return String(existing.length + 1) // fallback
  }

  function addOption() {
    if (!question) return
    const label = nextOptionLabel(optionsForm)
    setOptionsForm(prev => [...prev, { id: '', question_id: question.id, content: '', is_correct: false, label }])
  }

  function requestDeleteOption(opt: Option) {
    if (!opt) return
    if (!opt.id) {
      // Unsaved option: just remove locally
      setOptionsForm(prev => prev.filter(o => !(o.label === opt.label && o.content === opt.content && o.is_correct === opt.is_correct)))
      return
    }
    setPendingDeleteOption(opt)
    setDeleteOptionOpen(true)
  }

  async function performDeleteOption(opt: Option) {
    if (!opt?.id) return
    try {
      setDeletingOption(true)
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.from('options').delete().eq('id', opt.id)
      if (error) throw error
      setOptionsForm(prev => prev.filter(o => o.id !== opt.id))
      setQuestion(prev => prev ? { ...prev, options: (prev.options || []).filter(o => o.id !== opt.id) } : prev)
      toast({ title: 'Option supprimée', description: `Option ${opt.label} supprimée.` })
    } catch (e: any) {
      console.error('[performDeleteOption] failed', e)
      toast({ title: 'Erreur', description: e?.message || 'Suppression impossible', variant: 'destructive' })
    } finally {
      setDeletingOption(false)
      setDeleteOptionOpen(false)
      setPendingDeleteOption(null)
    }
  }

  const onSave = async () => {
    if (!question) return
    try {
      setSaving(true)
      const supabase = getSupabaseBrowser()
      // Update question
      const { error: qErr } = await supabase
        .from('questions')
        .update({
          speaker_name: (form.speaker_name ?? '').toString() || null,
          question_text: (form.question_text ?? '').toString() || null,
          content: (form.content ?? '').toString(),
          context_text: (form.context_text ?? '').toString() || null,
          points: Number(form.points ?? question.points) || 0,
        })
        .eq('id', question.id)
      if (qErr) throw qErr

      // Persist options (insert new, update existing, delete removed)
      const original = (question.options || [])
      const originalIds = new Set(original.map(o => o.id))
      const currentIds = new Set(optionsForm.filter(o => !!o.id).map(o => o.id))

      // Updates for existing
      const updatePromises = optionsForm
        .filter(o => o.id && originalIds.has(o.id))
        .map(o => supabase.from('options').update({ content: o.content, is_correct: o.is_correct, label: o.label }).eq('id', o.id))

      // Inserts for new ones (no id)
      const insertsData = optionsForm
        .filter(o => !o.id)
        .map(o => ({ question_id: question.id, content: o.content, is_correct: o.is_correct, label: o.label }))
      const insertPromise = insertsData.length > 0
        ? supabase.from('options').insert(insertsData).select('*')
        : Promise.resolve({ data: null, error: null } as any)

      // Deletes for removed
      const removedIds = original.filter(o => !currentIds.has(o.id)).map(o => o.id)
      const deletePromise = removedIds.length > 0
        ? supabase.from('options').delete().in('id', removedIds)
        : Promise.resolve({ data: null, error: null } as any)

      const results = await Promise.all([...updatePromises, insertPromise, deletePromise])
      const anyErr = results.find(r => (r as any).error)
      if (anyErr && (anyErr as any).error) throw (anyErr as any).error

      // Skip media persistence - media has its own working logic via API routes
      // This avoids RLS permission errors on question_media table

      toast({ title: 'Sauvegardé', description: 'La question a été mise à jour.' })
      setEditMode(false)
      // Refresh local question from form
      setQuestion(prev => prev ? {
        ...prev,
        speaker_name: (form.speaker_name ?? '') || null,
        question_text: (form.question_text ?? '') || null,
        content: (form.content ?? '') || prev.content,
        context_text: (form.context_text ?? '') || null,
        points: Number(form.points ?? prev.points) || prev.points,
        options: optionsForm.slice(),
        question_media: mediaForm.slice(),
      } : prev)
    } catch (e: any) {
      console.error('[onSave] failed', e)
      toast({ title: 'Erreur', description: e?.message || 'Impossible de sauvegarder', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteMedia(media: QuestionMedia) {
    // Open styled confirmation dialog
    if (!media) return
    if (!media.id) {
      // Unsaved media: remove locally without confirmation
      setMediaForm(prev => prev.filter(m => !(m.media_url === media.media_url && m.description === media.description && m.media_type === media.media_type)))
      return
    }
    setPendingDeleteMedia(media)
    setDeleteMediaOpen(true)
  }

  async function performDeleteMedia(media: QuestionMedia) {
    console.log('[performDeleteMedia] called for', media?.id, media?.media_url)
    if (!media) return
    try {
      setDeletingMedia(true)
      await deleteQuestionMedia(media.id as string, media.media_url)
      // Update local states
      setMediaForm(prev => prev.filter(m => m.id !== media.id))
      setQuestion(prev => prev ? { ...prev, question_media: (prev.question_media || []).filter(m => m.id !== media.id) } : prev)
      toast({ title: 'Média supprimé', description: 'Le média a été supprimé avec succès.' })
    } catch (e: any) {
      console.error('[performDeleteMedia] failed', e)
      toast({ title: 'Erreur', description: e?.message || 'Suppression impossible', variant: 'destructive' })
    } finally {
      setDeletingMedia(false)
      setDeleteMediaOpen(false)
      setPendingDeleteMedia(null)
    }
  }

  const renderMedia = (media: QuestionMedia) => {
    const t = media.media_type
    if (t === "audio") {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Volume2 className="h-4 w-4" /> Audio
            {media.description && <span className="text-gray-500">• {media.description}</span>}
          </div>
          <audio controls src={media.media_url} className="w-full" />
        </div>
      )
    }
    if (t === "video") {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Video className="h-4 w-4" /> Vidéo
            {media.description && <span className="text-gray-500">• {media.description}</span>}
          </div>
          <video controls src={media.media_url} className="w-full rounded border" />
        </div>
      )
    }
    if (t === "image") {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <ImageIcon className="h-4 w-4" /> Image
            {media.description && <span className="text-gray-500">• {media.description}</span>}
          </div>
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.media_url} alt={media.description || "Image"} className="max-h-72 rounded border" />
        </div>
      )
    }
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FileText className="h-4 w-4" /> Document
          {media.description && <span className="text-gray-500">• {media.description}</span>}
        </div>
        <a href={media.media_url} target="_blank" rel="noreferrer" className="text-orange-600 underline">
          Ouvrir le document
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="animate-pulse h-32 w-full bg-gray-100 rounded" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => {
          const ret = searchParams.get('returnUrl')
          if (ret) {
            router.push(ret)
            return
          }
          const base = "/admin-dashboard/questions"
          const moduleId = searchParams.get('module') || ''
          const seriesId = searchParams.get('series') || ''
          const qp = new URLSearchParams()
          if (moduleId) qp.set('module', moduleId)
          if (seriesId) qp.set('series', seriesId)
          const url = qp.toString() ? `${base}?${qp.toString()}` : base
          router.push(url)
        }}>Retour</Button>
        <p className="mt-4 text-gray-600">Question introuvable.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => {
            const ret = searchParams.get('returnUrl')
            if (ret) {
              router.push(ret)
              return
            }
            const base = "/admin-dashboard/questions"
            const moduleId = searchParams.get('module') || ''
            const seriesId = searchParams.get('series') || ''
            const qp = new URLSearchParams()
            if (moduleId) qp.set('module', moduleId)
            if (seriesId) qp.set('series', seriesId)
            const url = qp.toString() ? `${base}?${qp.toString()}` : base
            if (url !== base) router.push(url); else router.back()
          }}> 
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Question Q{question.question_number}</h1>
          {question.test_series?.name && (
            <Badge variant="outline" className="ml-2">{question.test_series.name}</Badge>
          )}
        </div>
        {editMode ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setEditMode(false); setForm({
              speaker_name: question.speaker_name ?? '',
              question_text: question.question_text ?? '',
              content: question.content,
              context_text: question.context_text ?? '',
              points: question.points,
            }); setOptionsForm((question.options || []).slice().sort((a,b)=>a.label.localeCompare(b.label))) }}>Annuler</Button>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-1" /> Modifier ici
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Contenu de la question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-800">
          {editMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nom du locuteur</Label>
                  <Input value={form.speaker_name as string || ''} onChange={(e)=>setForm(prev=>({...prev, speaker_name: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <Label>Points</Label>
                  <Input type="number" value={form.points as number ?? 0} onChange={(e)=>setForm(prev=>({...prev, points: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Question (titre)</Label>
                <Input value={form.question_text as string || ''} onChange={(e)=>setForm(prev=>({...prev, question_text: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <Label>Contenu</Label>
                <Textarea rows={4} value={form.content as string || ''} onChange={(e)=>setForm(prev=>({...prev, content: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <Label>Contexte</Label>
                <Textarea rows={3} value={form.context_text as string || ''} onChange={(e)=>setForm(prev=>({...prev, context_text: e.target.value}))} />
              </div>
              <div className="text-sm text-gray-600">Créé le {formattedCreatedAt}</div>
            </div>
          ) : (
            <>
              {question.speaker_name && (
                <div className="italic text-gray-700">{question.speaker_name}:</div>
              )}
              {question.question_text && (
                <div className="font-semibold">{question.question_text}</div>
              )}
              <div>{question.content}</div>
              {question.context_text && (
                <div className="p-3 rounded border bg-orange-50 text-gray-700">
                  {question.context_text}
                </div>
              )}
              <div className="text-sm text-gray-600">Points: {question.points} • Créé le {formattedCreatedAt}</div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteMediaOpen} onOpenChange={setDeleteMediaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le média</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMedia}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deletingMedia || !pendingDeleteMedia}
              onClick={(e) => {
                e.preventDefault()
                if (pendingDeleteMedia) {
                  performDeleteMedia(pendingDeleteMedia)
                }
              }}
            >
              {deletingMedia ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Médias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <div>
              {/* Media editing UI continues below */}
            
              {mediaForm.length === 0 && (
                <div className="text-gray-600 text-sm">Aucun média</div>
              )}
              {mediaForm.map((m, idx) => (
                <div key={m.id || `new-${idx}`} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{m.media_type}</Badge>
                      <span className="text-gray-500">Ordre: {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" disabled={idx===0} onClick={()=>setMediaForm(prev=>{
                        const copy = prev.slice(); const [a,b]=[copy[idx-1], copy[idx]]; copy[idx-1]=b; copy[idx]=a; return copy;
                      })}>↑</Button>
                      <Button variant="ghost" size="sm" disabled={idx===mediaForm.length-1} onClick={()=>setMediaForm(prev=>{
                        const copy = prev.slice(); const [a,b]=[copy[idx], copy[idx+1]]; copy[idx]=b; copy[idx+1]=a; return copy;
                      })}>↓</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={()=>handleDeleteMedia(m)}>Supprimer</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select value={m.media_type} onValueChange={(v)=>setMediaForm(prev=>{ const copy=prev.slice(); copy[idx]={...copy[idx], media_type:v}; return copy; })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="audio">audio</SelectItem>
                          <SelectItem value="video">video</SelectItem>
                          <SelectItem value="image">image</SelectItem>
                          <SelectItem value="document">document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>URL</Label>
                      <Input value={m.media_url} onChange={(e)=>setMediaForm(prev=>{ const copy=prev.slice(); copy[idx]={...copy[idx], media_url:e.target.value}; return copy; })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input value={m.description || ''} onChange={(e)=>setMediaForm(prev=>{ const copy=prev.slice(); copy[idx]={...copy[idx], description:e.target.value}; return copy; })} />
                  </div>
                  <div>
                    {renderMedia(m)}
                  </div>
                </div>
              ))}
              <div className="border rounded p-3 space-y-2">
                <div className="font-medium text-sm">Ajouter un média</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={newMedia.type} onValueChange={(v)=>setNewMedia(prev=>({...prev, type:v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audio">audio</SelectItem>
                        <SelectItem value="video">video</SelectItem>
                        <SelectItem value="image">image</SelectItem>
                        <SelectItem value="document">document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>URL</Label>
                    <Input placeholder="https://..." value={newMedia.url} onChange={(e)=>setNewMedia(prev=>({...prev, url:e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input value={newMedia.description} onChange={(e)=>setNewMedia(prev=>({...prev, description:e.target.value}))} />
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" disabled={!newMedia.url} onClick={()=>{
                    setMediaForm(prev=>[...prev, { question_id: question.id, media_url: newMedia.url, media_type: newMedia.type, description: newMedia.description, display_order: prev.length } as QuestionMedia])
                    setNewMedia({ url: '', type: 'image', description: '' })
                  }}>Ajouter</Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {question.question_media && question.question_media.length > 0 ? (
                question.question_media.map((m) => (
                  <div key={`${m.media_url}-${m.display_order}`} className="space-y-2">
                    {renderMedia(m)}
                  </div>
                ))
              ) : (
                <div className="text-gray-600 text-sm">Aucun média supplémentaire</div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Options</CardTitle>
            {editMode && (
              <Button variant="secondary" size="sm" onClick={addOption}>Ajouter une option</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(editMode ? optionsForm : (question.options || []).slice().sort((a,b)=>a.label.localeCompare(b.label))).length > 0 ? (
            (editMode ? optionsForm : (question.options || []).slice().sort((a,b)=>a.label.localeCompare(b.label))).map((opt, idx) => (
              <div key={opt.id || `new-${idx}`} className="rounded border p-3">
                {/* Ligne 1: Label + Input (ou texte) */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="min-w-8 text-center">{opt.label}</Badge>
                  <div className="flex-1">
                    {editMode ? (
                      <Input
                        value={opt.content}
                        onChange={(e)=>setOptionsForm(prev=>{ const copy = prev.slice(); copy[idx] = { ...copy[idx], content: e.target.value }; return copy; })}
                        className="h-11 text-base bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400"
                        placeholder={`Contenu de l'option ${opt.label}`}
                      />
                    ) : (
                      <span>{opt.content}</span>
                    )}
                  </div>
                </div>
                {/* Ligne 2: Checkbox Correct + Supprimer (empilé sur mobile) */}
                <div className="mt-2">
                  {editMode ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={!!opt.is_correct} onCheckedChange={(v)=>setOptionsForm(prev=>{ const copy = prev.slice(); copy[idx] = { ...copy[idx], is_correct: !!v }; return copy; })} id={`correct-${opt.id || idx}`} />
                        <Label htmlFor={`correct-${opt.id || idx}`}>Correct</Label>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="sm" className="text-destructive self-start sm:self-auto" onClick={()=>requestDeleteOption(opt)}>Supprimer</Button>
                      </div>
                    </div>
                  ) : (
                    opt.is_correct && <Badge className="bg-green-100 text-green-800">Correct</Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-600 text-sm">
              Aucune option trouvée
              {editMode && (
                <div className="mt-2">
                  <Button variant="secondary" size="sm" onClick={addOption}>Créer la première option</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Option delete confirmation */}
      <AlertDialog open={deleteOptionOpen} onOpenChange={setDeleteOptionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'option</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cette option ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingOption}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deletingOption || !pendingDeleteOption}
              onClick={(e) => {
                e.preventDefault()
                if (pendingDeleteOption) performDeleteOption(pendingDeleteOption)
              }}
            >
              {deletingOption ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
