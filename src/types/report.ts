export type Subject = "maths" | "english" | "science";

export type QuestionPerformance =
  | "Correct"
  | "Incorrect"
  | "Partially correct"
  | "Not attempted";

export interface QuestionMarkInput {
  questionIndex: number;
  awardedMarks: number;
}

export interface ReportInput {
  studentName: string;
  assessmentId: string;
  questionMarks: QuestionMarkInput[];
  tutorNotes?: string;
}

export interface QuestionReportRow {
  label: string;
  skillArea: string;
  performance: QuestionPerformance;
  comment: string;
}

export interface GeneratedReport {
  summaryText: string;
  whatWentWell: [string, string, string];
  areasForImprovement: [string, string, string];
  nextSteps: [string, string];
  questions: QuestionReportRow[];
  finalTeacherComment: string;
}

export interface ReportData {
  studentName: string;
  bookName: string;
  chapter: string;
  assessmentTitle: string;
  subject: Subject;
  recordedScore: number;
  maxScore: number;
  percentage: number;
  report: GeneratedReport;
  generatedAt: string;
}

export const PERFORMANCE_OPTIONS: QuestionPerformance[] = [
  "Correct",
  "Incorrect",
  "Partially correct",
  "Not attempted",
];

/** Dropdown values from 0 to maxMarks in 0.5 steps */
export function markOptions(maxMarks = 1): number[] {
  const steps = Math.round(maxMarks * 2);
  return Array.from({ length: steps + 1 }, (_, i) => i / 2);
}

export function clampMarks(awarded: number, maxMarks: number): number {
  return Math.min(Math.max(awarded, 0), maxMarks);
}

export function marksToPerformance(
  awarded: number,
  maxMarks: number
): QuestionPerformance {
  const clamped = clampMarks(awarded, maxMarks);
  if (clamped >= maxMarks) return "Correct";
  if (clamped <= 0) return "Incorrect";
  return "Partially correct";
}

export function formatMarkOption(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function calculateScore(
  questionMarks: QuestionMarkInput[],
  maxMarksPerQuestion: number[]
): { recordedScore: number; maxScore: number; percentage: number } {
  let recordedScore = 0;
  let maxScore = 0;

  questionMarks.forEach((mark, index) => {
    const maxMarks = maxMarksPerQuestion[index] ?? 1;
    maxScore += maxMarks;
    recordedScore += clampMarks(mark.awardedMarks, maxMarks);
  });

  const percentage =
    maxScore > 0 ? Math.round((recordedScore / maxScore) * 1000) / 10 : 0;

  return { recordedScore, maxScore, percentage };
}
