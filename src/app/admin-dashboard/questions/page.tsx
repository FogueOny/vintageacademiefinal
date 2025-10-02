'use client'

type QuestionMedia = {
  media_url: string;
  media_type: string;
  description: string;
  display_order: number;
};

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import { isFileValid, ACCEPTED_FILE_TYPES } from '@/lib/supabase/storage-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, BookOpen, FileText, Eye, EyeOff, Search, Filter, Upload, X, Image, Volume2, Video } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Module {
  id: string
  name: string
  description: string
  type: string
  slug: string
  icon: string
  created_at: string
}

interface TestSeries {
  id: string
  name: string
  module_id: string
  description: string
  time_limit: number
  slug: string
  is_free?: boolean
  created_at: string
}

interface Question {
  id: string
  test_series_id: string
  question_number: number
  content: string
  media_url?: string
  media_type?: string
  points: number
  // Nouveaux champs pour les tests écrits
  speaker_name?: string
  question_text?: string
  context_text?: string
  created_at: string
  test_series?: {
    name: string
  }
  question_media?: {
    media_url: string;
    media_type: string;
    description: string;
    display_order: number;
  }[];
  has_additional_media?: boolean;
}

interface Option {
  id: string
  question_id: string
  content: string
  is_correct: boolean
  label: string
  created_at: string
}

interface MediaFile {
  file: File | null
  url: string | null
  type: string
  preview: string | null
  uploading: boolean
}

export default function QuestionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [modules, setModules] = useState<Module[]>([])
  const [testSeries, setTestSeries] = useState<TestSeries[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedTestSeries, setSelectedTestSeries] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false) // Nouvel état pour la sauvegarde
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Helpers to persist selections in the URL
  const updateQueryParams = (moduleId?: string, seriesId?: string) => {
    const base = '/admin-dashboard/questions'
    const params = new URLSearchParams()
    if (moduleId) params.set('module', moduleId)
    if (seriesId) params.set('series', seriesId)
    const url = params.toString() ? `${base}?${params.toString()}` : base
    router.replace(url)
  }

  const handleModuleChange = (value: string) => {
    setSelectedModule(value)
    // Reset series when module changes
    setSelectedTestSeries('')
    // Persist only module in URL
    updateQueryParams(value, undefined)
  }

  const handleSeriesChange = (value: string) => {
    setSelectedTestSeries(value)
    // Persist both module and series in URL
    const moduleId = selectedModule || searchParams.get('module') || ''
    updateQueryParams(moduleId, value)
  }

  // Form state
  const [formData, setFormData] = useState({
    content: '',
    question_number: 1,
    points: 1,
    // Nouveaux champs pour les tests écrits (optionnels)
    speaker_name: '', // Nom de la personne qui parle (ex: Joel)
    question_text: '', // Texte de la question en gras
    context_text: '', // Texte de contexte supplémentaire
    options: [
      { content: '', is_correct: false, label: 'A' },
      { content: '', is_correct: false, label: 'B' },
      { content: '', is_correct: false, label: 'C' },
      { content: '', is_correct: false, label: 'D' }
    ]
  })

  // Media files state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([
    { file: null, url: null, type: 'image', preview: null, uploading: false },
    { file: null, url: null, type: 'image', preview: null, uploading: false }
  ])

  // Load modules on component mount
  useEffect(() => {
    fetchModules()
  }, [])

  // Read URL params to preselect module and series
  useEffect(() => {
    const moduleId = searchParams.get('module')
    if (moduleId && !selectedModule) {
      setSelectedModule(moduleId)
    }
  }, [searchParams, selectedModule])

  // After test series list loads for selected module, select the series from URL
  useEffect(() => {
    const moduleId = searchParams.get('module')
    const seriesId = searchParams.get('series')
    if (!moduleId || !seriesId) return
    if (selectedModule !== moduleId) return
    if (testSeries.length > 0 && !selectedTestSeries) {
      const exists = testSeries.some(ts => ts.id === seriesId)
      if (exists) setSelectedTestSeries(seriesId)
    }
  }, [searchParams, selectedModule, testSeries, selectedTestSeries])

  // Load test series when module is selected
  useEffect(() => {
    if (selectedModule) {
      fetchTestSeries(selectedModule)
      setSelectedTestSeries('')
      setQuestions([])
    }
  }, [selectedModule])

  // Load questions when test series is selected
  useEffect(() => {
    if (selectedTestSeries) {
      fetchQuestions(selectedTestSeries)
    }
  }, [selectedTestSeries])

  // When questions are loaded, open edit dialog if edit param is present
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId) return
    if (questions.length === 0) return
    const q = questions.find(q => q.id === editId)
    if (q) {
      // Prevent re-opening by clearing the param via shallow navigation
      handleEdit(q)
      const moduleId = searchParams.get('module')
      const seriesId = searchParams.get('series')
      const base = '/admin-dashboard/questions'
      const query = moduleId && seriesId ? `?module=${moduleId}&series=${seriesId}` : ''
      router.replace(`${base}${query}`)
    }
  }, [searchParams, questions])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedTestSeries, searchTerm, filterType, viewMode])

  // Calculate next question number when questions change
  useEffect(() => {
    if (questions.length > 0 && !editingQuestion) {
      const maxQuestionNumber = Math.max(...questions.map(q => q.question_number))
      setFormData(prev => ({
        ...prev,
        question_number: maxQuestionNumber + 1
      }))
    } else if (questions.length === 0 && !editingQuestion) {
      setFormData(prev => ({
        ...prev,
        question_number: 1
      }))
    }
  }, [questions, editingQuestion])

  const fetchModules = async () => {
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at')

      if (error) throw error
      setModules(data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les modules",
        variant: "destructive"
      })
    }
  }

  const fetchTestSeries = async (moduleId: string) => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase
        .from('test_series')
        .select('*')
        .eq('module_id', moduleId)
        .order('name')

      if (error) throw error
      // Natural numeric sort (e.g., "Série 1" ... "Série 10" ... "Série 40")
      const sorted = (data || []).sort((a: TestSeries, b: TestSeries) => {
        const numA = parseInt((a.name.match(/\d+/) || ["0"])[0], 10)
        const numB = parseInt((b.name.match(/\d+/) || ["0"])[0], 10)
        if (numA !== numB) return numA - numB
        // Fallback to locale compare with numeric option
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      })
      setTestSeries(sorted)
    } catch (error) {
      console.error('Error fetching test series:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les séries de tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async (testSeriesId: string) => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          test_series (
            name
          ),
          question_media (
            media_url,
            media_type,
            description,
            display_order
          )
        `)
        .eq('test_series_id', testSeriesId)
        .order('question_number')

      if (error) throw error
      
      // Traiter les données pour ajouter le premier média aux propriétés principales
      const processedQuestions = (data || []).map((question: any) => {
        if (question.question_media && question.question_media.length > 0) {
          // Trier par display_order et prendre le premier
          const sortedMedia = question.question_media.sort((a: QuestionMedia, b: QuestionMedia) => a.display_order - b.display_order)
          const primaryMedia = sortedMedia[0]
          
          return {
            ...question,
            // Si la question n'a pas de media_url principal, utiliser celui de question_media
            media_url: question.media_url || primaryMedia.media_url,
            media_type: question.media_type === 'none' || !question.media_type ? primaryMedia.media_type : question.media_type,
            // Ajouter une propriété pour indiquer qu'il y a des médias supplémentaires
            has_additional_media: question.question_media.length > 1
          }
        }
        return question
      })
      
      setQuestions(processedQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les questions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async (questionId: string) => {
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase
        .from('options')
        .select('*')
        .eq('question_id', questionId)
        .order('label')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching options:', error)
      return []
    }
  }

  const handleFileSelect = (index: number, file: File | null) => {
    if (!file) {
      // Clear file
      const newMediaFiles = [...mediaFiles]
      newMediaFiles[index] = { file: null, url: null, type: 'image', preview: null, uploading: false }
      setMediaFiles(newMediaFiles)
      return
    }

    // Determine media type
    let mediaType = 'image'
    if (file.type.startsWith('audio/')) mediaType = 'audio'
    else if (file.type.startsWith('video/')) mediaType = 'video'

    // Validate file
    if (!isFileValid(file, mediaType)) {
      return
    }

    // Create preview for images
    let preview: string | null = null
    if (mediaType === 'image') {
      preview = URL.createObjectURL(file)
    }

    const newMediaFiles = [...mediaFiles]
    newMediaFiles[index] = { 
      file, 
      url: null, 
      type: mediaType, 
      preview, 
      uploading: false 
    }
    setMediaFiles(newMediaFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTestSeries) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une série de tests",
        variant: "destructive"
      })
      return
    }

    // Validation des options
    const hasCorrectAnswer = formData.options.some(option => option.is_correct)
    if (!hasCorrectAnswer) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une réponse correcte",
        variant: "destructive"
      })
      return
    }

    const hasEmptyOptions = formData.options.some(option => !option.content.trim())
    if (hasEmptyOptions) {
      toast({
        title: "Erreur",
        description: "Toutes les options doivent avoir un contenu",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true) // Utiliser saving pour la popup de patience
      setLoading(true) // Garder loading pour les autres indicateurs
      const supabase = getSupabaseBrowser()

      // Vérifier la session avant de procéder
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        toast({
          title: "Erreur d'authentification",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive"
        })
        return
      }

      // ÉTAPE 1: Créer/modifier la question D'ABORD (sans média)
      const questionData = {
        test_series_id: selectedTestSeries,
        question_number: formData.question_number,
        content: formData.content.trim(),
        media_url: null, // Sera mis à jour après upload
        media_type: null, // Sera mis à jour après upload
        points: formData.points,
        // Nouveaux champs pour les tests écrits (optionnels)
        speaker_name: formData.speaker_name.trim() || null,
        question_text: formData.question_text.trim() || null,
        context_text: formData.context_text.trim() || null
      }

      console.log('Étape 1: Enregistrement de la question sans média:', questionData)

      let questionId: string
      if (editingQuestion) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id)
        
        if (updateError) {
          console.error('Erreur lors de la mise à jour de la question:', updateError)
          throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
        }
        questionId = editingQuestion.id
        console.log('Question mise à jour avec succès, ID:', questionId)
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('questions')
          .insert([questionData])
          .select()
        
        if (insertError) {
          console.error('Erreur lors de l\'insertion de la question:', insertError)
          throw new Error(`Erreur lors de la création: ${insertError.message}`)
        }
        
        if (!insertData || insertData.length === 0) {
          throw new Error('Aucune donnée retournée après l\'insertion')
        }
        
        questionId = insertData[0].id
        console.log('Question créée avec succès, ID:', questionId)
      }

      // ÉTAPE 2: Upload des médias avec l'ID de la question (si il y en a)
      let primaryMediaUrl: string | null = null
      let primaryMediaType: string | null = null

      const filesToUpload = mediaFiles.filter(mf => mf.file)
      if (filesToUpload.length > 0) {
        console.log('Étape 2: Upload des médias avec ID question:', questionId)
        
        // Upload du premier fichier seulement pour simplifier
        const mediaFile = filesToUpload[0]
        try {
          const uploadedUrl = await uploadMediaWithAPI(mediaFile.file!, mediaFile.type, questionId, session.user.id)
          primaryMediaUrl = uploadedUrl
          primaryMediaType = mediaFile.type
          console.log('Média uploadé avec succès:', uploadedUrl)
        } catch (uploadError: any) {
          console.error('Erreur lors de l\'upload du média:', uploadError)
          toast({
            title: "Attention",
            description: `Question créée mais erreur média: ${uploadError.message}`,
            variant: "destructive"
          })
          // Continue sans bloquer la création de la question
        }
      }

      // ÉTAPE 3: Mettre à jour la question avec l'URL du média (si upload réussi)
      if (primaryMediaUrl) {
        console.log('Étape 3: Mise à jour de la question avec l\'URL du média')
        const { error: updateMediaError } = await supabase
          .from('questions')
          .update({
            media_url: primaryMediaUrl,
            media_type: primaryMediaType
          })
          .eq('id', questionId)

        if (updateMediaError) {
          console.error('Erreur lors de la mise à jour du média:', updateMediaError)
          // Ne pas échouer pour cela
        }
      }

      // ÉTAPE 4: Gestion des options
      // Delete existing options if editing
      if (editingQuestion) {
        const { error: deleteError } = await supabase
          .from('options')
          .delete()
          .eq('question_id', questionId)
        
        if (deleteError) {
          console.error('Erreur lors de la suppression des options:', deleteError)
          throw new Error(`Erreur lors de la suppression des options: ${deleteError.message}`)
        }
      }

      // Insert new options
      const optionsData = formData.options.map(option => ({
        question_id: questionId,
        content: option.content.trim(),
        is_correct: option.is_correct,
        label: option.label
      }))

      console.log('Données des options à insérer:', optionsData)

      const { error: optionsError } = await supabase
        .from('options')
        .insert(optionsData)

      if (optionsError) {
        console.error('Erreur lors de l\'insertion des options:', optionsError)
        throw new Error(`Erreur lors de la création des options: ${optionsError.message}`)
      }

      toast({
        title: "Succès",
        description: editingQuestion ? "Question mise à jour avec succès" : "Question créée avec succès",
      })

      setIsDialogOpen(false)
      setEditingQuestion(null)
      resetForm()
      fetchQuestions(selectedTestSeries)
    } catch (error: any) {
      console.error('Erreur complète lors de la sauvegarde:', error)
      
      let errorMessage = "Une erreur inattendue s'est produite"
      
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error.details) {
        errorMessage = error.details
      }
      
      toast({
        title: "Erreur lors de l'enregistrement",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  // Nouvelle fonction pour upload via l'API avec l'ID de la question
  const uploadMediaWithAPI = async (file: File, mediaType: string, questionId: string, userId: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const metadata = {
      questionId: questionId, // Utiliser l'ID réel de la question
      mediaType: mediaType,
      description: `Média pour question ${questionId}`,
      displayOrder: 0,
      userId: userId
    }
    
    formData.append('metadata', JSON.stringify(metadata))

    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse API upload-media:', errorText)
      throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 100)}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error('Upload échoué côté serveur')
    }

    return result.media.media_url
  }

  const handleEdit = async (question: Question) => {
    setEditingQuestion(question)
    
    // Fetch options for this question
    const questionOptions = await fetchOptions(question.id)
    
    // Ensure we have 4 options (A, B, C, D)
    const formattedOptions = ['A', 'B', 'C', 'D'].map(label => {
      const existingOption = questionOptions.find((opt: Option) => opt.label === label)
      return existingOption || { content: '', is_correct: false, label }
    })

    setFormData({
      content: question.content,
      question_number: question.question_number,
      points: question.points,
      // Charger les nouveaux champs pour les tests écrits
      speaker_name: question.speaker_name || '',
      question_text: question.question_text || '',
      context_text: question.context_text || '',
      options: formattedOptions
    })

    // Reset media files 
    const newMediaFiles: MediaFile[] = [
      { file: null, url: null, type: 'image', preview: null, uploading: false },
      { file: null, url: null, type: 'image', preview: null, uploading: false }
    ]

    // Charger tous les médias de la question
    try {
      const supabase = getSupabaseBrowser()
      const { data: allMedia } = await supabase
        .from('question_media')
        .select('*')
        .eq('question_id', question.id)
        .order('display_order')

      console.log('Médias trouvés pour la question:', allMedia)

      if (allMedia && allMedia.length > 0) {
        // Remplir les slots de médias avec les médias existants
        allMedia.slice(0, 2).forEach((media: QuestionMedia, index: number) => {
          newMediaFiles[index] = {
            file: null,
            url: media.media_url,
            type: media.media_type,
            preview: media.media_type === 'image' ? media.media_url : null,
            uploading: false
          }
        })
      } else {
        // Fallback: utiliser le média principal de la question si pas de médias dans question_media
        if (question.media_url) {
          newMediaFiles[0] = {
            file: null,
            url: question.media_url,
            type: question.media_type || 'image',
            preview: question.media_type === 'image' ? question.media_url : null,
            uploading: false
          }
        }
      }
    } catch (error) {
      console.error('Error fetching media for edit:', error)
      
      // Fallback: utiliser le média principal
      if (question.media_url) {
        newMediaFiles[0] = {
          file: null,
          url: question.media_url,
          type: question.media_type || 'image',
          preview: question.media_type === 'image' ? question.media_url : null,
          uploading: false
        }
      }
    }

    setMediaFiles(newMediaFiles)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return

    try {
      setLoading(true)
      const supabase = getSupabaseBrowser()
      
      // Delete options first (due to foreign key constraint)
      await supabase
        .from('options')
        .delete()
        .eq('question_id', id)

      // Delete additional media
      await supabase
        .from('question_media')
        .delete()
        .eq('question_id', id)

      // Then delete the question
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Question supprimée",
      })

      fetchQuestions(selectedTestSeries)
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la question",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    // Calculate next question number
    const nextQuestionNumber = questions.length > 0 ? Math.max(...questions.map(q => q.question_number)) + 1 : 1
    
    setFormData({
      content: '',
      question_number: nextQuestionNumber,
      points: 1,
      // Réinitialiser les nouveaux champs pour les tests écrits
      speaker_name: '',
      question_text: '',
      context_text: '',
      options: [
        { content: '', is_correct: false, label: 'A' },
        { content: '', is_correct: false, label: 'B' },
        { content: '', is_correct: false, label: 'C' },
        { content: '', is_correct: false, label: 'D' }
      ]
    })
    setMediaFiles([
      { file: null, url: null, type: 'image', preview: null, uploading: false },
      { file: null, url: null, type: 'image', preview: null, uploading: false }
    ])
  }

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    
    // If this option is set to correct, uncheck others
    if (field === 'is_correct' && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.is_correct = false
      })
    }
    
    setFormData({ ...formData, options: newOptions })
  }

  const removeMediaFile = (index: number) => {
    const newMediaFiles = [...mediaFiles]
    if (newMediaFiles[index].preview) {
      URL.revokeObjectURL(newMediaFiles[index].preview!)
    }
    newMediaFiles[index] = { file: null, url: null, type: 'image', preview: null, uploading: false }
    setMediaFiles(newMediaFiles)
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Volume2 className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      default: return <Image className="h-4 w-4" />
    }
  }

  const getAcceptedFileTypes = (type: string) => {
    return ACCEPTED_FILE_TYPES[type as keyof typeof ACCEPTED_FILE_TYPES]?.join(',') || ''
  }

  // Fonction pour détecter le type de média à partir de l'URL
  const detectMediaType = (mediaUrl: string | null, mediaType: string | null): string | null => {
    // Si pas d'URL, c'est du texte
    if (!mediaUrl) return null
    
    // Si le type est déjà correct et défini, l'utiliser
    if (mediaType && ['audio', 'video', 'image'].includes(mediaType)) {
      return mediaType
    }
    
    // Détecter à partir de l'URL
    const url = mediaUrl.toLowerCase()
    console.log('Détection type pour URL:', url)
    
    // Extensions audio
    if (url.includes('/audio/') || url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/)) {
      console.log('Type détecté: audio')
      return 'audio'
    }
    
    // Extensions vidéo  
    if (url.includes('/video/') || url.match(/\.(mp4|webm|ogv|avi|mov|wmv)(\?|$)/)) {
      console.log('Type détecté: video')
      return 'video'
    }
    
    // Extensions image
    if (url.includes('/image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/)) {
      console.log('Type détecté: image')
      return 'image'
    }
    
    // Par défaut, si il y a une URL mais type non détectable
    console.log('Type détecté: document (par défaut)')
    return 'document'
  }

  const getTypeColor = (mediaUrl: string | null, mediaType: string | null) => {
    const detectedType = detectMediaType(mediaUrl, mediaType)
    if (!detectedType) return 'bg-gray-100 text-gray-800'
    
    switch (detectedType) {
      case 'audio': return 'bg-blue-100 text-blue-800'
      case 'video': return 'bg-green-100 text-green-800'
      case 'image': return 'bg-yellow-100 text-yellow-800'
      case 'document': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (mediaUrl: string | null, mediaType: string | null) => {
    const detectedType = detectMediaType(mediaUrl, mediaType)
    if (!detectedType) return 'Texte'
    
    switch (detectedType) {
      case 'audio': return 'Audio'
      case 'video': return 'Vidéo'
      case 'image': return 'Image'  
      case 'document': return 'Document'
      default: return 'Texte'
    }
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.content?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesType = filterType === 'all' || question.media_type === filterType
    return matchesSearch && matchesType
  })

  // Pagination (max 7 par page)
  const pageSize = 7
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize))
  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const selectedModuleName = modules.find(m => m.id === selectedModule)?.name || ''
  const selectedTestSeriesName = testSeries.find(ts => ts.id === selectedTestSeries)?.name || ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Questions</h1>
          <p className="text-gray-600">Gérez les questions par module et série de tests</p>
        </div>
      </div>

      {/* Selection Steps */}
      <div className="space-y-4">
        {/* Step 1: Module Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Étape 1: Sélectionner un Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModule} onValueChange={handleModuleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisissez un module..." />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" className="z-50 max-h-80 overflow-y-auto">
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name} ({module.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 2: Test Series Selection */}
        {selectedModule && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Étape 2: Sélectionner une Série de Tests
                <Badge variant="outline">{selectedModuleName}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTestSeries} onValueChange={handleSeriesChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez une série de tests..." />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" className="z-50 max-h-80 overflow-y-auto">
                  {testSeries.map((series) => (
                    <SelectItem key={series.id} value={series.id}>
                      {series.name} ({Math.floor(series.time_limit / 60)} min)
                      {series.is_free && <Badge className="ml-2" variant="secondary">Gratuit</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Questions Management */}
        {selectedTestSeries && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Étape 3: Gérer les Questions
                <Badge variant="outline">{selectedModuleName}</Badge>
                <Badge variant="outline">{selectedTestSeriesName}</Badge>
              </CardTitle>
              <CardDescription>
                {questions.length} question{questions.length > 1 ? 's' : ''} trouvée{questions.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4">
                <div className="flex gap-2 flex-wrap w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une question..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    Cartes
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    Tableau
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingQuestion(null)
                        resetForm()
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingQuestion ? 'Modifier la Question' : 'Nouvelle Question'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="content">Contenu de la Question</Label>
                          <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            required
                            rows={3}
                          />
                        </div>
                        
                        {/* Nouveaux champs pour les tests écrits */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Champs spécifiques aux tests écrits (optionnels)
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="speaker_name">Nom de la personne qui parle</Label>
                              <Input
                                id="speaker_name"
                                value={formData.speaker_name}
                                onChange={(e) => setFormData({...formData, speaker_name: e.target.value})}
                                placeholder="Ex: Joël, Marie, etc."
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Sera affiché en italique dans le test
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="question_text">Texte de la question</Label>
                              <Textarea
                                id="question_text"
                                value={formData.question_text}
                                onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                                placeholder="Question spécifique qui sera affichée en gras"
                                rows={2}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Sera affiché en gras dans le test
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="context_text">Texte de contexte</Label>
                              <Textarea
                                id="context_text"
                                value={formData.context_text}
                                onChange={(e) => setFormData({...formData, context_text: e.target.value})}
                                placeholder="Contexte ou informations supplémentaires"
                                rows={3}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Contexte additionnel pour la question
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="question_number">Numéro (Auto-calculé)</Label>
                            <Input
                              id="question_number"
                              type="number"
                              value={formData.question_number}
                              onChange={(e) => setFormData({...formData, question_number: parseInt(e.target.value)})}
                              min="1"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Numéro automatique basé sur la dernière question
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="points">Points</Label>
                            <Input
                              id="points"
                              type="number"
                              value={formData.points}
                              onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                              min="1"
                              required
                            />
                          </div>
                        </div>
                        
                        {/* Media Files Upload */}
                        <div>
                          <Label className="text-base font-medium">Fichiers Média (Max 2, le 2e est facultatif)</Label>
                          <div className="space-y-4 mt-2">
                            {mediaFiles.map((mediaFile, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium">
                                    Fichier {index + 1} {index === 1 && '(Facultatif)'}
                                  </Label>
                                  {(mediaFile.file || mediaFile.url) && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeMediaFile(index)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                
                                {!mediaFile.file && !mediaFile.url && (
                                  <div className="space-y-2">
                                    <Select
                                      value={mediaFile.type}
                                      onValueChange={(value) => {
                                        const newMediaFiles = [...mediaFiles]
                                        newMediaFiles[index].type = value
                                        setMediaFiles(newMediaFiles)
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="audio">Audio</SelectItem>
                                        <SelectItem value="video">Vidéo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="file"
                                      accept={getAcceptedFileTypes(mediaFile.type)}
                                      onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                                      className="cursor-pointer"
                                    />
                                  </div>
                                )}
                                
                                {(mediaFile.file || mediaFile.url) && (
                                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                                    {getMediaIcon(mediaFile.type)}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {mediaFile.file ? mediaFile.file.name : 'Fichier existant'}
                                      </p>
                                      <p className="text-xs text-gray-500 capitalize">
                                        {mediaFile.type}
                                      </p>
                                    </div>
                                    {mediaFile.uploading && (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    )}
                                    {mediaFile.preview && (
                                      <img
                                        src={mediaFile.preview}
                                        alt="Aperçu"
                                        className="h-12 w-12 object-cover rounded"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Options */}
                        <div>
                          <Label className="text-base font-medium">Options de Réponse</Label>
                          <div className="space-y-3 mt-2">
                            {formData.options.map((option, index) => (
                              <div key={index} className="flex flex-col sm:flex-row sm:items-center items-start gap-3 p-3 border rounded">
                                <Badge variant="outline" className="min-w-[24px] justify-center">
                                  {option.label}
                                </Badge>
                                <Input
                                  value={option.content}
                                  onChange={(e) => updateOption(index, 'content', e.target.value)}
                                  placeholder={`Option ${option.label}`}
                                  className="w-full sm:flex-1"
                                  required
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="correct_answer"
                                    checked={option.is_correct}
                                    onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                  <Label className="text-sm">Correct</Label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button type="submit" disabled={saving || loading}>
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Enregistrement...
                              </>
                            ) : editingQuestion ? 'Mettre à jour' : 'Créer'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Chargement...</p>
                </div>
              ) : (
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'table')}>
                  <TabsContent value="cards">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedQuestions.map((question) => (
                        <Card key={question.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Q{question.question_number}</Badge>
                                {(question.media_url || question.media_type) && (
                                  <Badge className={getTypeColor(question.media_url ?? null, question.media_type ?? null)}>
                                    {getTypeLabel(question.media_url ?? null, question.media_type ?? null)}
                                    {question.has_additional_media && <span className="ml-1">+</span>}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const moduleId = selectedModule || searchParams.get('module') || ''
                                    const seriesId = selectedTestSeries || searchParams.get('series') || ''
                                    const qp = new URLSearchParams()
                                    if (moduleId) qp.set('module', moduleId)
                                    if (seriesId) qp.set('series', seriesId)
                                    const base = '/admin-dashboard/questions'
                                    const listUrl = qp.toString() ? `${base}?${qp.toString()}` : base
                                    const detailParams = new URLSearchParams(qp)
                                    detailParams.set('returnUrl', listUrl)
                                    const qs = `?${detailParams.toString()}`
                                    router.push(`/admin-dashboard/questions/${question.id}${qs}`)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(question)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CardTitle className="text-sm line-clamp-2">
                              {question.content}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div>Points: {question.points}</div>
                              {question.media_url && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Média attaché
                                </div>
                              )}
                              <div>
                                Créé: {new Date(question.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="table">
                    {/* Légende */}
                    <div className="mb-3 text-xs text-gray-600 space-y-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-medium">Légende:</span>
                        <span className="inline-flex items-center gap-1"><span className="px-2 py-0.5 border rounded text-[11px]">Qn</span> Numéro de question</span>
                        <span className="inline-flex items-center gap-1"><span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[11px]">Image</span> Type de média (Image/Audio/Vidéo)</span>
                        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3 text-green-600" /> Média présent</span>
                        <span className="inline-flex items-center gap-1"><EyeOff className="h-3 w-3 text-gray-400" /> Aucun média</span>
                      </div>
                      <div>Affichage: {pageSize} éléments max par page.</div>
                    </div>
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N°</TableHead>
                          <TableHead>Question</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Média</TableHead>
                          <TableHead>Créé</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuestions.map((question) => (
                          <TableRow key={question.id}>
                            <TableCell>
                              <Badge variant="outline">Q{question.question_number}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate">{question.content}</div>
                            </TableCell>
                            <TableCell>
                              {(question.media_url || question.media_type) && (
                                <Badge className={getTypeColor(question.media_url ?? null, question.media_type ?? null)}>
                                  {getTypeLabel(question.media_url ?? null, question.media_type ?? null)}
                                  {question.has_additional_media && <span className="ml-1">+</span>}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{question.points}</TableCell>
                            <TableCell>
                              {question.media_url ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(question.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const moduleId = selectedModule || searchParams.get('module') || ''
                                    const seriesId = selectedTestSeries || searchParams.get('series') || ''
                                    const qp = new URLSearchParams()
                                    if (moduleId) qp.set('module', moduleId)
                                    if (seriesId) qp.set('series', seriesId)
                                    const base = '/admin-dashboard/questions'
                                    const listUrl = qp.toString() ? `${base}?${qp.toString()}` : base
                                    const detailParams = new URLSearchParams(qp)
                                    detailParams.set('returnUrl', listUrl)
                                    const qs = `?${detailParams.toString()}`
                                    router.push(`/admin-dashboard/questions/${question.id}${qs}`)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(question)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} / {totalPages} • {filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </Button>
                        {/* Pages (max 7 boutons si peu de pages) */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .slice(
                            Math.max(0, currentPage - 4),
                            Math.max(0, currentPage - 4) + 7
                          )
                          .map((page) => (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {filteredQuestions.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune question trouvée</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm || filterType !== 'all' 
                      ? 'Essayez de modifier vos critères de recherche' 
                      : 'Commencez par ajouter une nouvelle question'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Popup de patience pendant la sauvegarde */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Enregistrement en cours...
              </h3>
              <p className="text-gray-600 text-sm">
                Veuillez patienter pendant l'enregistrement de la question et de ses médias.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 