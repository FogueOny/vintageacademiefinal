'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Coins } from 'lucide-react';

interface RequestAIEvaluationButtonProps {
  responseId: string;
  userCredits: number;
  onEvaluated: () => void;
}

export function RequestAIEvaluationButton({
  responseId,
  userCredits,
  onEvaluated,
}: RequestAIEvaluationButtonProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (userCredits < 1) {
      setError('Vous n\'avez pas assez de crédits. Rechargez votre compte.');
      return;
    }

    setEvaluating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/evaluate-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response_id: responseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur évaluation IA');
      }

      // Succès - recharger la page pour voir les résultats
      onEvaluated();

    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleEvaluate}
        disabled={evaluating || userCredits < 1}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
      >
        {evaluating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Évaluation IA en cours...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Demander une évaluation IA
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs flex items-center gap-1">
              <Coins className="h-3 w-3" />
              1 crédit
            </span>
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          ❌ {error}
        </div>
      )}

      {evaluating && (
        <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
          ⏳ L'IA analyse votre texte selon les critères TCF... (peut prendre 10-30 secondes)
        </div>
      )}

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-4 w-4 text-orange-500" />
          <span className="font-medium">Crédits disponibles: {userCredits}</span>
        </div>
        <p className="text-gray-500">
          L'évaluation IA coûte 1 crédit et vous donne un feedback détaillé avec score, 
          points forts, points à améliorer et conseils personnalisés.
        </p>
      </div>
    </div>
  );
}
