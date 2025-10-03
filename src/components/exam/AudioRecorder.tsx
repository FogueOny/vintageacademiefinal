'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

interface AudioRecorderProps {
  onAudioReady: (audioUrl: string, duration: number) => void;
  maxDurationSeconds?: number;
  userId: string;
  submissionId: string;
  taskIndex: number;
}

export function AudioRecorder({ 
  onAudioReady, 
  maxDurationSeconds = 180, // 3 minutes par défaut
  userId,
  submissionId,
  taskIndex
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Arrêter le stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error('Erreur accès microphone:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setDuration(prev => {
            const next = prev + 1;
            if (next >= maxDurationSeconds) {
              stopRecording();
            }
            return next;
          });
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setUploadedUrl(null);
    audioChunksRef.current = [];
  };

  const playAudio = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      const fileName = `${userId}/${submissionId}_task${taskIndex}_${Date.now()}.webm`;

      // Upload via API route (utilise service role pour bypasser RLS)
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('fileName', fileName);

      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur upload');
      }

      const { url } = await response.json();

      if (url) {
        setUploadedUrl(url);
        onAudioReady(url, duration);
      }
    } catch (error: any) {
      console.error('Erreur upload audio:', error);
      alert('Erreur lors de l\'upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-orange-600">
            {formatTime(duration)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Max: {formatTime(maxDurationSeconds)}
          </div>
        </div>

        {!audioBlob && !isRecording && (
          <div className="flex justify-center">
            <Button
              onClick={startRecording}
              size="lg"
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <Mic className="w-5 h-5" />
              Commencer l'enregistrement
            </Button>
          </div>
        )}

        {isRecording && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={pauseRecording}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isPaused ? 'Reprendre' : 'Pause'}
            </Button>
            <Button
              onClick={stopRecording}
              size="lg"
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <Square className="w-5 h-5" />
              Arrêter
            </Button>
          </div>
        )}

        {audioBlob && audioUrl && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-gray-700">Prévisualisation</div>
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="w-full"
                controls
              />
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={deleteRecording}
                variant="outline"
                className="gap-2"
                disabled={uploading || !!uploadedUrl}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
              
              {!uploadedUrl ? (
                <Button
                  onClick={uploadAudio}
                  disabled={uploading}
                  className="bg-orange-600 hover:bg-orange-700 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Envoi...' : 'Envoyer la réponse'}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Réponse enregistrée
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          {isRecording && !isPaused && (
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Enregistrement en cours...
            </div>
          )}
          {isPaused && <div className="text-amber-600">⏸ Enregistrement en pause</div>}
          {!isRecording && !audioBlob && (
            <div>Cliquez sur le bouton pour commencer à enregistrer votre réponse orale</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
