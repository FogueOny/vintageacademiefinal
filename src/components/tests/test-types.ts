// Types partagés pour les composants de test

import { QuestionMedia } from "./media-renderer";
import { Option } from "./question-options";

export interface Question {
  id: string;
  content: string;
  test_series_id: string;
  question_number: number;
  points: number;
  options: Option[];
  // Propriétés pour la gestion des médias
  media_url?: string | null;
  media_type?: 'image' | 'audio' | 'video' | 'document' | null;
  all_media?: QuestionMedia[];
  // Nouveaux champs pour les tests écrits
  speaker_name?: string | null;
  question_text?: string | null;
  context_text?: string | null;
  // Propriété pour identifier les questions incomplètes
  isIncomplete?: boolean;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string | null;
}

export interface TestSeriesInfo {
  id: string;
  name: string;
  description?: string;
  module_id: string;
  time_limit: number;
  slug: string;
}
