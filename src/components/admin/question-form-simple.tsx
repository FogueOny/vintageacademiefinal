import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, CheckCircle2, Image, ArrowLeft, ArrowRight } from "lucide-react";
import { QuestionMediaManager } from "./question-media-manager";

interface QuestionFormSimpleProps {
  formData: {
    content: string;
    points: number;
    question_number: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    content: string;
    points: number;
    question_number: number;
  }>>;
  options: Array<{
    content: string;
    is_correct: boolean;
    label: string;
  }>;
  setOptions: React.Dispatch<React.SetStateAction<Array<{
    content: string;
    is_correct: boolean;
    label: string;
  }>>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<boolean>;
  handleSubmitOptions?: (e: React.FormEvent<HTMLFormElement>) => Promise<boolean>;
  onCancel: () => void;
  editingQuestion: boolean;
  currentQuestionId?: string | null;
  uploading: boolean;
}

export function QuestionFormSimple({
  formData,
  setFormData,
  options,
  setOptions,
  handleSubmit,
  handleSubmitOptions,
  onCancel,
  editingQuestion,
  currentQuestionId,
  uploading,
}: QuestionFormSimpleProps) {
  
  // État local pour gérer les médias et éviter les appels multiples
  const [hasMedia, setHasMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"question" | "options">("question");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' || name === 'question_number' ? parseInt(value) || 0 : value
    }));
  };

  const handleOptionChange = (index: number, field: 'content' | 'is_correct', value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // Si on coche une option comme correcte, décocher les autres
    if (field === 'is_correct' && value === true) {
      newOptions.forEach((option, i) => {
        if (i !== index) {
          option.is_correct = false;
        }
      });
    }
    
    setOptions(newOptions);
  };

  const handleStepSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const success = await handleSubmit(e);
      if (success) {
        setCurrentStep("options");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setCurrentStep("options");
  };

  const handlePreviousStep = () => {
    setCurrentStep("question");
  };

  // Rendu conditionnel selon l'étape
  if (currentStep === "question") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Étape 1/2 : Contenu de la question</h3>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        
        <form onSubmit={handleStepSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Contenu de la question *</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Entrez le contenu de la question..."
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                name="points"
                type="number"
                value={formData.points}
                onChange={handleInputChange}
                min="1"
                max="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question_number">Numéro de question *</Label>
              <Input
                id="question_number"
                name="question_number"
                type="number"
                value={formData.question_number}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={uploading || isSubmitting}>
              {uploading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Suivant : Options
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (currentStep === "options") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Étape 2/2 : Options de réponse</h3>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          </div>
        </div>
        
        <form onSubmit={handleStepSubmit} className="space-y-4">
          <QuestionOptions options={options} setOptions={setOptions} />
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button type="submit" disabled={uploading || isSubmitting}>
              {uploading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Finalisation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Créer la question
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}

interface QuestionOptionsProps {
  options: Array<{
    content: string;
    is_correct: boolean;
    label: string;
  }>;
  setOptions: React.Dispatch<React.SetStateAction<Array<{
    content: string;
    is_correct: boolean;
    label: string;
  }>>>;
}

function QuestionOptions({ options, setOptions }: QuestionOptionsProps) {
  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Options de réponse</h3>
        <span className="text-sm text-gray-500">Sélectionnez la réponse correcte</span>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
            {/* Ligne 1: Label + Input plein largeur */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700 w-6 text-center">{option.label}</span>
              <Input
                aria-label={`Contenu de l'option ${option.label}`}
                value={option.content}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = { ...newOptions[index], content: e.target.value };
                  setOptions(newOptions);
                }}
                className="flex-1 h-11 text-base bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-white dark:text-gray-900"
                placeholder={`Contenu de l'option ${option.label}`}
                inputMode="text"
                autoCapitalize="sentences"
                autoCorrect="on"
              />
            </div>

            {/* Ligne 2: Checkbox Correct + Supprimer (empilé sur mobile) */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={!!option.is_correct}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const newOptions = options.map((opt, i) => ({ ...opt, is_correct: i === index ? checked : false }));
                    setOptions(newOptions);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Correct</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const newOptions = [...options];
                  newOptions[index] = { ...newOptions[index], content: '', is_correct: false };
                  setOptions(newOptions);
                }}
                className="text-sm font-medium text-red-600 hover:text-red-700 self-start sm:self-auto"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 