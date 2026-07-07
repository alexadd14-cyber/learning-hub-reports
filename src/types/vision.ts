export type VisionConfidence = "high" | "medium" | "low";

export interface VisionQuestionResult {
  questionIndex: number;
  label: string;
  awardedMarks: number;
  confidence: VisionConfidence;
  observation?: string;
}

export interface VisionAnalysisResult {
  testMatch: boolean;
  assessmentId?: string;
  overallNotes?: string;
  questions: VisionQuestionResult[];
}
