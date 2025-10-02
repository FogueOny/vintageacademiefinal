"use client";

interface QuestionNavigatorProps {
  questions: {
    id: string;
    question_number: number;
  }[];
  currentQuestionIndex: number;
  userAnswers: Array<{
    questionId: string;
    selectedOptionId: string | null;
  }>;
  onQuestionSelect: (index: number) => void;
}

export function QuestionNavigator({ 
  questions, 
  currentQuestionIndex, 
  userAnswers, 
  onQuestionSelect 
}: QuestionNavigatorProps) {
  return (
    <div className="flex flex-wrap gap-2 border p-4 rounded-md">
      {questions.map((q, index) => (
        <button
          key={q.id}
          onClick={() => onQuestionSelect(index)}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
            ${
              index === currentQuestionIndex
                ? 'bg-orange-500 text-white'
                : userAnswers[index].selectedOptionId
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100'
            }
          `}
        >
          {q.question_number}
        </button>
      ))}
    </div>
  );
}
