"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle } from "lucide-react";

// Interface pour les médias
export interface QuestionMedia {
  id: string;
  question_id: string;
  media_url: string;
  media_type: 'image' | 'audio' | 'video' | 'document';
  display_order: number;
  title?: string;
  description?: string;
}

interface MediaRendererProps {
  media: QuestionMedia[];
}

export function MediaRenderer({ media }: MediaRendererProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!media || media.length === 0) return null;

  const handleToggleAudio = (mediaId: string) => {
    // Récupérer l'élément audio
    const audioElement = document.querySelector(`#audio-${mediaId}`) as HTMLAudioElement;
    
    if (!audioElement) return;
    
    // Pauser l'audio en cours s'il existe et n'est pas celui qu'on veut jouer
    if (audioRef.current && audioRef.current !== audioElement) {
      audioRef.current.pause();
    }
    
    // Mettre à jour la référence audio
    audioRef.current = audioElement;
    
    // Jouer/pauser l'audio
    if (isAudioPlaying && audioRef.current === audioElement) {
      audioElement.pause();
      setIsAudioPlaying(false);
    } else {
      audioElement.play();
      setIsAudioPlaying(true);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <h3 className="text-lg font-semibold">Médias associés ({media.length})</h3>
      
      {media.map((item, index) => (
        <div key={item.id} className="border rounded-lg p-4">
          {/* Rendu d'une image */}
          {item.media_type === 'image' && (
            <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg">
              {item.media_url.startsWith('http') ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={item.media_url}
                    alt={`Media ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <Image
                  src={item.media_url}
                  alt={`Media ${index + 1}`}
                  fill
                  className="object-contain"
                />
              )}
            </div>
          )}

          {/* Rendu d'un fichier audio */}
          {item.media_type === 'audio' && (
            <div className="flex flex-col items-center space-y-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto"
                onClick={() => handleToggleAudio(item.id)}
              >
                {isAudioPlaying && audioRef.current?.id === `audio-${item.id}` ? (
                  <>
                    <PauseCircle className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Écouter l'extrait sonore {index + 1}
                  </>
                )}
              </Button>
              <audio
                id={`audio-${item.id}`}
                src={item.media_url}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={() => setIsAudioPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          {/* Rendu d'une vidéo */}
          {item.media_type === 'video' && (
            <div className="aspect-video overflow-hidden rounded-lg">
              <video
                controls
                className="w-full h-full"
                src={item.media_url}
              />
            </div>
          )}

          {/* Rendu d'un document */}
          {item.media_type === 'document' && (
            <div className="border rounded-lg p-4 flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <a 
                href={item.media_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Télécharger le document
              </a>
            </div>
          )}
          
          {/* Titre du média s'il existe */}
          {item.title && (
            <p className="mt-2 text-sm font-medium text-gray-600">{item.title}</p>
          )}
        </div>
      ))}
    </div>
  );
}
