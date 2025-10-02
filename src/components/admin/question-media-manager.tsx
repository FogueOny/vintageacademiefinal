"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, Trash2, MoveUp, MoveDown, Image, FileVideo, FileAudio, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { QuestionMedia, addQuestionMedia, getQuestionMedia, deleteQuestionMedia, updateMediaOrder } from "@/lib/supabase/question-media-utils";
import { ACCEPTED_FILE_TYPES } from "@/lib/supabase/storage-utils";
import { cn } from "@/lib/utils";

interface QuestionMediaManagerProps {
  questionId?: string;
  onMediaUpdate?: (hasMedia: boolean) => void;
  readOnly?: boolean;
}

export function QuestionMediaManager({ questionId, onMediaUpdate, readOnly = false }: QuestionMediaManagerProps) {
  const [mediaItems, setMediaItems] = useState<QuestionMedia[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'audio' | 'video'>('image');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Limiter le nombre de médias à maximum 2
  const canAddMoreMedia = mediaItems.length < 2;
  
  // Charger les médias existants
  useEffect(() => {
    if (questionId) {
      loadQuestionMedia();
    } else {
      setMediaItems([]);
    }
  }, [questionId]);

  async function loadQuestionMedia() {
    if (!questionId) return;
    
    try {
      // Ne pas tenter de récupérer les médias si l'ID est temporaire
      if (questionId.startsWith('temp-')) {
        setMediaItems([]);
        if (onMediaUpdate) {
          onMediaUpdate(false);
        }
        return;
      }
      
      const media = await getQuestionMedia(questionId);
      setMediaItems(media);
      if (onMediaUpdate) {
        onMediaUpdate(media.length > 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des médias:", error);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Déterminer automatiquement le type de média
      if (file.type.startsWith('image/')) {
        setSelectedMediaType('image');
      } else if (file.type.startsWith('audio/')) {
        setSelectedMediaType('audio');
      } else if (file.type.startsWith('video/')) {
        setSelectedMediaType('video');
      }
    }
  }

  function handleSelectFileClick() {
    fileInputRef.current?.click();
  }

  // Ajouter un nouveau média
  async function handleAddMedia() {
    if (!questionId || !selectedFile) return;
    
    // Vérifier si on peut ajouter plus de médias
    if (mediaItems.length >= 2) {
      alert("Vous ne pouvez pas ajouter plus de 2 médias par question.");
      return;
    }
    
    // Autoriser l'upload même avec un ID temporaire (pour le formulaire intégré)
    
    try {
      setUploading(true);
      // Déterminer le nouvel ordre d'affichage
      const displayOrder = mediaItems.length > 0 
        ? Math.max(...mediaItems.map(item => item.display_order)) + 1 
        : 0;

      // Ajouter le média à la question
      await addQuestionMedia(questionId, selectedFile, description, displayOrder);
      
      // Recharger les médias
      await loadQuestionMedia();
      
      // Réinitialiser le formulaire
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du média:", error);
      alert(`Erreur lors de l'ajout du média: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  }

  function requestDeleteMedia(mediaId: string, mediaUrl: string) {
    setDeleteTarget({ id: mediaId, url: mediaUrl });
  }

  async function confirmDeleteMedia() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteQuestionMedia(deleteTarget.id, deleteTarget.url);
      await loadQuestionMedia();
      setDeleteTarget(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setDeleting(false);
    }
  }

  async function handleMoveMedia(index: number, direction: 'up' | 'down') {
    if (index < 0 || index >= mediaItems.length) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= mediaItems.length) return;
    
    const newItems = [...mediaItems];
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;
    
    // Mettre à jour les ordres d'affichage
    newItems.forEach((item, i) => {
      item.display_order = i;
    });
    
    setMediaItems(newItems);
    try {
      await updateMediaOrder(newItems);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'ordre:", error);
      await loadQuestionMedia(); // Recharger en cas d'erreur
    }
  }

  // Rendu des prévisualisations de médias
  function renderMediaPreview(item: QuestionMedia) {
    switch (item.media_type) {
      case 'image':
        return (
          <img 
            src={item.media_url} 
            alt={item.description || "Image"} 
            className="w-full h-32 object-cover rounded-md"
            onError={(e) => e.currentTarget.src = "/placeholder-image.png"}
          />
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <FileAudio className="h-10 w-10 text-primary mb-2" />
            <audio 
              src={item.media_url} 
              controls 
              className="w-full max-w-[200px]" 
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
        );
      case 'video':
        return (
          <div className="relative w-full h-32">
            <video 
              src={item.media_url} 
              controls 
              className="w-full h-full object-cover rounded-md" 
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
        );
      default:
        return null;
    }
  }

  // Afficher l'icône du type de média
  function renderMediaTypeIcon(type: string) {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'audio':
        return <FileAudio className="h-4 w-4" />;
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Médias de la question</h3>
        
        {/* Liste des médias existants */}
        {mediaItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {mediaItems.map((item, index) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {renderMediaTypeIcon(item.media_type)}
                      <span className="text-sm font-medium capitalize">{item.media_type}</span>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveMedia(index, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveMedia(index, 'down')}
                          disabled={index === mediaItems.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => item.id && requestDeleteMedia(item.id, item.media_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="my-2">
                    {renderMediaPreview(item)}
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucun média n'a été ajouté à cette question
          </div>
        )}
        
        {/* Formulaire d'ajout de média */}
        {!readOnly && questionId && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium">Ajouter un nouveau média</h4>
              <div className="text-xs text-muted-foreground">
                {mediaItems.length}/2 médias ajoutés
              </div>
            </div>
            
            {canAddMoreMedia ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="media-type">Type de média</Label>
                    <Select
                      value={selectedMediaType}
                      onValueChange={(value) => setSelectedMediaType(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="video">Vidéo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                
                <div className="space-y-2">
                  <Label htmlFor="media-file">Fichier</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="media-file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept={ACCEPTED_FILE_TYPES[selectedMediaType]?.join(',')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSelectFileClick}
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      <FileUp className="h-4 w-4" />
                      {uploading ? 'Téléchargement...' : 'Sélectionner un fichier'}
                    </Button>
                    {selectedFile && (
                      <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="media-description">Description (optionnelle)</Label>
                <Textarea
                  id="media-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du média..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleAddMedia}
                  disabled={!selectedFile || uploading}
                  className={cn(
                    "min-w-[140px]",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {uploading ? 'Téléchargement...' : 'Ajouter ce média'}
                </Button>
              </div>
            </div>
            ) : (
              <p className="text-amber-600 py-2 text-sm">
                Vous avez atteint la limite de 2 médias par question.
                Supprimez un média existant pour en ajouter un nouveau.
              </p>
            )}
          </div>
        )}
      </div>
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="backdrop-blur-md bg-background/80">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce média ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Le média sera supprimé de la base de données et du stockage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMedia} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
