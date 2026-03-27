"use client";

import React, { useRef } from "react";
import type { ExamDoc } from "@/types/exam";

export default function AnswerKeyModal({ isOpen, onClose, exam }: { isOpen: boolean; onClose: () => void; exam: ExamDoc }) {
    if (!isOpen) return null;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    //Scroll to top
    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-transparent">
            <div className="relative max-h-[90vh] w-full max-w-[8.5in] rounded-2xl bg-white shadow-2xl overflow-hidden
                            print:static print:max-h-none print:w-[8.5in] print:rounded-none print:shadow-none print:p-10">
                <div ref={scrollContainerRef} className="max-h-[90vh] overflow-y-auto p-8 scroll-stable scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-3xl leading-none text-gray-500 hover:text-black print:hidden"
                        aria-label="Close"
                    >
                        &times;
                    </button>

                    <div className="mb-4 flex justify-between items-center font-serif">
                        <span></span>
                        <span className="text-4xl text-gray-600 font-medium rounded-lg border border-gray-600 pl-15 pr-2 py-1">
                            /{exam.totalPoints}
                        </span>
                    </div>

                    {/* Header */}
                    <header className="mb-6 border-b pb-4 text-center font-serif">
                        <div className="text-sm text-gray-600">Department of {exam.subject}</div>
                        <h1 className="mt-1 text-2xl font-bold">{exam.title}{" Answer Key"}</h1>
                        <div className=" mt-1 text-sm text-gray-600">{exam.courseNum}</div>
                    </header>

                    {/* Questions */}
                    <main className="font-serif">
                        <ol className="list-decimal space-y-6 pl-6">
                        {exam.questions.map((q, i) => {
                            const points = q.points ?? 1;
                            const prevType = i > 0 ? exam.questions[i - 1].type : null;
                            const showTypeHeader = prevType !== q.type;
                            return (
                                <React.Fragment key={q.questionId}>
                                {/* Show section header */}
                                {showTypeHeader && (
                                    <div className="mb-4 -ml-6">
                                    <div className="flex items-center gap-3 pb-4">
                                        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                                        {q.type === "MC" ? "Multiple Choice" :
                                            q.type === "TF" ? "True/False" :
                                            q.type === "FIB" ? "Fill in the Blank" :
                                                q.type === "Essay" ? "Essay" :
                                                q.type === "Code" ? "Coding" : "Questions"}
                                        </span>
                                        <div className="h-px flex-1 bg-gray-300"></div>
                                    </div>
                                    </div>
                                )}
                                <li
                                    key={q.questionId}
                                    className="print:break-inside-avoid"
                                >
                                    {/* Stem + points badge */}
                                    <div className="mb-2">
                                    <div className="flex items-start justify-between gap-4 text-left">
                                        <div className="font-medium leading-relaxed">
                                        {q.snapshot?.stem ?? "(Question text)"}
                                        </div>
                                        <span className="shrink-0 rounded border px-2 py-0.5 text-xs text-gray-700">
                                        {points} pt{points !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    </div>

                                    {/* Type-specific rendering */}
                                    {q.type === "MC" && (() => {
                                        const correctAnswer = (q.snapshot?.choices ?? []).find((c: any) => c.isCorrect);
                                        const index = (q.snapshot?.choices ?? []).indexOf(correctAnswer);
                                        const correctLetter = correctAnswer ? String.fromCharCode(65 + index) : "N/A";

                                        return (
                                            <div className="mt-2 text-sm">
                                                <span>Answer: </span>
                                                <span className="font-semibold">
                                                    {correctLetter}. {correctAnswer?.text ?? "N/A"}
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    {q.type === "TF" && (() => {
                                        const correct = (q.snapshot?.choices ?? []).find((c: any) => c.isCorrect);

                                        return (
                                            <div className="mt-2 text-sm">
                                                <span>Answer: </span>
                                                <span className="font-semibold">
                                                    {correct?.text ?? "N/A"}
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    {q.type === "FIB" && (
                                        <div className="mt-2 text-sm">
                                            <span>Answer: </span>
                                            <span className="font-semibold">
                                                {q.snapshot?.answer ?? "N/A"}
                                            </span>
                                        </div>
                                    )}

                                    {q.type === "Essay" && (
                                        <div className="mt-2 text-sm">
                                            <span>Sample Answer: </span>
                                            <span className="font-semibold">
                                                {q.snapshot?.answer ?? "N/A"}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {q.type === "Code" && (
                                        <div className="mt-2 text-sm">
                                            <span>Sample Answer: </span>
                                            <span className="font-semibold">
                                                {q.snapshot?.answer ?? "N/A"}
                                            </span>
                                        </div>
                                    )}
                                </li>
                                </React.Fragment>
                            );
                            })}
                        </ol>
                    </main>

                    {/* Footer action */}
                    <div className="mt-8 flex justify-end gap-2 print:hidden">
                        {/* Return to edit exam button */}
                        <button
                            onClick={() => {
                                //Close preview modal
                                onClose();
                            }}
                            className="rounded-lg border px-3 py-1.5 hover:bg-black hover:text-white flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            Return to Edit Exam
                        </button>
                    </div>
                </div>

                {/* Back to Top Button */}
                <button
                    onClick={scrollToTop}
                    className="absolute left-1/2 transform -translate-x-1/2 bottom-4 bg-white border border-gray-300 rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 print:hidden z-10"
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
            </div>
        </div>
    );
}