"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { Catalog } from "@/types/catalog";
import type { QuestionPerformance, Subject } from "@/types/report";
import { PERFORMANCE_OPTIONS, calculateScore } from "@/types/report";
import type { VisionAnalysisResult } from "@/types/vision";
import { MOTTO } from "@/lib/brand";
import MarkingConfirmation from "@/components/MarkingConfirmation";

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: "english", label: "English" },
  { value: "maths", label: "Maths" },
  { value: "science", label: "Science" },
];

const inputClass =
  "mt-1 block w-full rounded-lg border border-purple-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20";

interface ReportFormProps {
  accessBlockedReason?: string | null;
}

export default function ReportForm({ accessBlockedReason }: ReportFormProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [marksConfirmed, setMarksConfirmed] = useState(false);

  const [pendingVision, setPendingVision] = useState<VisionAnalysisResult | null>(
    null
  );
  const [pendingPerformances, setPendingPerformances] = useState<
    QuestionPerformance[]
  >([]);

  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [bookId, setBookId] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [tutorNotes, setTutorNotes] = useState("");
  const [performances, setPerformances] = useState<QuestionPerformance[]>([]);
  const [lowConfidenceIndexes, setLowConfidenceIndexes] = useState<Set<number>>(
    new Set()
  );

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load catalog");
        return res.json();
      })
      .then((data: Catalog) => setCatalog(data))
      .catch(() => setCatalogError("Could not load assessment catalog"));
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const books = useMemo(() => {
    if (!catalog || !subject) return [];
    return catalog.books.filter((book) => book.subject === subject);
  }, [catalog, subject]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === bookId),
    [books, bookId]
  );

  const assessments = useMemo(
    () => selectedBook?.assessments ?? [],
    [selectedBook]
  );

  const selectedAssessment = useMemo(
    () => assessments.find((item) => item.id === assessmentId),
    [assessments, assessmentId]
  );

  useEffect(() => {
    if (selectedAssessment) {
      setPerformances(
        selectedAssessment.questions.map(() => "Correct" as QuestionPerformance)
      );
      setLowConfidenceIndexes(new Set());
      setAnalyzeMessage(null);
      setMarksConfirmed(false);
      setPendingVision(null);
      setPendingPerformances([]);
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (photoInputRef.current) photoInputRef.current.value = "";
    } else {
      setPerformances([]);
      setLowConfidenceIndexes(new Set());
      setPendingVision(null);
      setPendingPerformances([]);
    }
  }, [selectedAssessment]);

  const scorePreview = useMemo(() => {
    if (!selectedAssessment || performances.length === 0) return null;

    const maxMarks = selectedAssessment.questions.map((q) => q.maxMarks ?? 1);
    const marks = performances.map((performance, index) => ({
      questionIndex: index,
      performance,
    }));

    return calculateScore(marks, maxMarks);
  }, [selectedAssessment, performances]);

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function handleSubjectChange(value: Subject) {
    setSubject(value);
    setBookId("");
    setAssessmentId("");
  }

  function handleBookChange(value: string) {
    setBookId(value);
    setAssessmentId("");
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setAnalyzeMessage(null);
    setMarksConfirmed(false);
    setPendingVision(null);
    setPendingPerformances([]);
    setError(null);
  }

  function updatePerformance(index: number, value: QuestionPerformance) {
    setPerformances((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setLowConfidenceIndexes((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }

  function showVisionForReview(result: VisionAnalysisResult) {
    if (!selectedAssessment) return;

    const suggested = selectedAssessment.questions.map(
      (_, index) =>
        result.questions.find((item) => item.questionIndex === index)
          ?.performance ?? ("Correct" as QuestionPerformance)
    );

    setPendingVision(result);
    setPendingPerformances(suggested);
    setMarksConfirmed(false);
    setAnalyzeMessage(null);
  }

  function updatePendingPerformance(index: number, value: QuestionPerformance) {
    setPendingPerformances((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function confirmVisionMarks() {
    if (!pendingVision) return;

    const lowConfidence = new Set<number>();
    pendingVision.questions.forEach((item) => {
      if (item.confidence === "low" || item.confidence === "medium") {
        lowConfidence.add(item.questionIndex);
      }
    });

    setPerformances([...pendingPerformances]);
    setLowConfidenceIndexes(lowConfidence);
    setMarksConfirmed(true);
    setPendingVision(null);
    setPendingPerformances([]);

    if (pendingVision.overallNotes && !tutorNotes.trim()) {
      setTutorNotes(pendingVision.overallNotes);
    }

    const lowCount = lowConfidence.size;
    const matchNote = pendingVision.testMatch
      ? "Marks confirmed and applied to the form."
      : "Marks confirmed — please double-check the highlighted questions below.";

    setAnalyzeMessage(
      lowCount > 0
        ? `${matchNote} ${lowCount} question${lowCount === 1 ? "" : "s"} still flagged for review.`
        : matchNote
    );
  }

  function discardVisionMarks() {
    setPendingVision(null);
    setPendingPerformances([]);
    setAnalyzeMessage("Suggestions discarded — mark questions manually below.");
  }

  async function handleAnalyzePhoto() {
    if (accessBlockedReason || !assessmentId || !photoFile) return;

    setAnalyzing(true);
    if (accessBlockedReason) {
      setError(accessBlockedReason);
      return;
    }

    setError(null);
    setAnalyzeMessage(null);

    const formData = new FormData();
    formData.set("assessmentId", assessmentId);
    formData.set("image", photoFile);

    try {
      const response = await fetch("/api/analyze-marking", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyse photo");
      }

      showVisionForReview(data as VisionAnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse photo");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("studentName", studentName);
    formData.set("assessmentId", assessmentId);
    formData.set("tutorNotes", tutorNotes);
    performances.forEach((performance, index) => {
      formData.set(`question_${index}`, performance);
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate report");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "Student_Report.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      formRef.current?.reset();
      setStudentName("");
      setSubject("");
      setBookId("");
      setAssessmentId("");
      setTutorNotes("");
      setPerformances([]);
      setLowConfidenceIndexes(new Set());
      setAnalyzeMessage(null);
      setMarksConfirmed(false);
      setPendingVision(null);
      setPendingPerformances([]);
      clearPhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (catalogError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {catalogError}
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="py-8 text-center text-sm text-purple-600">
        Loading assessment catalog…
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-700">
          {MOTTO.join(" · ")}
        </p>
      </div>

      {accessBlockedReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {accessBlockedReason}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="studentName" className="block text-sm font-medium text-purple-900">
            Student Name
          </label>
          <input
            id="studentName"
            name="studentName"
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Emma Thompson"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-purple-900">
            Subject
          </label>
          <select
            id="subject"
            required
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value as Subject)}
            className={inputClass}
          >
            <option value="" disabled>
              Select a subject
            </option>
            {SUBJECTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bookId" className="block text-sm font-medium text-purple-900">
            Book
          </label>
          <select
            id="bookId"
            required
            value={bookId}
            onChange={(e) => handleBookChange(e.target.value)}
            disabled={!subject}
            className={inputClass}
          >
            <option value="" disabled>
              {subject ? "Select a book" : "Select subject first"}
            </option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="assessmentId" className="block text-sm font-medium text-purple-900">
            Assessment / Chapter
          </label>
          <select
            id="assessmentId"
            name="assessmentId"
            required
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            disabled={!bookId}
            className={inputClass}
          >
            <option value="" disabled>
              {bookId ? "Select an assessment" : "Select a book first"}
            </option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title} ({assessment.chapter})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAssessment && (
        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
          <h3 className="text-sm font-semibold text-purple-900">
            Upload marked test photo
          </h3>
          <p className="mt-1 text-xs text-purple-600">
            Take a clear photo of the marked paper. The system uses the assessment
            catalog to suggest marks — always review before generating.
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <input
                ref={photoInputRef}
                id="testPhoto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-purple-800"
              />
              {photoFile && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-2 text-xs text-purple-600 underline hover:text-purple-800"
                >
                  Remove photo
                </button>
              )}
            </div>

            {photoPreview && (
              <img
                src={photoPreview}
                alt="Marked test preview"
                className="h-32 w-auto rounded-lg border border-purple-200 object-contain shadow-sm"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleAnalyzePhoto}
            disabled={!photoFile || analyzing || Boolean(accessBlockedReason)}
            className="mt-4 w-full rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {analyzing ? "Reading marks from photo…" : "Read marks from photo"}
          </button>

          {analyzeMessage && !pendingVision && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                marksConfirmed
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-purple-200 bg-purple-50 text-purple-800"
              }`}
            >
              {analyzeMessage}
            </div>
          )}
        </div>
      )}

      {pendingVision && photoPreview && selectedAssessment && (
        <MarkingConfirmation
          assessment={selectedAssessment}
          photoPreview={photoPreview}
          result={pendingVision}
          performances={pendingPerformances}
          onPerformanceChange={updatePendingPerformance}
          onConfirm={confirmVisionMarks}
          onDiscard={discardVisionMarks}
        />
      )}

      {selectedAssessment && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-purple-900">
              {marksConfirmed ? "Confirmed marks" : "Mark each question"}
            </h3>
            {scorePreview && (
              <p className="text-sm font-medium text-purple-700">
                Score: {scorePreview.recordedScore}/{scorePreview.maxScore} (
                {scorePreview.percentage}%)
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-purple-100">
            <table className="min-w-full divide-y divide-purple-100 text-sm">
              <thead className="bg-purple-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-purple-900">
                    Question
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-purple-900">
                    Skill area
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-purple-900">
                    Marks
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-purple-900">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {selectedAssessment.questions.map((question, index) => (
                  <tr
                    key={index}
                    className={
                      lowConfidenceIndexes.has(index) ? "bg-amber-50" : undefined
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      Q{index + 1}
                      {lowConfidenceIndexes.has(index) && (
                        <span className="ml-2 text-xs font-normal text-amber-700">
                          review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{question.skillArea}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {question.maxMarks ?? 1}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        name={`question_${index}`}
                        required
                        value={performances[index] ?? ""}
                        onChange={(e) =>
                          updatePerformance(index, e.target.value as QuestionPerformance)
                        }
                        className="block w-full rounded-md border border-purple-200 px-2 py-1.5 text-sm"
                        disabled={Boolean(accessBlockedReason)}
                      >
                        {PERFORMANCE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="tutorNotes" className="block text-sm font-medium text-purple-900">
          Tutor notes (optional)
        </label>
        <textarea
          id="tutorNotes"
          name="tutorNotes"
          rows={4}
          value={tutorNotes}
          onChange={(e) => setTutorNotes(e.target.value)}
          placeholder="Any extra observations to include in the report…"
          className={inputClass}
          disabled={Boolean(accessBlockedReason)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !assessmentId ||
          pendingVision !== null ||
          Boolean(accessBlockedReason)
        }
        className="w-full rounded-lg bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendingVision
          ? "Confirm suggested marks first"
          : loading
            ? "Generating report…"
            : accessBlockedReason
              ? "Subscription required"
            : "Generate PDF Report"}
      </button>
    </form>
  );
}
