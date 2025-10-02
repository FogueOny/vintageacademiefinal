'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ExpressionCorrectionFormProps {
  responseId: string;
  submissionId: string;
  type: 'expression_ecrite' | 'expression_orale';
  taskNumber?: number;
  partieNumber?: number;
  currentScore?: number | null;
  currentFeedback?: string | null;
  onCorrectionSaved: () => void;
}

export function ExpressionCorrectionForm({
  responseId,
  submissionId,
  type,
  taskNumber,
  partieNumber,
  currentScore,
  currentFeedback,
  onCorrectionSaved,
}: ExpressionCorrectionFormProps) {
  const [score, setScore] = useState<string>(currentScore?.toString() || '');
  const [feedback, setFeedback] = useState(currentFeedback || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 25) {
      setError('Le score doit être entre 0 et 25');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/exam-submissions/${submissionId}/expressions/${responseId}/correct`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_score: scoreNum,
            admin_feedback: feedback.trim() || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur lors de la correction');

      setSuccess(true);
      setTimeout(() => {
        onCorrectionSaved();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const taskLabel = type === 'expression_ecrite' 
    ? `Tâche ${taskNumber}` 
    : `Partie ${partieNumber}`;

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Correction - {taskLabel}
          {currentScore !== null && currentScore !== undefined && (
            <Badge variant="outline" className="ml-auto">
              Score actuel: {currentScore}/25
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`score-${responseId}`}>
              Score (0-25) <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`score-${responseId}`}
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Ex: 18.5"
              required
              className="max-w-xs"
            />
            <div className="text-xs text-gray-500">
              Barème: 0-25 points
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`feedback-${responseId}`}>
              Commentaire / Feedback
            </Label>
            <textarea
              id={`feedback-${responseId}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Commentaires sur la performance de l'étudiant..."
              className="w-full min-h-[120px] p-3 border rounded-md text-sm"
              rows={5}
            />
            <div className="text-xs text-gray-500">
              Optionnel - Sera visible par l'étudiant
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">
              ✓ Correction enregistrée avec succès
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={saving || success}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la correction'}
            </Button>
            {currentScore !== null && currentScore !== undefined && (
              <Badge variant="secondary" className="ml-auto self-center">
                Déjà corrigé
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
