import { findAssessmentById } from "@/lib/catalog";
import { getSubjectLabel } from "@/lib/brand";
import { getOllamaConfig, ollamaChat, parseJsonContent } from "@/lib/ollama-client";
import type { CatalogAssessmentRef } from "@/types/catalog";
import type { QuestionPerformance } from "@/types/report";
import { PERFORMANCE_OPTIONS } from "@/types/report";
import type { VisionAnalysisResult, VisionConfidence } from "@/types/vision";

const VALID_CONFIDENCE: VisionConfidence[] = ["high", "medium", "low"];

function buildVisionPrompt(assessmentRef: CatalogAssessmentRef): string {
  const { book, assessment } = assessmentRef;

  const catalogContext = {
    book: {
      id: book.id,
      name: book.name,
      subject: book.subject,
    },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      chapter: assessment.chapter,
      detection: assessment.detection ?? null,
      markingStyle: assessment.markingStyle ?? null,
      objectivesSection: assessment.objectivesSection ?? null,
      questions: assessment.questions.map((question, index) => ({
        questionIndex: index,
        label: question.label ?? `Q${index + 1}`,
        skillArea: question.skillArea,
        objective: question.objective ?? null,
        maxMarks: question.maxMarks ?? 1,
        questionSummary: question.questionSummary ?? null,
        detectionHints: question.detectionHints ?? null,
      })),
    },
  };

  const performanceList = PERFORMANCE_OPTIONS.join(" | ");

  return `You are analysing a photo of a marked student test paper for "The Learning Hub" tuition centre.

The tutor has selected this test from the catalog. Use the catalog JSON below to know exactly what to look for on the paper — question numbers, skills, marking style, and layout.

CATALOG JSON:
${JSON.stringify(catalogContext, null, 2)}

TASK:
1. Confirm the photo appears to match "${assessment.title}" (${book.name}, ${getSubjectLabel(book.subject)}).
2. For EACH question in the catalog (Q1 through Q${assessment.questions.length}), examine the photo for tutor marks.
3. Look for ticks, crosses, scores, circles, or written corrections near each question or sub-part.
4. Use the markingStyle indicators from the catalog when interpreting marks.
5. Use detectionHints per question to locate marks.

PERFORMANCE VALUES (use exactly one per question):
${performanceList}

RULES:
- "Correct" = full marks clearly awarded (e.g. tick, full score written).
- "Incorrect" = clearly wrong or cross, no meaningful credit.
- "Partially correct" = some credit shown (half marks, tick on one part only, "1/2" etc.).
- "Not attempted" = blank with no mark visible.
- If a question is unclear, use your best judgement and set confidence to "low".
- questionIndex is zero-based (Q1 = 0, Q2 = 1, etc.).

Respond with ONLY valid JSON (no markdown):
{
  "testMatch": true,
  "overallNotes": "Brief note on photo quality or anything the tutor should check",
  "questions": [
    {
      "questionIndex": 0,
      "label": "Q1",
      "performance": "Correct",
      "confidence": "high",
      "observation": "What you saw near this question"
    }
  ]
}

Include exactly ${assessment.questions.length} entries in "questions", one per catalog question, in order.`;
}

function normalizePerformance(value: string): QuestionPerformance | null {
  const normalized = value.trim().toLowerCase();
  const match = PERFORMANCE_OPTIONS.find(
    (option) => option.toLowerCase() === normalized
  );
  return match ?? null;
}

function validateVisionResult(
  parsed: VisionAnalysisResult,
  expectedCount: number
): VisionAnalysisResult {
  if (!Array.isArray(parsed.questions)) {
    throw new Error("Vision response missing questions array");
  }

  if (parsed.questions.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} question results, got ${parsed.questions.length}`
    );
  }

  const validatedQuestions = parsed.questions.map((item, index) => {
    const performance = normalizePerformance(item.performance);
    if (!performance) {
      throw new Error(`Invalid performance for question ${index + 1}: ${item.performance}`);
    }

    const confidence = VALID_CONFIDENCE.includes(item.confidence)
      ? item.confidence
      : "low";

    return {
      questionIndex: item.questionIndex ?? index,
      label: item.label ?? `Q${index + 1}`,
      performance,
      confidence,
      observation: item.observation,
    };
  });

  return {
    testMatch: Boolean(parsed.testMatch),
    overallNotes: parsed.overallNotes,
    questions: validatedQuestions,
  };
}

export async function analyzeMarkedPaper(
  assessmentId: string,
  imageBase64: string
): Promise<VisionAnalysisResult> {
  const assessmentRef = findAssessmentById(assessmentId);
  if (!assessmentRef) {
    throw new Error("Assessment not found in catalog");
  }

  const { visionModel } = getOllamaConfig();
  const prompt = buildVisionPrompt(assessmentRef);
  const questionCount = assessmentRef.assessment.questions.length;

  const content = await ollamaChat({
    model: visionModel,
    prompt,
    images: [imageBase64],
    json: true,
  });

  const parsed = parseJsonContent<VisionAnalysisResult>(content);
  return validateVisionResult(parsed, questionCount);
}
