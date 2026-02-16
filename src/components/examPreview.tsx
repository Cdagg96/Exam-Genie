"use client";
import React, {useState, useRef} from "react";
import type { ExamDoc } from "@/types/exam";
import { DownloadExamTXT, DownloadExamPDF, DownloadExamCSV, DownloadExamDOCX } from "@/components/ExamDownload"
type DownloadFormat = "pdf" | "txt" | "csv" | "docx"; 
export default function ExamPreviewModal({
  open, onClose, exam,
}: { open: boolean; onClose: () => void; exam: ExamDoc | null }) {
  if (!open || !exam) return null;


  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDownloadExam = (format: DownloadFormat) => {
    if (!exam) return;

    if (format === "txt") {
      DownloadExamTXT(exam);
    } else if (format === "pdf") {
      DownloadExamPDF(exam);
    } else if (format === "csv") {
      DownloadExamCSV(exam);
    } else if (format === "docx") {
      DownloadExamDOCX(exam);
    }

    setIsDownloadMenuOpen(false);
  };

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
            {/* Close (X) */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-3xl leading-none text-gray-500 hover:text-black print:hidden"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="mb-4 flex justify-between items-center font-serif">
              <span className="text-sm text-gray-600">
                Name: ________________
              </span>
              <span className="text-4xl text-gray-600 font-medium rounded-lg border border-gray-600 pl-15 pr-2 py-1">
                /{exam.totalPoints}
              </span>
            </div>

            {/* Header */}
            <header className="mb-6 border-b pb-4 text-center font-serif">
              <div className="text-sm text-gray-600">Department of {exam.subject}</div>
              <h1 className="mt-1 text-2xl font-bold">{exam.title}</h1>
              <div className=" mt-1 text-sm text-gray-600">{exam.courseNum}</div>
              <div className="text-[13px] text-gray-600">
                Time: {exam.timeLimitMin} minutes&nbsp;&nbsp;•&nbsp;&nbsp;Total Points: {exam.totalPoints}
              </div>
            </header>

            {/* Instructions */}
            <section className="mb-6 rounded-lg border p-4 text-sm leading-6 print:break-inside-avoid font-serif">
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
                    const prevType = i > 0 ? exam.questions[i-1].type : null;
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
                        {q.type === "MC" && (
                          <ul className="ml-4 list-[upper-alpha] space-y-1 pl-4 text-left pb-4 font-serif">
                            {(q.snapshot?.choices ?? []).map((c: any, idx: number) => (
                              <li key={idx} className="leading-7">
                                {c.text ?? c.label}
                              </li>
                            ))}
                          </ul>
                        )}

                        {q.type === "TF" && (
                          <div className="ml-1 text-[15px] text-left pb-4 font-serif">
                            <span className="mr-4">Circle one:</span>
                            <span className="inline-block px-2 py-0.5 mr-2">True</span>
                            <span className="inline-block px-2 py-0.5">False</span>
                          </div>
                        )}

                        {q.type === "FIB" && (
                          <div className="pb-4"></div>
                        )}

                        {q.type === "Essay" && (
                          <div className="mt-3 space-y-3 pb-4 font-serif">
                            {Array.from({ length: q.snapshot?.blankLines ?? 4 }).map((_, idx) => (
                            <div key={idx} className="h-6 w-full border-b" />
                            ))}
                          </div>
                        )}

                        {q.type === "Code" && (
                          <div className="pb-4 font-serif">
                            <div className="mt-3 border border-gray-300 bg-gray-50 rounded-md font-serif">
                              <div className="h-40" />
                            </div>
                          </div>
                        )}
                      </li>
                      </React.Fragment>
                    );
                  })}
              </ol>
            </main>

            {/* Footer actions */}
            <div className="mt-8 flex justify-end gap-2 print:hidden">
              {/* <button
                className="rounded-lg border px-3 py-1.5 hover:bg-black hover:text-white"
                onClick={() => window.print()}
              >
                Print
              </button> */}
              
              {/* Download menu */}
            <div className="relative">
              <button
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Download exam"
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

              {isDownloadMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-40 rounded-lg border bg-white shadow-lg text-sm z-50 overflow-hidden">
                  <button
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleDownloadExam("pdf")}
                  >
                    Download PDF
                  </button>
                  <button
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleDownloadExam("txt")}
                  >
                    Download TXT
                  </button>
                  <button
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleDownloadExam("docx")}
                  >
                    Download DOCX
                  </button>
                  <button
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleDownloadExam("csv")}
                  >
                    Download CSV
                  </button>
                </div>
              )}
            </div>
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
};