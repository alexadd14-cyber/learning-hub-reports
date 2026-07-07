import { findAssessmentById, loadCatalog } from "@/lib/catalog";
import { getSubjectLabel } from "@/lib/brand";
import { getOpenAIConfig, openaiChat, parseJsonContent } from "@/lib/openai-client";
import type { CatalogAssessmentRef } from "@/types/catalog";
import { clampMarks } from "@/types/report";
import type { VisionAnalysisResult, VisionConfidence } from "@/types/vision";

const VALID_CONFIDENCE: VisionConfidence[] = ["high", "medium", "low"];

const MARK_READING_RULES = `HOW TO READ THE MARK FOR EACH QUESTION (follow exactly):
- Each question prints its maximum marks at the BOTTOM-RIGHT of that question (e.g. a small "[2]" or "2" in the corner). Use this printed value to locate where the tutor's mark will be.
- Find the CLOSEST handwritten mark to that bottom-right maximum-marks indicator. The handwritten mark is one of three things:
  1. A TICK (✓) → the student got FULL marks for that question (awardedMarks = that question's maxMarks).
  2. A CROSS (✗ / X) → the student got ZERO (awardedMarks = 0).
  3. A NUMBER → the student got exactly that number of marks (may be full marks or fewer, and may include halves like 0.5 or 1.5).
- IMPORTANT PRIORITY: If a question shows BOTH a tick AND a handwritten number, the NUMBER always takes authority — use the number as awardedMarks, not full marks. Only treat a tick as full marks when there is no accompanying number.
- Only consider the handwritten mark nearest the bottom-right maximum-marks indicator for that question. Ignore ticks/crosses on individual working lines or sub-parts unless there is no single overall mark for the question.
- awardedMarks must be a number from 0 up to that question's maxMarks (halves allowed, e.g. 0.5, 1.5). Never exceed maxMarks.
- If the mark near the bottom-right is ambiguous, unreadable, or missing, make your best estimate and set confidence to "low"; describe what you saw in "observation".`;

function buildCatalogSummary() {
  const catalog = loadCatalog();
  const assessments: Array<{
    assessmentId: string;
    bookId: string;
    bookName: string;
    subject: string;
    title: string;
    chapter: string;
    questionCount: number;
    detection: unknown;
  }> = [];

  for (const book of catalog.books) {
    for (const assessment of book.assessments) {
      assessments.push({
        assessmentId: assessment.id,
        bookId: book.id,
        bookName: book.name,
        subject: book.subject,
        title: assessment.title,
        chapter: assessment.chapter,
        questionCount: assessment.questions.length,
        detection: assessment.detection ?? null,
      });
    }
  }

  return assessments;
}

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

  return `You are analysing photo(s) of a marked student test paper for "The Learning Hub" tuition centre.

The tutor has selected this test from the catalog. Use the catalog JSON below to know exactly what to look for on the paper — question numbers, skills, marking style, and layout.

CATALOG JSON:
${JSON.stringify(catalogContext, null, 2)}

TASK:
1. Confirm the photo(s) appear to match "${assessment.title}" (${book.name}, ${getSubjectLabel(book.subject)}).
2. For EACH question in the catalog (Q1 through Q${assessment.questions.length}), locate the question's bottom-right maximum-marks indicator and read the closest handwritten mark.
3. Use the markingStyle indicators and per-question detectionHints from the catalog to help locate marks.
4. If marks span multiple pages, combine evidence from all images.

${MARK_READING_RULES}
- questionIndex is zero-based (Q1 = 0, Q2 = 1, etc.).

Respond with ONLY valid JSON (no markdown):
{
  "testMatch": true,
  "overallNotes": "Brief note on photo quality or anything the tutor should check",
  "questions": [
    {
      "questionIndex": 0,
      "label": "Q1",
      "awardedMarks": 2,
      "confidence": "high",
      "observation": "What you saw near this question"
    }
  ]
}

Include exactly ${assessment.questions.length} entries in "questions", one per catalog question, in order.`;
}

function buildDetectPrompt(): string {
  const assessments = buildCatalogSummary();

  return `You are analysing photo(s) of a marked student test paper for "The Learning Hub" tuition centre.

The tutor has NOT selected which test this is. Your job is to:
1. Identify which assessment from the catalog best matches the paper in the photo(s).
2. Read the numeric marks awarded for each question.

CATALOG ASSESSMENTS:
${JSON.stringify(assessments, null, 2)}

TASK:
1. Read headers, titles, chapter names, and layout on the paper(s).
2. Match against detection.titlePhrases, detection.headerText, and questionCount where available.
3. Pick the single best-matching assessmentId from the catalog.
4. For each question in that assessment, locate the question's bottom-right maximum-marks indicator and read the closest handwritten mark.

${MARK_READING_RULES}
- If you cannot confidently match any assessment, set testMatch to false and assessmentId to null.
- questionIndex is zero-based.
- Combine evidence from all uploaded pages.

Respond with ONLY valid JSON (no markdown):
{
  "testMatch": true,
  "assessmentId": "exact-assessment-id-from-catalog",
  "overallNotes": "Brief note including which test was detected and anything to verify",
  "questions": [
    {
      "questionIndex": 0,
      "label": "Q1",
      "awardedMarks": 1,
      "confidence": "high",
      "observation": "What you saw"
    }
  ]
}`;
}

function validateVisionResult(
  parsed: VisionAnalysisResult,
  assessmentRef: CatalogAssessmentRef
): VisionAnalysisResult {
  const expectedCount = assessmentRef.assessment.questions.length;

  if (!Array.isArray(parsed.questions)) {
    throw new Error("Vision response missing questions array");
  }

  if (parsed.questions.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} question results, got ${parsed.questions.length}`
    );
  }

  const validatedQuestions = parsed.questions.map((item, index) => {
    const maxMarks = assessmentRef.assessment.questions[index]?.maxMarks ?? 1;
    const awardedMarks = clampMarks(Number(item.awardedMarks), maxMarks);

    if (Number.isNaN(awardedMarks)) {
      throw new Error(`Invalid marks for question ${index + 1}`);
    }

    const confidence = VALID_CONFIDENCE.includes(item.confidence)
      ? item.confidence
      : "low";

    return {
      questionIndex: item.questionIndex ?? index,
      label: item.label ?? `Q${index + 1}`,
      awardedMarks,
      confidence,
      observation: item.observation,
    };
  });

  return {
    testMatch: Boolean(parsed.testMatch),
    assessmentId: assessmentRef.assessment.id,
    overallNotes: parsed.overallNotes,
    questions: validatedQuestions,
  };
}

export async function analyzeMarkedPaper(
  assessmentId: string,
  imagesBase64: string[]
): Promise<VisionAnalysisResult> {
  const assessmentRef = findAssessmentById(assessmentId);
  if (!assessmentRef) {
    throw new Error("Assessment not found in catalog");
  }

  const { visionModel } = getOpenAIConfig();
  const prompt = buildVisionPrompt(assessmentRef);

  const content = await openaiChat({
    model: visionModel,
    prompt,
    images: imagesBase64,
    json: true,
  });

  const parsed = parseJsonContent<VisionAnalysisResult>(content);
  return validateVisionResult(parsed, assessmentRef);
}

export async function detectAndMark(
  imagesBase64: string[]
): Promise<VisionAnalysisResult> {
  const { visionModel } = getOpenAIConfig();
  const prompt = buildDetectPrompt();

  const content = await openaiChat({
    model: visionModel,
    prompt,
    images: imagesBase64,
    json: true,
  });

  const parsed = parseJsonContent<VisionAnalysisResult>(content);

  if (!parsed.assessmentId) {
    return {
      testMatch: false,
      overallNotes:
        parsed.overallNotes ??
        "Could not identify the test from the photo. Please select subject, book, and assessment manually.",
      questions: [],
    };
  }

  const assessmentRef = findAssessmentById(parsed.assessmentId);
  if (!assessmentRef) {
    return {
      testMatch: false,
      overallNotes:
        "The detected test was not found in the catalog. Please select the assessment manually.",
      questions: [],
    };
  }

  return validateVisionResult(parsed, assessmentRef);
}
