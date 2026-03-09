"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ExamDoc } from "@/types/exam";
import QuestionForm from "@/components/QuestionForm";
import EditQuestionModal from "@/components/EditQuestionModal";
import toast from "react-hot-toast";
import AnswerKeyModal from "@/components/answerKeyModal";
import AddExistingQuestionModal from "@/components/addExistingQuestionModal";
import type { Question } from "@/types/question";
import type { ExamQuestionItem } from "@/types/exam";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAuth } from "@/components/AuthContext";
import { Background } from "@/components/BackgroundModal"
import InstructionEditor from "@/components/InstructionEditor";
import { renderTipTap } from "@/components/renderTipTap";

const POINTS_BY_TYPE: Record<string, number> = {
  MC: 1,
  TF: 1,
  FIB: 1,   // or 2 if you want
  Essay: 5,
  Code: 10,
};

//types for the queue of edits/deletes that they user can make
type BankOp =
  | { kind: "DELETE"; bankId: string }
  | { kind: "EDIT"; bankId: string; payload: any };

const normalizeType = (t: string) => {
  const x = (t || "").trim();
  if (x === "MC" || x === "TF" || x === "FIB" || x === "Essay" || x === "Code") return x;
  if (x === "Multiple Choice") return "MC";
  if (x === "True/False") return "TF";
  if (x === "Fill in the Blank") return "FIB";
  return "MC";
};

export default function EditExamPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [isEditQuestionFormOpen, setIsEditQuestionFormOpen] = useState(false);
  const [isAnswerKeyOpen, setIsAnswerKeyOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [isExistingPickerOpen, setIsExistingPickerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<any>(null);
  const [alsoDeleteInBank, setAlsoDeleteInBank] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);
  const [bankOps, setBankOps] = useState<BankOp[]>([]);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null)

  // Function to count the total points any time a point value is edited
  const recomputeTotalPoints = (questions: any[]) =>
    questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const updateQuestionPoints = (questionId: string, newPoints: number) => {
    if (!exam) return;

    const questions = (exam.questions ?? []).map((q) =>
      q.questionId === questionId ? { ...q, points: newPoints } : q
    );

    setExam({
      ...exam,
      questions,
      totalPoints: recomputeTotalPoints(questions),
    });
    setDirty(true); //marked as unsaved change
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    e.dataTransfer.setData("text/plain", questionId);
    setDraggedQuestion(questionId);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    setDraggedQuestion(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(index);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedQuestionId = e.dataTransfer.getData("text/plain");

    if (!exam) return;

    const questions = [...exam.questions];
    const draggedIndex = questions.findIndex(q => q.questionId === draggedQuestionId);

    if (draggedIndex === -1) return;

    // If same position, do nothing
    if (draggedIndex === targetIndex || draggedIndex === targetIndex - 1) {
      setDropTarget(null);
      return;
    }

    // Reorder questions
    const [movedQuestion] = questions.splice(draggedIndex, 1);

    // Adjust target index if dragging from above the insertion point
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    questions.splice(adjustedTargetIndex, 0, movedQuestion);

    setExam({
      ...exam,
      questions
    });
    setDirty(true); //marked as unsaved
    setDropTarget(null);
  };

  //this is for the question form popup
  const handleFormClose = () => {
    setIsQuestionFormOpen(false);
  };

  //this is for the edit question form popup
  const handleEditFormClose = () => {
    setIsEditQuestionFormOpen(false);
    setEditingQuestion(null);
  };

  //Scroll back to top
  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  };

  // Fetch this specific exam
  useEffect(() => {
    const fetchExam = async () => {
      if (!id || !user?._id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/exams?id=${id}&userID=${user._id}`);
        if (!res.ok) throw new Error("Failed to fetch exam");
        const data = await res.json();
        console.log("API /api/exams result for edit_exam:", data);
        setExam(data);
      } catch (err) {
        console.error("Error fetching exam:", err);
        setError(err instanceof Error ? err.message : "Error loading exam");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchExam();
  }, [id, user?._id]);

  // if the exam has been edited show the unsaved changes popup
  const handleClose = () => {
    if (dirty) {
      setIsUnsavedConfirmOpen(true);   // show popup
      return;
    }
    router.push("/past_exams");        // Go back to past exams page
  };

  // this will add the question to the bottom of current exam
  // it will not save it if the exam is exited without saving 
  const handleQuestionAdded = (newQuestion: any) => {
    if (!exam) return;

    const newQuestionWithPoints = {
      ...newQuestion,
      type: newQuestion.type,
      points: POINTS_BY_TYPE[newQuestion.type] ?? 1,
    }

    const questions = [...(exam.questions ?? []), newQuestionWithPoints];
    setExam({
      ...exam,
      questions,
      totalPoints: recomputeTotalPoints(questions),
    });

    setDirty(true); //marked as unsaved change
  };

  // this will delete the question 
  // it will not save it if the exam is exited without saving 
  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setPendingDeleteQuestion(null);
    setAlsoDeleteInBank(false);
  };
  const getBankQuestionId = (q: any) => {
    return q?.questionId || q?.snapshot?._id || q?._id || null;
  };

  //adds question in queue of unsaved changes marked for delete
  const queueDeleteFromBank = (bankId: string) => {
    setBankOps((ops) => {
      // Replace any existing queued op for this question; DELETE wins
      const filtered = ops.filter((o) => o.bankId !== bankId);
      return [...filtered, { kind: "DELETE", bankId }];
    });
  };

  // Queue an EDIT for Question Bank (ignored if DELETE already queued)
  const queueEditToBank = (bankId: string, payload: any) => {
    setBankOps((ops) => {
      const hasDelete = ops.some((o) => o.bankId === bankId && o.kind === "DELETE");
      if (hasDelete) return ops;

      // replace any existing edit with a new edit with the new changes
      const filtered = ops.filter((o) => !(o.bankId === bankId && o.kind === "EDIT"));
      return [...filtered, { kind: "EDIT", bankId, payload }];
    });
  };

  // Apply queued question bank operations (only run after Save Exam)
  const applyBankOps = async () => {
    for (const op of bankOps) {
      if (op.kind === "DELETE") {
        const res = await fetch(`/api/questions?id=${encodeURIComponent(op.bankId)}`, {
          method: "DELETE",
        });

        // treat "not found" as success
        if (!res.ok && res.status !== 404) {
          const result = await res.json().catch(() => ({}));
          throw new Error(result?.error || "Failed to delete from question bank");
        }
      }

      if (op.kind === "EDIT") {
        const res = await fetch(`/api/questions?id=${encodeURIComponent(op.bankId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.payload),
        });

        if (!res.ok) {
          const result = await res.json().catch(() => ({}));
          throw new Error(result?.error || "Failed to update question bank");
        }
      }
    }
  };


  const handleConfirmDeleteQuestion = async () => {
    if (!exam || !pendingDeleteQuestion) return;

    setIsDeleting(true);
    try {
      const questions = exam.questions.filter(q => q.questionId !== pendingDeleteQuestion.questionId)
      setExam({
        ...exam,
        questions,
        totalPoints: recomputeTotalPoints(questions),
      });
      setDirty(true); //marked as unsaved
      if (alsoDeleteInBank) {
        const bankId = getBankQuestionId(pendingDeleteQuestion);

        if (!bankId) {
          toast.error("Missing question bank id — cannot delete from bank");
        } else {
          queueDeleteFromBank(bankId);
          toast.success("Queued delete from Question Bank (will apply on Save Exam)");
        }
      }

      toast.success("Removed from exam");
      closeDeleteConfirm();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };


  // this will open the edit modal for a question
  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setIsEditQuestionFormOpen(true);
  };

  // this will update the question in the local exam state
  const handleQuestionUpdated = (updatedQuestionData: any) => {
    if (!exam || !editingQuestion) return;

    setExam({
      ...exam,
      questions: exam.questions.map(q =>
        q.questionId === editingQuestion.questionId
          ? {
            ...q,
            points: updatedQuestionData.points || q.points,
            snapshot: {
              ...q.snapshot,
              stem: updatedQuestionData.stem,
              choices: updatedQuestionData.choices || q.snapshot?.choices,
              answer: updatedQuestionData.answer || q.snapshot?.answer,
              blankLines: updatedQuestionData.blankLines || q.snapshot?.blankLines,
            }
          }
          : q
      )
    });

    //if the user selects the question to be deleted or edited from question bank
    //gets the payload and adds it to the queue 
    if (updatedQuestionData?.alsoUpdateInBank) {
      const bankId = updatedQuestionData.bankId || getBankQuestionId(editingQuestion);

      if (!bankId) {
        toast.error("Missing question bank id — cannot queue edit");
      } else {
        const payload = {
          stem: updatedQuestionData.stem,
          type: updatedQuestionData.type ?? editingQuestion.type,
          difficulty: updatedQuestionData.difficulty ?? editingQuestion.snapshot?.difficulty ?? 1,
          topics: updatedQuestionData.topics ?? editingQuestion.snapshot?.topics ?? [],
          choices: updatedQuestionData.choices ?? editingQuestion.snapshot?.choices ?? [],
          answer: updatedQuestionData.answer ?? editingQuestion.snapshot?.answer ?? "",
          blankLines: updatedQuestionData.blankLines ?? editingQuestion.snapshot?.blankLines ?? 1,
        };

        queueEditToBank(bankId, payload);
        toast.success("Queued edit in Question Bank (will apply on Save Exam)");
      }
    }
    setDirty(true); //marked as unsaved
    handleEditFormClose();
  };

  const handleExistingQuestionsAdded = (selectedQuestions: Question[]) => {
    if (!exam) return;

    const existingIds = new Set((exam.questions ?? []).map(q => q.questionId));

    const newExamQuestions: ExamQuestionItem[] = selectedQuestions
      .filter(q => !existingIds.has(q._id))
      .map((q): ExamQuestionItem => ({
        questionId: q._id,
        type: q.type,
        subject: q.subject ?? exam.subject,
        courseNum: q.courseNum ?? exam.courseNum,
        points: POINTS_BY_TYPE[q.type] ?? 1,
        snapshot: {
          stem: q.stem,
          choices: q.choices ?? [],
          answer: q.answer ?? "",
          blankLines: 4,
        },
      }));

    const questions = [...(exam.questions ?? []), ...newExamQuestions]
    setExam({
      ...exam,
      questions,
      totalPoints: recomputeTotalPoints(questions),
    });

    setDirty(true); //marked as unsaved change
  };

  //Save exam changes, then apply queued Question Bank ops
  const handleSaveExam = async () => {
    if (!exam) return;

    try {
      setIsSaving(true);
      console.log("Saving exam:", exam);

      const res = await fetch("/api/exams", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: exam._id,
          title: exam.title,
          timeLimitMin: exam.timeLimitMin,
          totalPoints: exam.totalPoints,
          questions: exam.questions,
          instructionsDoc: exam.instructionsDoc,
        }),
      });

      const result = await res.json();

      //if save workis 
      if (res.ok) {
        const refreshRes = await fetch(`/api/exams?id=${id}&userID=${user?._id}`);
        if (refreshRes.ok) {
          const updatedExam = await refreshRes.json();
          setExam(updatedExam);
          try {
            if (bankOps.length > 0) {
              await applyBankOps();
              toast.success("Question Bank updated!");
              setBankOps([]);
            }

            toast.success("Changes Saved!");
            setDirty(false);
          } catch (e: any) {
            console.error(e);
            toast.error(e?.message || "Saved exam, but failed updating Question Bank");
            setDirty(true); //keep dirty
          }
        }
      } else {
        console.error("Save failed:", result);
      }
    } catch (error) {
      console.error("Error saving exam:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Display loading state
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading exam...
      </div>
    );

  // Display error state
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          Go Back
        </button>
      </div>
    );

  // Display no exam found state
  if (!exam)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No exam found.
      </div>
    );

  // Otherwise, display the exam editing interface
  return (
    <Background>
      <div ref={pageTopRef} />
      <div className="min-h-screen w-full flex flex-col items-center py-10 px-4 font-serif">
        {/* X icon in the top right corner (returns to past exams) */}
        <button
          onClick={handleClose}
          className="absolute right-8 top-6 text-3xl leading-none text-gray-500 hover:text-black"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Paper outline that goes around the exam content */}
        <div className="relative bg-white border border-gray-300 shadow-md rounded-lg w-full max-w-[8.5in] p-10">
          {/* Name in the top left corner and points in top right */}
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">Name: ________________</span>
            <span className="text-4xl text-gray-600 font-medium rounded-lg border border-gray-600 px-6 py-1 min-w-[110px] text-right">
              /{exam.totalPoints}
            </span>
          </div>

          {/* Header (always displayed currently) */}
          <header className="mb-6 border-b pb-4 text-center">
            <div className="text-sm text-gray-600">Department of {exam.subject}</div>
            <h1 className="mt-1 text-2xl font-bold">{exam.title}</h1>
            <div className=" mt-1 text-sm text-gray-600">{exam.courseNum}</div>
            <div className="text-[13px] text-gray-600">
              Time: {exam.timeLimitMin} minutes • Total Points: {exam.totalPoints}
            </div>
          </header>

          {/* Instructions information */}
          <section className="mb-6 rounded-lg border p-4 text-sm leading-6 print:break-inside-avoid">
            <div className="flex items-center justify-between mb-2">

              {!isEditingInstructions && (
                <button
                  type="button"
                  onClick={() => setIsEditingInstructions(true)}
                  className="ml-auto rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
              )}
            </div>

            {!isEditingInstructions ? (
              <div className="text-center font-serif">
                {exam.instructionsDoc ? renderTipTap(exam.instructionsDoc) : (
                  <p className="text-gray-500">No instructions.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <InstructionEditor
                  initialContent={exam.instructionsDoc}
                  resetKey={String(exam._id)}
                  forceLight
                  showSaveButton={false}
                  onChange={(content) => {
                    setExam((prev) => (prev ? { ...prev, instructionsDoc: content } : prev));
                    setDirty(true);
                  }}
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInstructions(false)}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Drag and Drop Instructions */}
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 print:hidden text-center">
            <p>Drag questions using the handle (☰) to reorder them. A blue box shows where the question will be placed. You can add questions in between, above, or below existing ones. Remember to click "Save Exam" to keep your changes.</p>
          </div>

          {/* Questions */}
          <main className="font-serif">
            <div className="space-y-6">
              {/* Top drop zone - before first question */}
              <div
                onDragOver={(e) => handleDragOver(e, 0)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 0)}
                className={`h-5 mt-3 transition-all duration-200 rounded-lg border-2 border-dashed ${dropTarget === 0
                  ? 'bg-blue-100 border-blue-500'
                  : 'border-transparent'
                  }`}
              />
              {/* Render each question */}
              {exam.questions?.map((q, index) => {
                const points = q.points ?? 1;
                const isBeingDragged = draggedQuestion === q.questionId;

                return (
                  // For each question
                  <div key={q.questionId} className="relative group">
                    {/* Question item */}
                    <div className={`relative transition-all duration-200 rounded-lg ${isBeingDragged ? 'opacity-50' : 'bg-white'
                      }`}>
                      <div className="flex items-start gap-3">
                        {/* Drag Handle - Only this part is draggable */}
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, q.questionId)}
                          onDragEnd={handleDragEnd}
                          className="cursor-move p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors mt-1"
                          title="Drag to reorder"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
                            />
                          </svg>
                        </div>

                        {/* Question Number and Content */}
                        <div className="flex-1 flex items-start gap-3">
                          {/* Question Number */}
                          <span className="font-medium text-gray-700 mt-1">
                            {index + 1}.
                          </span>

                          {/* Question Content */}
                          <div className="flex-1">
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <div className="font-medium leading-relaxed">
                                {q.snapshot?.stem ?? "(Question text)"}
                              </div>

                              {/* Righthand side: points, edit, delete */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-600">Pts</label>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-16 rounded border px-2 py-0.5 text-xs text-gray-700"
                                    value={points}
                                    onChange={(e) => updateQuestionPoints(q.questionId, Number(e.target.value))}
                                  />
                                </div>
                                <button onClick={() => handleEditQuestion(q)}
                                  className="rounded border border-blue-300 text-blue-600 px-2 py-0.5 text-xs hover:bg-blue-50 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingDeleteQuestion(q);
                                    setAlsoDeleteInBank(false);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="rounded border border-red-300 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50 transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Type-specific */}
                            {q.type === "MC" && (
                              <ul className="ml-4 list-[upper-alpha] space-y-1 pl-4">
                                {(q.snapshot?.choices ?? []).map((c: any, idx: number) => (
                                  <li key={idx} className="leading-7 text-[15px]">
                                    {c.text ?? c.label}
                                  </li>
                                ))}
                              </ul>
                            )}

                            {q.type === "TF" && (
                              <div className="ml-1 text-[15px]">
                                <span className="mr-4">Circle one:</span>
                                <span className="inline-block px-2 py-0.5 mr-2">True</span>
                                <span className="inline-block px-2 py-0.5">False</span>
                              </div>
                            )}

                            {q.type === "Essay" && (
                              <div className="mt-3 space-y-3">
                                {Array.from({ length: q.snapshot?.blankLines ?? 4 }).map((_, idx) => (
                                  <div key={idx} className="h-6 w-full border-b" />
                                ))}
                              </div>
                            )}

                            {q.type === "Code" && (
                              <div className="mt-3 border border-gray-300 bg-gray-50 rounded-md">
                                <div className="h-40" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Drop zone between questions */}
                    {index < exam.questions.length - 1 && (
                      <div
                        onDragOver={(e) => handleDragOver(e, index + 1)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index + 1)}
                        className={`h-5 mt-3 -mb-2 transition-all duration-200 rounded-lg border-2 border-dashed ${dropTarget === index + 1
                          ? 'bg-blue-100 border-blue-500'
                          : 'border-transparent'
                          }`}
                      />
                    )}
                  </div>
                );
              })}

              {/* Bottom drop zone - after last question */}
              <div
                onDragOver={(e) => handleDragOver(e, exam.questions.length)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, exam.questions.length)}
                className={`h-5 -mt-3 transition-all duration-200 rounded-lg border-2 border-dashed ${dropTarget === (exam.questions?.length ?? 0)
                  ? 'bg-blue-100 border-blue-500'
                  : 'border-transparent'
                  }`}
              />
            </div>
          </main>

          {/* Bottom Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 font-serif">
            <div className="flex gap-3">
              <button onClick={() => setIsQuestionFormOpen(true)} className="px-3 py-2 btn btn-ghost">
                + Add New Question
              </button>
              <button onClick={() => setIsExistingPickerOpen(true)} className="px-3 py-2 btn btn-ghost">
                + Add Existing Question
              </button>
              <button onClick={() => setIsAnswerKeyOpen(true)} className="px-3 py-2 btn btn-ghost">
                View Answer Key
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-200 transition"
              >
                Cancel
              </button>
              <button onClick={handleSaveExam} disabled={isSaving} className="btn btn-primary-blue">
                {isSaving ? "Saving..." : "Save Exam"}
              </button>
            </div>
          </div>
        </div>
        <ConfirmationModal isOpen={isDeleteConfirmOpen} onClose={closeDeleteConfirm} onConfirm={handleConfirmDeleteQuestion} type="question" isLoading={isDeleting} text={pendingDeleteQuestion?.snapshot?.stem ?? ""} showAlsoDeleteInBank={true} alsoDeleteInBank={alsoDeleteInBank} onAlsoDeleteInBankChange={setAlsoDeleteInBank} />
        <QuestionForm isOpen={isQuestionFormOpen} onClose={handleFormClose} onQuestionAdded={handleQuestionAdded} />
        <EditQuestionModal isOpen={isEditQuestionFormOpen} onClose={handleEditFormClose} question={editingQuestion} onQuestionUpdated={handleQuestionUpdated} />
        <AddExistingQuestionModal isOpen={isExistingPickerOpen} onClose={() => setIsExistingPickerOpen(false)} onAddSelected={handleExistingQuestionsAdded} excludeIds={new Set((exam.questions ?? []).map(q => q.questionId))} />
        {exam && <AnswerKeyModal isOpen={isAnswerKeyOpen} onClose={() => setIsAnswerKeyOpen(false)} exam={exam} />}
        <ConfirmationModal
          isOpen={isUnsavedConfirmOpen}
          onClose={() => setIsUnsavedConfirmOpen(false)}  // stay on page
          onConfirm={() => {
            setIsUnsavedConfirmOpen(false);
            setDirty(false);
            router.push("/past_exams");     //leave without saveing
          }}
          type="unsaved"
        />
      </div>
      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed left-1/2 -translate-x-1/2 bottom-4 bg-white border border-gray-300 rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
          />
        </svg>
        Back to Top
      </button>
    </Background>
  );
}