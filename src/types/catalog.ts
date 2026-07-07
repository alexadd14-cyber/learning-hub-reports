import type { Subject } from "@/types/report";

export interface CatalogQuestion {
  skillArea: string;
  maxMarks?: number;
  number?: number;
  label?: string;
  objective?: string;
  objectiveNumber?: string;
  topic?: string;
  questionSummary?: string;
  detectionHints?: string;
}

export interface CatalogDetection {
  titlePhrases: string[];
  headerText: string;
  questionCount: number;
  objectivesSectionLabel?: string;
  layoutNotes?: string;
}

export interface CatalogMarkingStyle {
  correctIndicators: string[];
  incorrectIndicators: string[];
  partialIndicators?: string[];
  notes?: string;
}

export interface CatalogObjective {
  objectiveNumber: string;
  objectiveText: string;
}

export interface CatalogObjectivesSection {
  rawText: string;
  items: CatalogObjective[];
}

export interface CatalogAssessment {
  id: string;
  chapter: string;
  title: string;
  questions: CatalogQuestion[];
  warnings?: string[];
  detection?: CatalogDetection;
  markingStyle?: CatalogMarkingStyle;
  objectivesSection?: CatalogObjectivesSection;
}

export interface CatalogBook {
  id: string;
  name: string;
  subject: Subject;
  assessments: CatalogAssessment[];
}

export interface Catalog {
  version: number;
  books: CatalogBook[];
}

export interface CatalogAssessmentRef {
  book: CatalogBook;
  assessment: CatalogAssessment;
}

export function getAssessmentMaxScore(assessment: CatalogAssessment): number {
  return assessment.questions.reduce(
    (total, question) => total + (question.maxMarks ?? 1),
    0
  );
}
