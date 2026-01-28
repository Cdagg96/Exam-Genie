"use client";

import React from "react";
import { useState } from "react";
import type { ExamDoc } from "@/types/exam";
import { DownloadAnswerKeyPDF, DownloadAnswerKeyTXT, DownloadAnswerKeyDOCX, DownloadAnswerKeyCSV } from "@/components/ExamDownload";

export default function AnswerKeyModal({ isOpen, onClose, exam }: { isOpen: boolean; onClose: () => void; exam: ExamDoc }) {
    const [openDownloadMenu, setOpenDownloadMenu] = useState(false);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto relative">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 text-black hover:text-gray-500 text-3xl"
                >
                    &times;
                </button>

                {/* Download answer key button */}
                <div className="absolute top-5 right-12">
                    <button
                        onClick={() => setOpenDownloadMenu(prev => !prev)}
                        className="text-black hover:text-gray-500"
                        aria-label="Download answer key"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 hover:-translate-y-0.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                        </svg>
                    </button>

                    {openDownloadMenu && (
                        <div className="absolute right-0 mt-2 w-36 rounded-lg border bg-white shadow-lg text-sm z-10 overflow-hidden">
                            <button
                                className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                onClick={() => {
                                    DownloadAnswerKeyPDF(exam);
                                    setOpenDownloadMenu(false);
                                }}
                            >
                                Download PDF
                            </button>

                            <button
                                className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                onClick={() => {
                                    DownloadAnswerKeyTXT(exam);
                                    setOpenDownloadMenu(false);
                                }}
                            >
                                Download TXT
                            </button>
                            <button
                                className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                onClick={() => {
                                    DownloadAnswerKeyDOCX(exam);
                                    setOpenDownloadMenu(false);
                                }}
                            >
                                Download DOCX
                            </button>
                            <button
                                className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                onClick={() => {
                                    DownloadAnswerKeyCSV(exam);
                                    setOpenDownloadMenu(false);
                                }}
                            >
                                Download CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* If exam title exists, show it. Otherwise, just default to Answer Key */}
                <h2 className="text-xl font-bold mb-4 justify-center flex">
                    {(exam && exam.title) ? exam.title + " Answer Key" : "Answer Key"}
                </h2>
                
                {/* Go through each question. Display the question number, question stem, and correct answer */}
                {exam.questions.map((q, i) => (
                    <div key={q.questionId}>
                        <p className="font-semibold mb-1">
                            {i + 1}. {q.snapshot.stem}
                        </p>

                        {/* If multiple choice, find the correct answer in the choices array */}
                        {q.type === "MC" && (() => {
                            const correctAnswer = q.snapshot.choices.find((choice: any) => choice.isCorrect);
                            const correctAnswerLetter = correctAnswer ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correctAnswer)) : "N/A";
                            return (
                                <p className="text-gray-700">
                                    {correctAnswerLetter}. {correctAnswer ? correctAnswer.text : "N/A"}
                                </p>
                            );
                        })()}

                        {/* If true/false, find the correct answer in the choices array */}
                        {q.type === "TF" && (() => {
                            const correctAnswer = q.snapshot.choices.find((choice: any) => choice.isCorrect);
                            return (
                                <p className="text-gray-700">
                                    {correctAnswer ? correctAnswer.text : "N/A"}
                                </p>
                            );
                        })()}

                        {/* If fill in the blank, display the answer */}
                        {q.type === "FIB" && (
                            <p className="text-gray-700">
                                {q.snapshot.answer}
                            </p>
                        )}

                        {/* If essay or code, display the answer */}
                        {q.type === "Essay" && (
                            <p className="text-gray-700">
                                {q.snapshot.answer}
                            </p>
                        )}

                        {/* If code, display the answer */}
                        {q.type === "Code" && (
                            <pre className="p-2 bg-gray-100 rounded text-sm">
                                {q.snapshot.answer}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}