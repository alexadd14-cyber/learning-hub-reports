export type Subject = "maths" | "english" | "science";

export type QuestionPerformance =
  | "Correct"
  | "Incorrect"
  | "Partially correct"
  | "Not attempted";

export interface QuestionMarkInput {
  questionIndex: number;
  performance: QuestionPerformance;
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

export function performanceToMark(
  performance: QuestionPerformance,
  maxMarks = 1
): number {
  switch (performance) {
    case "Correct":
      return maxMarks;
    case "Partially correct":
      return maxMarks * 0.5;
    case "Incorrect":
    case "Not attempted":
      return 0;
  }
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
    recordedScore += performanceToMark(mark.performance, maxMarks);
  });

  const percentage =
    maxScore > 0 ? Math.round((recordedScore / maxScore) * 1000) / 10 : 0;

  return { recordedScore, maxScore, percentage };
}
