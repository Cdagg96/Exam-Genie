"use client";
import React from "react";
import type { ExamDoc } from "@/components/examForm";
import jsPDF from "jspdf";

//PDF generation function
function generateExamPDF(exam: ExamDoc) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28; //~1 inch margin

  //Set initial y position
  let y = margin;

  //Name field at top left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Name: ________________", margin, y);
  y += 15;

  //Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Department of ${exam.subject}` || "No Department", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(exam.title || "Untitled Exam", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Time: ${exam.timeLimitMin} minutes • Total Points: ${exam.totalPoints}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  //Draw header border
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  //Instructions section
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, pageWidth - (2 * margin), 45, 3, 3, 'FD');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("INSTRUCTIONS", margin + 8, y + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const instructions = [
    "• Answer all questions in the space provided.",
    "• Show your work where applicable. Circle or clearly mark your final answer.",
    "• No unauthorized materials. Calculators allowed unless otherwise stated."
  ];

  instructions.forEach((instruction, index) => {
    doc.text(instruction, margin + 12, y + 18 + (index * 6));
  });

  y += 55; //Move past instructions

  //Questions
  const sortedQuestions = exam.questions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  sortedQuestions.forEach((q, index) => {
    //Check if we need a new page (leave space for question content)
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    const questionNumber = index + 1;
    const points = q.points ?? 1;
    const stem = q.snapshot?.stem ?? "(Question text)";
    
    //Question number and stem with points badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${questionNumber}.`, margin, y);
    
    //Calculate available width for stem (accounting for points badge)
    const pointsText = `${points} pt${points !== 1 ? "s" : ""}`;
    const pointsWidth = doc.getTextWidth(pointsText);
    const availableWidth = pageWidth - (2 * margin) - pointsWidth - 10;
    
    //Split stem text to fit available width
    doc.setFont("helvetica", "normal");
    const splitStem = doc.splitTextToSize(stem, availableWidth);
    doc.text(splitStem, margin + 8, y);
    
    //Points badge (aligned to right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(pointsText, pageWidth - margin - pointsWidth, y);
    
    //Calculate height used by stem and move y position
    const stemHeight = splitStem.length * 5;
    y += Math.max(stemHeight, 8); //Minimum height for single line

    //Type-specific content
    if (q.type === "MC" && q.snapshot?.choices) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      q.snapshot.choices.forEach((choice: any, choiceIndex: number) => {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        
        const choiceLetter = String.fromCharCode(65 + choiceIndex);
        const choiceText = choice.text ?? choice.label ?? "";
        doc.text(`${choiceLetter}. ${choiceText}`, margin + 16, y);
        y += 5;
      });
      y += 4;
    } 
    else if (q.type === "TF") {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Circle one:", margin + 8, y);
      doc.text("True", margin + 40, y);
      doc.text("False", margin + 55, y);
      y += 10;
    } 
    else if (q.type === "Essay") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < blankLines; i++) {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        doc.line(margin + 8, y + 3, pageWidth - margin, y + 3);
        y += 8;
      }
      y += 4;
    } 
    else if (q.type === "Code") {
      if (y > 250) { //Need more space for code box
        doc.addPage();
        y = margin;
      }
      //Code box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 8, y, pageWidth - (2 * margin) - 8, 50, 'F');
      doc.rect(margin + 8, y, pageWidth - (2 * margin) - 8, 50);
      y += 55;
    }

    y += 8; //Space between questions
  });

  //Save the PDF
  const filename = `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "exam"}.pdf`;
  doc.save(filename);
}

export default function ExamPreviewModal({
  open, onClose, exam,
}: { open: boolean; onClose: () => void; exam: ExamDoc | null }) {
  if (!open || !exam) return null;

  const handleDownloadPDF = () => {
    generateExamPDF(exam);
    }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-transparent">
      <div className="relative max-h-[90vh] w-full max-w-[8.5in] rounded-2xl bg-white shadow-2xl overflow-hidden
                      print:static print:max-h-none print:w-[8.5in] print:rounded-none print:shadow-none print:p-10">
          <div className="max-h-[90vh] overflow-y-auto p-8 scroll-stable scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {/* Close (X) */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-3xl leading-none text-gray-500 hover:text-black print:hidden"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="mb-4 flex justify-start">
              <span className="text-sm text-gray-600 font-serif">
                Name: ________________
              </span>
            </div>

            {/* Header */}
            <header className="mb-6 border-b pb-4 text-center font-serif">
              <div className="text-sm text-gray-600">Department of {exam.subject}</div>
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
                            {Array.from({ length: q.snapshot?.blankLines ?? 4 }).map((_, idx) => (
                            <div key={idx} className="h-6 w-full border-b" />
                            ))}
                          </div>
                        )}

                        {q.type === "Code" && (
                          <div className="mt-3 mb-50 space-y-3">
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
                className="rounded-lg border px-3 py-1.5 hover:bg-black hover:text-white"
                onClick={() => window.print()}
              >
                Print
              </button>
              <button onClick={() => handleDownloadPDF()}>
                <svg
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-5 h-5 hover:-translate-y-0.5">
                    <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};