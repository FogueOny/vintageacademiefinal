"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Interface pour les options de questions
export interface Option {
  id: string;
  content: string;
  label: string;
  is_correct: boolean;
}

interface QuestionOptionsProps {
  options: Option[];
  selectedOptionId: string | null;
  onOptionSelect: (optionId: string) => void;
}

export function QuestionOptions({ options, selectedOptionId, onOptionSelect }: QuestionOptionsProps) {
  return (
    <div className="mt-6">
      <RadioGroup 
        value={selectedOptionId || ''} 
        onValueChange={onOptionSelect}
        className="space-y-4"
      >
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-center p-4 border rounded-lg transition-colors hover:bg-orange-50"
          >
            <RadioGroupItem
              value={option.id}
              id={option.id}
              className="mr-3"
            />
            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
              <span className="font-medium mr-2">{option.label}.</span>
              {option.content}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
