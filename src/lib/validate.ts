import { findAssessmentById } from "@/lib/catalog";
import { getAssessmentMaxScore } from "@/types/catalog";
import type { ReportInput, QuestionMarkInput, QuestionPerformance } from "@/types/report";
import {
  PERFORMANCE_OPTIONS,
  calculateScore,
} from "@/types/report";

export interface ValidatedInput {
  input: ReportInput;
  errors: string[];
}

function parseQuestionMarks(
  formData: FormData,
  questionCount: number
): QuestionMarkInput[] {
  const marks: QuestionMarkInput[] = [];

  for (let index = 0; index < questionCount; index++) {
    const performance = formData.get(`question_${index}`) as string;
    if (!performance || !PERFORMANCE_OPTIONS.includes(performance as QuestionPerformance)) {
      return [];
    }
    marks.push({ questionIndex: index, performance: performance as QuestionPerformance });
  }

  return marks;
}

export function validateReportInput(formData: FormData): ValidatedInput {
  const errors: string[] = [];

  const studentName = (formData.get("studentName") as string)?.trim();
  const assessmentId = (formData.get("assessmentId") as string)?.trim();
  const tutorNotes = (formData.get("tutorNotes") as string)?.trim();

  if (!studentName) errors.push("Student name is required");
  if (!assessmentId) errors.push("Please select an assessment from the catalog");

  const assessmentRef = assessmentId ? findAssessmentById(assessmentId) : null;
  if (assessmentId && !assessmentRef) {
    errors.push("Selected assessment was not found in the catalog");
  }

  if (errors.length > 0 || !assessmentRef) {
    return { input: {} as ReportInput, errors };
  }

  const questionMarks = parseQuestionMarks(
    formData,
    assessmentRef.assessment.questions.length
  );

  if (questionMarks.length !== assessmentRef.assessment.questions.length) {
    errors.push("Please mark every question before generating the report");
  }

  if (errors.length > 0) {
    return { input: {} as ReportInput, errors };
  }

  return {
    errors: [],
    input: {
      studentName,
      assessmentId,
      questionMarks,
      tutorNotes: tutorNotes || undefined,
    },
  };
}

export function buildReportContext(input: ReportInput) {
  const assessmentRef = findAssessmentById(input.assessmentId);
  if (!assessmentRef) {
    throw new Error("Assessment not found");
  }

  const maxMarksPerQuestion = assessmentRef.assessment.questions.map(
    (question) => question.maxMarks ?? 1
  );
  const { recordedScore, maxScore, percentage } = calculateScore(
    input.questionMarks,
    maxMarksPerQuestion
  );

  return {
    assessmentRef,
    recordedScore,
    maxScore: maxScore || getAssessmentMaxScore(assessmentRef.assessment),
    percentage,
  };
}
