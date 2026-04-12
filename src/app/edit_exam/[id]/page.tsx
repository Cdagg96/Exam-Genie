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
import useTheme from "@/hooks/useTheme"

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
  const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
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
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false); 
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

    const clampedPoints = Math.max(0, Math.min(50, Number(newPoints)));

    const questions = (exam.questions ?? []).map((q) =>
      q.questionId === questionId ? { ...q, points: clampedPoints } : q
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
    setIsDragging(true);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
    setDraggedQuestion(null);
    setDropTarget(null);
    setIsDragging(false);
  };

  //Check if dropping in this zone would actually move the question
  const wouldActuallyMoveQuestion = (dropZoneKey: string, draggedQuestionId: string): boolean => {
    if (!exam || !draggedQuestionId) return false;

    const questions = exam.questions;
    const draggedIndex = questions.findIndex(q => q.questionId === draggedQuestionId);
    if (draggedIndex === -1) return false;

    const [zoneType, indexStr] = dropZoneKey.split("-");
    let targetIndex: number;

    if (zoneType === "top") {
      // insert before question at this index
      targetIndex = parseInt(indexStr);
    } else if (zoneType === "between") {
      // current code inserts at index + 1
      targetIndex = parseInt(indexStr) + 1;
    } else if (zoneType === "bottom") {
      // insert at end
      targetIndex = parseInt(indexStr);
    } else {
      return false;
    }

  // these are the "no-op" positions from handleDrop
  return !(draggedIndex === targetIndex || draggedIndex === targetIndex - 1);
};

  //Check to see if its a valid zone to drag and drop
  const isValidDropZone = (dropZoneKey: string, draggedQuestionId: string): boolean => {
    if (!exam || !draggedQuestionId) return false;
    const [zoneType, indexStr] = dropZoneKey.split('-');
    const index = parseInt(indexStr);
    
    let targetIndex: number;
    
    if (zoneType === 'top') {
      targetIndex = index;
    } else if (zoneType === 'between') {
      targetIndex = index;
    } else if (zoneType === 'bottom') {
      targetIndex = index;
    } else {
      return false;
    }
    
    return canDropAtPosition(draggedQuestionId, targetIndex, zoneType);
  };

  const handleDragOver = (e: React.DragEvent, dropZoneKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(dropZoneKey);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  //Can question be dropped at this position?
  const canDropAtPosition = (draggedQuestionId: string, targetIndex: number, zoneType?: string): boolean => {
    if (!exam) return false;

    const draggedQuestion = exam.questions.find(q => q.questionId === draggedQuestionId);
    if (!draggedQuestion) return false;

    const draggedType = draggedQuestion.type;

    //Empty exam
    if (exam.questions.length === 0) return true;
    
    //Top drop zone (inserting at the beginning of a section)
    if (zoneType === 'top') {
      if (targetIndex === 0) {
        //Check first question
        return exam.questions[0]?.type === draggedType;
      }
      //Top of a section (the first question of this section)
      const targetQuestion = exam.questions[targetIndex];
      if (!targetQuestion) return false;
      return targetQuestion.type === draggedType;
    }
    
    //Between drop zone (inserting between questions)
    if (zoneType === 'between') {
      //Check the question before the insertion point
      if (targetIndex === 0) return false;
      const prevQuestion = exam.questions[targetIndex - 1];
      if (!prevQuestion) return false;
      return prevQuestion.type === draggedType;
    }
    
    //Bottom drop zone (inserting at the end)
    if (zoneType === 'bottom') {
      if (exam.questions.length === 0) return true;
      return exam.questions[exam.questions.length - 1]?.type === draggedType;
    }
    
    //Default
    return false;
  };

  const handleDrop = (e: React.DragEvent, dropZoneKey: string) => {
    e.preventDefault();
    const draggedQuestionId = e.dataTransfer.getData("text/plain");

    if (!exam) return;

    //Parse the drop zone key to get target index and type
    const [zoneType, indexStr] = dropZoneKey.split('-');
    let targetIndex: number;
    
    if (zoneType === 'top') {
      //For top drop zones, insert before the question at this index
      targetIndex = parseInt(indexStr);
    } else if (zoneType === 'between') {
      //For between drop zones, insert after the previous question (at this index)
      targetIndex = parseInt(indexStr) + 1;
    } else if (zoneType === 'bottom') {
      //For bottom drop zone, insert at the end
      targetIndex = parseInt(indexStr);
    } else {
      return;
    }

    //Check if the drop is allowed based on question types
    if (!canDropAtPosition(draggedQuestionId, targetIndex, zoneType)) {
      toast.error(`Cannot move questions between different types. ${getQuestionType(draggedQuestionId)} questions must stay together.`);
      setDropTarget(null);
      return;
    }

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

  //Get question type (for error message)
  const getQuestionType = (questionId: string): string => {
    if (!exam) return "Question";
    const question = exam.questions.find(q => q.questionId === questionId);
    if (!question) return "Question";
    
    switch(question.type) {
      case "MC": return "Multiple Choice";
      case "TF": return "True/False";
      case "FIB": return "Fill in the Blank";
      case "Essay": return "Essay";
      case "Code": return "Coding";
      default: return "Question";
    }
  };

  //Check if drop zone is in the same type section
  const isInSameTypeSection = (dropZoneKey: string, draggedQuestionId: string): boolean => {
    if (!exam || !draggedQuestionId) return false;
    
    const draggedQuestion = exam.questions.find(q => q.questionId === draggedQuestionId);
    if (!draggedQuestion) return false;
    
    const draggedType = draggedQuestion.type;
    
    //Parse the drop zone key to get the target index
    const [zoneType, indexStr] = dropZoneKey.split('-');
    const targetIndex = parseInt(indexStr);
    
    //See if the target index is within the same type section as the dragged question
    if (zoneType === 'top') {
      if (targetIndex < exam.questions.length) {
        return exam.questions[targetIndex]?.type === draggedType;
      }
      return false;
    } else if (zoneType === 'between') {
      if (targetIndex < exam.questions.length - 1) {
      //Check questions around arethey same type (don't check after because of edge case)
      const currentQuestion = exam.questions[targetIndex];
      return currentQuestion.type === draggedType;
    }
    return false;
    } else if (zoneType === 'bottom') {
      if (exam.questions.length > 0) {
      return exam.questions[exam.questions.length - 1]?.type === draggedType;
    }
    return true; //Empty exam
    } else {
      return false;
    }
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

  // When questions are added they go with the the rest of questions of that type
  const insertQuestionIntoTypeGroup = (questions: any[], newQuestion: any) => {
    const newType = newQuestion.type;

    // Find the last question of the same type
    const lastSameTypeIndex = [...questions]
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => q.type === newType)
      .pop()?.index;

    // If this type already exists, insert after the last one
    if (lastSameTypeIndex !== undefined) {
      return [
        ...questions.slice(0, lastSameTypeIndex + 1),
        newQuestion,
        ...questions.slice(lastSameTypeIndex + 1),
      ];
    }

    // If this type does not exist yet append to the end
    // so we don't disturb the existing exam order
    return [...questions, newQuestion];
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

    const questions = insertQuestionIntoTypeGroup((exam.questions ?? []), newQuestionWithPoints);
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

    let questions = [...(exam.questions ?? [])];
    for (const newQuestion of newExamQuestions) {
      questions = insertQuestionIntoTypeGroup(questions, newQuestion);
    }

    setExam({
      ...exam,
      questions,
      totalPoints: recomputeTotalPoints(questions),
    });

    setDirty(true); //marked as unsaved change
  };

  //Handles the updated exam data if the user selects to add a new question to the exam
  const handleNewQuestionsAdded = async () => {
    if (!exam) return exam;

    const updatedQuestions = [...exam.questions]; //Get the questions from the exam
    const newSubjectsAdded: string[] = [];

    //Go through all the questions
    for (let i = 0; i < updatedQuestions.length; i++) {
      const question = updatedQuestions[i];

      //The questions that are added before saving are given the temporary prefix "temp-"
      //If an unsaved question is found with this prefix, add it to the database
      if (question.questionId.startsWith("temp-")) {
        try {
          const data = {
            stem: question.snapshot?.stem ?? "",
            type: question.type,
            choices: question.snapshot?.choices ?? [],
            answer: question.snapshot?.answer ?? "",
            blankLines: question.snapshot?.blankLines ?? 1,
            subject: question.subject ?? "",
            courseNum: question.courseNum ?? "",
            userID: user?._id ?? "",
            difficulty: question.snapshot?.difficulty ?? 1,
            topics: question.snapshot?.topics ?? [],
          };


          const res = await fetch("/api/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const result: any = await res.json();

          if (res.ok && result.insertedId) {
            updatedQuestions[i] = { ...question, questionId: result.insertedId };
            if (result.newSubjectAdded && result.addedSubject){
              newSubjectsAdded.push(result.addedSubject);
            } 
          }else {
            toast.error(`Failed to save question ?? "Unknown error"}`);
          }
        } catch (e) {
          toast.error("Network error while saving a question to the bank.");
        }
      }
    }

    return {
      ...exam,
      questions: updatedQuestions,
      newSubjectsAdded,
      _id: exam._id,
    };
  };

  //Save exam changes, then apply queued Question Bank ops
  const handleSaveExam = async () => {
    if (!exam) return;

    try {
      setIsSaving(true);
      console.log("Saving exam:", exam);

      const examWithNewQuestions = await handleNewQuestionsAdded();

      if (!examWithNewQuestions) {
        throw new Error("Failed to add new question(s)");
      }

      const questionsWithOrder = examWithNewQuestions.questions.map((q, index) => ({
        ...q,
        order: index + 1
      }));

      const res = await fetch("/api/exams", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: examWithNewQuestions._id,
          title: examWithNewQuestions.title,
          timeLimitMin: examWithNewQuestions.timeLimitMin,
          totalPoints: examWithNewQuestions.totalPoints,
          questions: questionsWithOrder,
          instructionsDoc: examWithNewQuestions.instructionsDoc,
        }),
      });

      const result = await res.json();

      //if save works 
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
            if (examWithNewQuestions.newSubjectsAdded?.length > 0) {
              if (examWithNewQuestions.newSubjectsAdded.length === 1) {
                toast.success(
                  `"${examWithNewQuestions.newSubjectsAdded[0]}" was added to your profile subjects`,
                  { duration: 3000 }
                );
              } else {
                toast.success("New subjects were added to your profile");
              }
            }
            setDirty(false);
            router.push("/past_exams");
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
      <div className="min-h-screen w-full grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] py-10 px-4 font-serif">
        {/* X icon in the top right corner (returns to past exams) */}
        <button
          onClick={handleClose}
          className="fixed right-8 top-6 text-3xl leading-none text-gray-500 hover:text-black"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Buttons */}
        <div className="flex justify-center items-center">
          <div className="fixed top-1/2 -translate-y-1/2 z-40 hidden xl:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg p-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wider">
                Actions
              </h3>
              <div className="flex flex-col gap-2">
                  <button onClick={() => setIsQuestionFormOpen(true)} className="px-2 py-1.5 text-xs btn btn-ghost whitespace-nowrap">
                    + Add New Question
                  </button>
                  <button onClick={() => setIsExistingPickerOpen(true)} className="px-2 py-1.5 text-xs btn btn-ghost whitespace-nowrap">
                    + Add Existing Question
                  </button>
                  <button onClick={() => setIsAnswerKeyOpen(true)} className="px-2 py-1.5 text-xs btn btn-ghost whitespace-nowrap">
                    View Answer Key
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={handleClose}
                    className="px-2 py-1.5 text-xs btn btn-ghost whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSaveExam} disabled={isSaving} className="px-2 py-1.5 text-xs btn btn-primary-blue whitespace-nowrap
                                                                                  disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? "Saving..." : "Save Exam"}
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* Paper outline that goes around the exam content */}
        <div className="flex justify-center">
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
              <div className="text-center font-serif break-words [overflow-wrap:anywhere]">
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
            <p>Drag questions using the handle (☰) to reorder them. A blue box shows where you can place the questions. You can add questions in between, above, or below existing ones. Remember to click "Save Exam" to keep your changes.</p>
          </div>

          {/* Questions */}
          <main className="font-serif">
            <div className="space-y-6">
              {/* Render each question */}
              {exam.questions?.map((q, index) => {
                const prevType = index > 0 ? exam.questions[index - 1].type : null;
                const nextType = index < exam.questions.length - 1 ? exam.questions[index + 1].type : null;
                const isFirstOfType  = prevType !== q.type;
                const isLastOfType = nextType !== q.type;
                const points = q.points ?? 1;
                const isBeingDragged = draggedQuestion === q.questionId;

                //Unique keys for different drop zones
                const topDropZoneKey = `top-${index}`;
                const betweenDropZoneKey = `between-${index}`;

                //Check if this drop zone is valid for the dragged question
                const isTopDropZoneValid = isDragging && draggedQuestion && isInSameTypeSection(topDropZoneKey, draggedQuestion) && wouldActuallyMoveQuestion(topDropZoneKey, draggedQuestion);
                const isBetweenDropZoneValid = isDragging && draggedQuestion && index < exam.questions.length - 1 && isInSameTypeSection(betweenDropZoneKey, draggedQuestion) && wouldActuallyMoveQuestion(betweenDropZoneKey, draggedQuestion);
                const isBottomDropZoneValid = isDragging && draggedQuestion && isInSameTypeSection(`bottom-${exam.questions.length}`, draggedQuestion) &&  wouldActuallyMoveQuestion(`bottom-${exam.questions.length}`, draggedQuestion);

                return (
                  // For each question
                  /* Question Headers */
                  <div key={q.questionId} className="relative group">
                    {isFirstOfType  && (
                        <div className="mt-6 -ml-6">
                          <div className="flex items-center gap-3">
                            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                              {q.type === "MC"
                                ? "Multiple Choice"
                                : q.type === "TF"
                                ? "True/False"
                                : q.type === "FIB"
                                ? "Fill in the Blank"
                                : q.type === "Essay"
                                ? "Essay"
                                : q.type === "Code"
                                ? "Coding"
                                : "Questions"}
                            </span>
                            <div className="h-px flex-1 bg-gray-300"></div>
                          </div>
                        </div>
                    )}

                    {/* Top drop zone - before first question */}
                    {isFirstOfType && (
                      <div
                        onDragOver={(e) => handleDragOver(e, topDropZoneKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, topDropZoneKey)}
                        className={`mt-3 h-5 mb-2 transition-all duration-200 rounded-lg border-2 border-dashed ${
                          dropTarget === topDropZoneKey
                            ? (isTopDropZoneValid 
                              ? 'bg-green-100 border-green-500'
                              : 'bg-red-100 border-red-500')
                            : (isDragging && isTopDropZoneValid)
                            ? 'bg-blue-100 border-blue-500 border-dashed'
                            : 'border-transparent'
                        }`}
                      />
                    )}

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
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-start min-w-0">
                              <div className="flex-1 min-w-0 font-medium leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
                                {q.snapshot?.stem ?? "(Question text)"}
                              </div>

                              {/* Righthand side: points, edit, delete */}
                              <div className="flex items-center gap-2 shrink-0 ml-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-600">Pts</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    className="w-16 rounded border px-2 py-0.5 text-xs text-gray-700"
                                    value={q.points ?? ""}
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
                            <div className="mt-3 space-y-3">
                              {Array.from({ length: q.snapshot?.blankLines ?? 4 }).map((_, idx) => (
                                <div key={idx} className="h-6 w-full" />
                              ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Drop zone between questions */}
                    {index < exam.questions.length - 1 && (
                      <div
                        onDragOver={(e) => handleDragOver(e, betweenDropZoneKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, betweenDropZoneKey)}
                        className={`h-5 mt-3 -mb-2 transition-all duration-200 rounded-lg border-2 border-dashed ${dropTarget === betweenDropZoneKey
                          ? (isBetweenDropZoneValid 
                            ? 'bg-green-100 border-green-500'
                            : 'bg-red-100 border-red-500')
                          : (isDragging && isBetweenDropZoneValid)
                          ? 'bg-blue-100 border-blue-500 border-dashed'
                          : 'border-transparent'
                          }`}
                      />
                    )}
                  </div>
                );
              })}

              {/* Bottom drop zone - after last question */}
              <div
                onDragOver={(e) => handleDragOver(e, `bottom-${exam.questions.length}`)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, `bottom-${exam.questions.length}`)}
                className={`h-5 -mt-3 transition-all duration-200 rounded-lg border-2 border-dashed ${dropTarget === `bottom-${exam.questions.length}`
                  ? (isDragging && draggedQuestion && isInSameTypeSection(`bottom-${exam.questions.length}`, draggedQuestion ) && wouldActuallyMoveQuestion(`bottom-${exam.questions.length}`, draggedQuestion) 
                    ? 'bg-green-100 border-green-500'
                    : 'bg-red-100 border-red-500')
                  : (isDragging && draggedQuestion && isValidDropZone(`bottom-${exam.questions.length}`, draggedQuestion) && isInSameTypeSection(`bottom-${exam.questions.length}`, draggedQuestion) && wouldActuallyMoveQuestion(`bottom-${exam.questions.length}`, draggedQuestion))
                  ? 'bg-blue-100 border-blue-500 border-dashed'
                  : 'border-transparent'
                  }`}
              />
            </div>
          </main>
          
          {/* Bottom Buttons */}
          <div className="flex xl:hidden mt-12 flex-col sm:flex-row justify-between items-center gap-4 font-serif">
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
        </div>
        <ConfirmationModal isOpen={isDeleteConfirmOpen} onClose={closeDeleteConfirm} onConfirm={handleConfirmDeleteQuestion} type="question" isLoading={isDeleting} text={pendingDeleteQuestion?.snapshot?.stem ?? ""} showAlsoDeleteInBank={true} alsoDeleteInBank={alsoDeleteInBank} onAlsoDeleteInBankChange={setAlsoDeleteInBank} />
        <QuestionForm isOpen={isQuestionFormOpen} onClose={handleFormClose} onQuestionAdded={handleQuestionAdded} mode="editExam" />
        <EditQuestionModal isOpen={isEditQuestionFormOpen} onClose={handleEditFormClose} question={editingQuestion} onQuestionUpdated={handleQuestionUpdated} />
        <AddExistingQuestionModal isOpen={isExistingPickerOpen} onClose={() => setIsExistingPickerOpen(false)} onAddSelected={handleExistingQuestionsAdded} excludeIds={new Set((exam.questions ?? []).map(q => q.questionId))} />
        {exam && <AnswerKeyModal isOpen={isAnswerKeyOpen} onClose={() => setIsAnswerKeyOpen(false)} exam={exam} mode="edit" />}
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
      {!isAnswerKeyOpen && 
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
      }
    </Background>
  );
}