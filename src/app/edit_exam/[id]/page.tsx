"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ExamDoc } from "@/components/examForm";
import QuestionForm from "@/components/QuestionForm";

export default function EditExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  //this is for the question form popup
  const handleFormClose = () => {
    setIsQuestionFormOpen(false);
  };

  // Fetch this specific exam
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/exams?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch exam");
        const data = await res.json();
        setExam(data);
      } catch (err) {
        console.error("Error fetching exam:", err);
        setError(err instanceof Error ? err.message : "Error loading exam");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchExam();
  }, [id]);

  const handleClose = () => router.push("/past_exams"); // Go back to past exams

  // this will add the question to the bottom of current exam
  // it will not save it if the exam is exited without saving 
  const handleQuestionAdded = (newQuestion: any) => {
    if (!exam) return;
    setExam({
      ...exam, // spread previous exam
      questions: [...(exam.questions ?? []), newQuestion], // append at the end
    });
  };

  //Saveing edits to exam
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
        }),
      });

      const result = await res.json();

      //if save workis 
      if (res.ok) {
        const refreshRes = await fetch(`/api/exams?id=${id}`);
        if (refreshRes.ok) {
          const updatedExam = await refreshRes.json();
          setExam(updatedExam);
        }
      } else {
        console.error("Save failed:", result);
      }
    }
    catch (error) {
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
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center py-10 px-4 font-serif">
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
        {/* Name in the top left corner */}
        <div className="mb-4 flex justify-start">
          <span className="text-sm text-gray-600">Name: ________________</span>
        </div>

        {/* Header (always displayed currently) */}
        <header className="mb-6 border-b pb-4 text-center">
          <div className="text-sm text-gray-600">Department of Computer Science</div>
          <h1 className="mt-1 text-2xl font-bold">{exam.title}</h1>
          <div className="mt-2 text-[13px] text-gray-600">
            Time: {exam.timeLimitMin} minutes • Total Points: {exam.totalPoints}
          </div>
        </header>

        {/* Instructions information */}
        <section className="mb-6 text-center rounded-lg border p-4 text-sm leading-6 print:break-inside-avoid">
          <h2 className="mb-1 font-semibold uppercase tracking-wide text-gray-700">Instructions</h2>
          <ul className="list-disc pl-5">
            <li>Answer all questions in the space provided.</li>
            <li>Show your work where applicable. Circle or clearly mark your final answer.</li>
            <li>No unauthorized materials. Calculators allowed unless otherwise stated.</li>
          </ul>
        </section>

        {/* Questions */}
        <main className="font-serif">
          <ol className="list-decimal space-y-6 pl-6">
            {/* Render each question */}
            {exam.questions?.map((q) => {
              const points = q.points ?? 1; // Default to 1 point if points not specified
              return (
                // For each question
                <li key={q.questionId} className="relative group">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="font-medium leading-relaxed">
                      {q.snapshot?.stem ?? "(Question text)"}
                    </div>

                    {/* Righthand side: points, edit, delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded border px-2 py-0.5 text-xs text-gray-700">
                        {points} pt{points !== 1 ? "s" : ""} {/* Make points plural if needed */}
                      </span>
                      <button
                        className="rounded border border-blue-300 text-blue-600 px-2 py-0.5 text-xs hover:bg-blue-50 transition"
                      >
                        Edit
                      </button>
                      <button
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
                </li>
              );
            })}
          </ol>
        </main>

        {/* Bottom Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 font-serif">
          <div className="flex gap-3">
            <button onClick={() => setIsQuestionFormOpen(true)} className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-200 transition">
              + Add New Question
            </button>
            {/* <button className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-200 transition">
              + Add Existing Question
            </button> */}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-200 transition"
            >
              Cancel
            </button>
            <button onClick={handleSaveExam} disabled={isSaving} className="rounded-lg bg-stone-800 px-5 py-2 text-sm text-white shadow hover:opacity-90">
              {isSaving ? "Saving..." : "Save Exam"}
            </button>
          </div>
        </div>
      </div>
      <QuestionForm isOpen={isQuestionFormOpen} onClose={handleFormClose} onQuestionAdded={handleQuestionAdded} />
    </div>
  );
}