'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIEvaluationButtonProps {
  responseId: string;
  submissionId: string;
  type: 'expression_ecrite' | 'expression_orale';
  onEvaluated: () => void;
}

export function AIEvaluationButton({
  responseId,
  submissionId,
  type,
  onEvaluated,
}: AIEvaluationButtonProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEvaluate = async () => {
    setEvaluating(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = type === 'expression_ecrite' 
        ? '/api/ai/evaluate-ee' 
        : '/api/ai/evaluate-eo';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_id: responseId,
          submission_id: submissionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur évaluation IA');
      }

      setSuccess(true);
      setTimeout(() => {
        onEvaluated();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleEvaluate}
        disabled={evaluating || success}
        variant="outline"
        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
      >
        {evaluating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Évaluation IA en cours...
          </>
        ) : success ? (
          <>
            ✅ Évaluation terminée!
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Évaluer avec l'IA (Assistant TCF)
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
          ✅ Évaluation IA terminée avec succès!
        </div>
      )}

      {evaluating && type === 'expression_orale' && (
        <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
          ⏳ Transcription audio + évaluation en cours (peut prendre 30-60s)
        </div>
      )}
    </div>
  );
}
