import type { QuestionPerformance } from "@/types/report";

export type VisionConfidence = "high" | "medium" | "low";

export interface VisionQuestionResult {
  questionIndex: number;
  label: string;
  performance: QuestionPerformance;
  confidence: VisionConfidence;
  observation?: string;
}

export interface VisionAnalysisResult {
  testMatch: boolean;
  overallNotes?: string;
  questions: VisionQuestionResult[];
}
