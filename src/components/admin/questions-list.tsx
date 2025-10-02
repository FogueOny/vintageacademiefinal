import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pen, Trash2, Image, Music, Video } from "lucide-react";

interface Question {
  id: string;
  content: string;
  points: number;
  question_number: number;
  has_media?: boolean;
  media_types?: string[];
}

interface QuestionOption {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  label: string;
}

interface QuestionsListProps {
  questions: Question[];
  options: Record<string, QuestionOption[]>;
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  isDeleteDialogOpen: boolean;
  questionToDelete: string | null;
  setQuestionToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function QuestionsList({
  questions,
  options,
  onEditQuestion,
  onDeleteQuestion,
  isDeleteDialogOpen,
  questionToDelete,
  setQuestionToDelete,
  setIsDeleteDialogOpen
}: QuestionsListProps) {
  // Fonction pour rendre les icônes de média selon les types
  const renderMediaIcons = (question: Question) => {
    if (!question.has_media || !question.media_types || question.media_types.length === 0) {
      return null;
    }
    
    return (
      <div className="flex space-x-1">
        {question.media_types.includes('image') && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Image className="h-3 w-3" />
            <span className="text-xs">Image</span>
          </Badge>
        )}
        {question.media_types.includes('audio') && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
            <Music className="h-3 w-3" />
            <span className="text-xs">Audio</span>
          </Badge>
        )}
        {question.media_types.includes('video') && (
          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 flex items-center gap-1">
            <Video className="h-3 w-3" />
            <span className="text-xs">Vidéo</span>
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">No.</TableHead>
            <TableHead className="min-w-[300px]">Contenu</TableHead>
            <TableHead className="w-[100px]">Points</TableHead>
            <TableHead className="w-[120px]">Médias</TableHead>
            <TableHead className="w-[150px]">Options</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell className="font-medium">{question.question_number}</TableCell>
              <TableCell className="whitespace-normal break-words">
                {question.content.length > 100 
                  ? `${question.content.substring(0, 100)}...` 
                  : question.content}
              </TableCell>
              <TableCell>{question.points}</TableCell>
              <TableCell>{renderMediaIcons(question)}</TableCell>
              <TableCell>
                {options[question.id] && options[question.id].length > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    {options[question.id].length} options
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditQuestion(question.id)}
                  className="h-8 w-8"
                >
                  <Pen className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setQuestionToDelete(question.id);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
