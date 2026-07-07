"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Catalog } from "@/types/catalog";
import type { Subject } from "@/types/report";
import {
  calculateScore,
  formatMarkOption,
  markOptions,
  marksToPerformance,
} from "@/types/report";
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

const MAX_PHOTOS = 5;

interface ReportFormProps {
  accessBlockedReason?: string | null;
}

export default function ReportForm({ accessBlockedReason }: ReportFormProps) {
  const skipResetRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
  const [pendingMarks, setPendingMarks] = useState<number[]>([]);

  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [bookId, setBookId] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [tutorNotes, setTutorNotes] = useState("");
  const [marks, setMarks] = useState<number[]>([]);
  const [lowConfidenceIndexes, setLowConfidenceIndexes] = useState<Set<number>>(
    new Set()
  );

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [detectionNote, setDetectionNote] = useState<string | null>(null);

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
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

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

  const confirmationAssessment = useMemo(() => {
    if (pendingVision?.assessmentId && catalog) {
      for (const book of catalog.books) {
        const assessment = book.assessments.find(
          (item) => item.id === pendingVision.assessmentId
        );
        if (assessment) return assessment;
      }
    }
    return selectedAssessment;
  }, [catalog, pendingVision, selectedAssessment]);

  useEffect(() => {
    if (!selectedAssessment) {
      setMarks([]);
      return;
    }

    if (skipResetRef.current) {
      skipResetRef.current = false;
      if (marks.length !== selectedAssessment.questions.length) {
        setMarks(
          selectedAssessment.questions.map(
            (question) => question.maxMarks ?? 1
          )
        );
      }
      return;
    }

    setMarks(
      selectedAssessment.questions.map((question) => question.maxMarks ?? 1)
    );
    setLowConfidenceIndexes(new Set());
    setAnalyzeMessage(null);
    setMarksConfirmed(false);
    setPendingVision(null);
    setPendingMarks([]);
    setPhotoFiles([]);
    setPhotoPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setDetectionNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- skipResetRef guards detection apply
  }, [selectedAssessment]);

  const scorePreview = useMemo(() => {
    if (!selectedAssessment || marks.length === 0) return null;

    const maxMarksPerQuestion = selectedAssessment.questions.map(
      (question) => question.maxMarks ?? 1
    );
    const questionMarks = marks.map((awardedMarks, index) => ({
      questionIndex: index,
      awardedMarks,
    }));

    return calculateScore(questionMarks, maxMarksPerQuestion);
  }, [selectedAssessment, marks]);

  function clearPhotos() {
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoFiles([]);
    setPhotoPreviews([]);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function handleSubjectChange(value: Subject) {
    setSubject(value);
    setBookId("");
    setAssessmentId("");
    setDetectionNote(null);
  }

  function handleBookChange(value: string) {
    setBookId(value);
    setAssessmentId("");
    setDetectionNote(null);
  }

  function resetPhotoAnalysisState() {
    setAnalyzeMessage(null);
    setMarksConfirmed(false);
    setPendingVision(null);
    setPendingMarks([]);
    setError(null);
    setDetectionNote(null);
  }

  function appendPhotos(files: File[]) {
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS - photoFiles.length;
    if (remaining <= 0) {
      setError(
        `You can add up to ${MAX_PHOTOS} photos. Remove one to add another.`
      );
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (toAdd.length < files.length) {
      setError(
        `Only ${remaining} more photo${remaining === 1 ? "" : "s"} could be added (maximum ${MAX_PHOTOS}).`
      );
    } else {
      setError(null);
    }

    setPhotoFiles((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...toAdd.map((file) => URL.createObjectURL(file)),
    ]);
    resetPhotoAnalysisState();
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    appendPhotos(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleCameraCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) appendPhotos([file]);
    event.target.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMark(index: number, value: number) {
    setMarks((prev) => {
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

  const applyDetectionToForm = useCallback(
    (result: VisionAnalysisResult, detectedMarks: number[]) => {
      if (!catalog) return;

      if (!result.testMatch || !result.assessmentId) {
        setDetectionNote(
          result.overallNotes ??
            "Could not auto-detect the test. Please select subject, book, and assessment manually."
        );
        return;
      }

      const book = catalog.books.find((item) =>
        item.assessments.some(
          (assessment) => assessment.id === result.assessmentId
        )
      );

      if (!book) {
        setDetectionNote(
          "Detected test not found in catalog. Please select manually."
        );
        return;
      }

      const assessment = book.assessments.find(
        (item) => item.id === result.assessmentId
      );

      skipResetRef.current = true;
      setSubject(book.subject);
      setBookId(book.id);
      setAssessmentId(result.assessmentId!);
      setMarks(detectedMarks);
      setDetectionNote(
        result.overallNotes ??
          `Detected: ${book.name} — ${assessment?.title ?? result.assessmentId}`
      );
    },
    [catalog]
  );

  function findAssessmentByIdInCatalog(assessmentId?: string) {
    if (!catalog || !assessmentId) return null;
    for (const book of catalog.books) {
      const assessment = book.assessments.find((item) => item.id === assessmentId);
      if (assessment) return assessment;
    }
    return null;
  }

  function showVisionForReview(result: VisionAnalysisResult) {
    const targetAssessment =
      findAssessmentByIdInCatalog(result.assessmentId) ?? selectedAssessment;
    if (!targetAssessment) {
      setError(
        result.overallNotes ??
          "Could not find the detected assessment in the catalog. Please select manually."
      );
      return;
    }

    const suggested = targetAssessment.questions.map((question, index) => {
      const fromVision = result.questions.find(
        (item) => item.questionIndex === index
      );
      return fromVision?.awardedMarks ?? question.maxMarks ?? 1;
    });

    if (result.testMatch && result.assessmentId) {
      applyDetectionToForm(result, suggested);
    }

    setPendingVision(result);
    setPendingMarks(suggested);
    setMarksConfirmed(false);
    setAnalyzeMessage(null);
  }

  function updatePendingMark(index: number, value: number) {
    setPendingMarks((prev) => {
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

    applyDetectionToForm(pendingVision, pendingMarks);
    setMarks([...pendingMarks]);
    setLowConfidenceIndexes(lowConfidence);
    setMarksConfirmed(true);
    setPendingVision(null);
    setPendingMarks([]);

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
    setPendingMarks([]);
    setAnalyzeMessage("Suggestions discarded — mark questions manually below.");
  }

  async function handleAnalyzePhoto() {
    if (accessBlockedReason || photoFiles.length === 0) return;

    setAnalyzing(true);
    setError(null);
    setAnalyzeMessage(null);
    setDetectionNote(null);

    const formData = new FormData();
    if (assessmentId) {
      formData.set("assessmentId", assessmentId);
    }
    for (const file of photoFiles) {
      formData.append("image", file);
    }

    try {
      const response = await fetch("/api/analyze-marking", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyse photo");
      }

      const result = data as VisionAnalysisResult;

      if (!result.testMatch || !result.assessmentId) {
        setDetectionNote(
          result.overallNotes ??
            "Could not identify the test. Please select subject, book, and assessment manually."
        );
        if (result.questions.length > 0) {
          showVisionForReview(result);
        } else {
          setError(
            result.overallNotes ??
              "Could not identify the test from the photo. Please select the assessment manually."
          );
        }
        return;
      }

      showVisionForReview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse photo");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("studentName", studentName);
    formData.set("assessmentId", assessmentId);
    formData.set("tutorNotes", tutorNotes);
    marks.forEach((awardedMarks, index) => {
      formData.set(`question_${index}`, String(awardedMarks));
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
      setMarks([]);
      setLowConfidenceIndexes(new Set());
      setAnalyzeMessage(null);
      setMarksConfirmed(false);
      setPendingVision(null);
      setPendingMarks([]);
      clearPhotos();
      setDetectionNote(null);
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
      <div className="flex items-center justify-center py-12 text-sm text-purple-600">
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        Loading assessments…
      </div>
    );
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {accessBlockedReason && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {accessBlockedReason}
          </div>
        )}

        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
          <h3 className="text-sm font-semibold text-purple-900">
            Read marks from photo(s)
          </h3>
          <p className="mt-1 text-xs text-purple-600">
            Upload photos or take pictures of each page of a marked test. Add up
            to {MAX_PHOTOS} pages — the system will try to detect which
            assessment it is and suggest marks.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={
                  Boolean(accessBlockedReason) || photoFiles.length >= MAX_PHOTOS
                }
                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose photos
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={
                  Boolean(accessBlockedReason) || photoFiles.length >= MAX_PHOTOS
                }
                className="rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-800 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {photoFiles.length > 0 ? "Take another page" : "Take photo"}
              </button>
              {photoFiles.length > 0 && (
                <button
                  type="button"
                  onClick={clearPhotos}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-purple-600 underline hover:text-purple-800"
                >
                  Remove all
                </button>
              )}
            </div>

            <input
              ref={uploadInputRef}
              id="testPhotoUpload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={handlePhotoUpload}
              disabled={Boolean(accessBlockedReason)}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              id="testPhotoCamera"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              disabled={Boolean(accessBlockedReason)}
              className="hidden"
            />

            {photoFiles.length > 0 && (
              <p className="text-xs text-purple-600">
                {photoFiles.length} of {MAX_PHOTOS} page
                {photoFiles.length === 1 ? "" : "s"} added
              </p>
            )}

            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {photoPreviews.map((preview, index) => (
                  <div key={preview} className="relative">
                    <img
                      src={preview}
                      alt={`Page ${index + 1}`}
                      className="h-32 w-auto rounded-lg border border-purple-200 object-contain shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAnalyzePhoto}
            disabled={
              photoFiles.length === 0 ||
              analyzing ||
              Boolean(accessBlockedReason)
            }
            className="mt-4 w-full rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {analyzing
              ? `Reading marks from photo${photoFiles.length > 1 ? "s" : ""}…`
              : `Read marks from photo${photoFiles.length > 1 ? "s" : ""}`}
          </button>

          {detectionNote && !pendingVision && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {detectionNote}
            </div>
          )}

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-purple-900"
            >
              Student name
            </label>
            <input
              id="studentName"
              name="studentName"
              type="text"
              required
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="e.g. Emma Thompson"
              className={inputClass}
              disabled={Boolean(accessBlockedReason)}
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-purple-900"
            >
              Subject
            </label>
            <select
              id="subject"
              required
              value={subject}
              onChange={(event) =>
                handleSubjectChange(event.target.value as Subject)
              }
              className={inputClass}
              disabled={Boolean(accessBlockedReason)}
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
            <label
              htmlFor="bookId"
              className="block text-sm font-medium text-purple-900"
            >
              Book
            </label>
            <select
              id="bookId"
              required
              value={bookId}
              onChange={(event) => handleBookChange(event.target.value)}
              disabled={!subject || Boolean(accessBlockedReason)}
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
            <label
              htmlFor="assessmentId"
              className="block text-sm font-medium text-purple-900"
            >
              Assessment / Chapter
            </label>
            <select
              id="assessmentId"
              name="assessmentId"
              required
              value={assessmentId}
              onChange={(event) => setAssessmentId(event.target.value)}
              disabled={!bookId || Boolean(accessBlockedReason)}
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
                      Max
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-purple-900">
                      Awarded
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-purple-900">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 bg-white">
                  {selectedAssessment.questions.map((question, index) => {
                    const maxMarks = question.maxMarks ?? 1;
                    const awarded = marks[index] ?? maxMarks;
                    const performance = marksToPerformance(awarded, maxMarks);

                    return (
                      <tr
                        key={index}
                        className={
                          lowConfidenceIndexes.has(index)
                            ? "bg-amber-50"
                            : undefined
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
                        <td className="px-4 py-3 text-gray-600">
                          {question.skillArea}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {maxMarks}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            name={`question_${index}`}
                            required
                            value={awarded}
                            onChange={(event) =>
                              updateMark(index, Number(event.target.value))
                            }
                            className="block w-full rounded-md border border-purple-200 px-2 py-1.5 text-sm"
                            disabled={Boolean(accessBlockedReason)}
                          >
                            {markOptions(maxMarks).map((option) => (
                              <option key={option} value={option}>
                                {formatMarkOption(option)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {performance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="tutorNotes"
            className="block text-sm font-medium text-purple-900"
          >
            Tutor notes (optional)
          </label>
          <textarea
            id="tutorNotes"
            name="tutorNotes"
            rows={4}
            value={tutorNotes}
            onChange={(event) => setTutorNotes(event.target.value)}
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

        <p className="text-center text-xs text-purple-400">{MOTTO.join(" · ")}</p>
      </form>

      {pendingVision && confirmationAssessment && (
        <MarkingConfirmation
          assessment={confirmationAssessment}
          visionResult={pendingVision}
          marks={pendingMarks}
          onMarkChange={updatePendingMark}
          onApply={confirmVisionMarks}
          onCancel={discardVisionMarks}
        />
      )}
    </>
  );
}
