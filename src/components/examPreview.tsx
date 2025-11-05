"use client";
import React from "react";
import type { ExamDoc } from "@/components/examForm";


export default function ExamPreviewModal({
  open, onClose, exam,
}: { open: boolean; onClose: () => void; exam: ExamDoc | null }) {
  if (!open || !exam) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-transparent">
      <div className="relative max-h-[90vh] w-full max-w-[8.5in] overflow-auto rounded-2xl bg-white p-8 shadow-2xl
                      print:static print:max-h-none print:w-[8.5in] print:rounded-none print:shadow-none print:p-10">
        {/* Close (X) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-3xl leading-none text-gray-500 hover:text-black print:hidden"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <header className="mb-6 border-b pb-4 text-center font-serif">
          <div className="text-sm text-gray-600">Department of Computer Science</div>
          <h1 className="mt-1 text-2xl font-bold">{exam.title}</h1>
          <div className="mt-2 text-[13px] text-gray-600">
            Time: {exam.timeLimitMin} minutes&nbsp;&nbsp;•&nbsp;&nbsp;Total Points: {exam.totalPoints}
          </div>
        </header>

        {/* Instructions */}
        <section className="mb-6 rounded-lg border p-4 text-sm leading-6 print:break-inside-avoid">
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
            {exam.questions
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((q, i) => {
                const points = q.points ?? 1;
                return (
                  <li
                    key={q.questionId}
                    className="print:break-inside-avoid"
                  >
                    {/* Stem + points badge */}
                    <div className="mb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="font-medium leading-relaxed">
                          {q.snapshot?.stem ?? "(Question text)"}
                        </div>
                        <span className="shrink-0 rounded border px-2 py-0.5 text-xs text-gray-700">
                          {points} pt{points !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Type-specific rendering */}
                    {q.type === "MC" && (
                      <ul className="ml-4 list-[upper-alpha] space-y-1 pl-4">
                        {(q.snapshot?.choices ?? []).map((c: any, idx: number) => (
                          <li key={idx} className="leading-7">
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
                        <div className="h-6 w-full border-b" />
                        <div className="h-6 w-full border-b" />
                        <div className="h-6 w-full border-b" />
                        <div className="h-6 w-full border-b" />
                      </div>
                    )}
                  </li>
                );
              })}
          </ol>
        </main>

        {/* Footer actions */}
        <div className="mt-8 flex justify-end gap-2 print:hidden">
          <button
            className="rounded-lg border px-3 py-1.5"
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}