import jsPDF from "jspdf";
import JSZip from 'jszip';
import type { ExamDoc } from "@/types/exam";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,} from "docx";
import { before } from "node:test";
import { renderTipTap, tiptapToSegments} from "@/components/renderTipTap";
type DownloadFormat = "pdf" | "txt" | "csv" | "docx";

//PDF generation function
export function DownloadExamPDF(exam: ExamDoc) {
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



export function buildExamPlainText(exam: ExamDoc): string {
  const lines: string[] = [];

  // Header
  lines.push(`Department of ${exam.subject || "Unknown Subject"}`);
  lines.push(exam.title || "Untitled Exam");
  lines.push(`Time: ${exam.timeLimitMin} minutes`);
  lines.push(`Total Points: ${exam.totalPoints}`);
  lines.push("Name: ______________________________");
  lines.push("=".repeat(60));
  lines.push("INSTRUCTIONS:");
  lines.push("- Answer all questions in the space provided.");
  lines.push("- Show your work where applicable. Circle your final answer.");
  lines.push("- No unauthorized materials. Calculators allowed unless otherwise stated.");
  lines.push("=".repeat(60));
  lines.push("");

  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const points = q.points ?? 1;
    const stem = q.snapshot?.stem ?? "(Question text)";

    lines.push(`${num}. (${points} pt${points !== 1 ? "s" : ""}) ${stem}`);

    if (q.type === "MC" && q.snapshot?.choices) {
      q.snapshot.choices.forEach((choice: any, i: number) => {
        const letter = String.fromCharCode(65 + i);
        const text = choice.text ?? choice.label ?? "";
        lines.push(`   ${letter}) ${text}`);
      });
      lines.push("");
    } else if (q.type === "TF") {
      lines.push("   [ ] True    [ ] False");
      lines.push("");
    } else if (q.type === "Essay") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < blankLines; i++) {
        lines.push("   _______________________________________________");
      }
      lines.push("");
    } else if (q.type === "Code") {
      lines.push("   // Write your code below:");
      lines.push("   ```");
      lines.push("   ");
      lines.push("   ```");
      lines.push("");
    } else {
      lines.push(""); // just a spacer
    }
  });

  return lines.join("\n");
}


export function DownloadExamTXT(exam: ExamDoc) {
  const content = buildExamPlainText(exam);
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const filename =
    `${exam.title || "exam"}`.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
    ".txt";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}



export async function DownloadExamDOCX(exam: ExamDoc) {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const paragraphs: Paragraph[] = [];

  const instructions = [
    "Answer all questions in the space provided.",
    "Show your work where applicable. Circle or clearly mark your final answer.",
    "No unauthorized materials. Calculators allowed unless otherwise stated.",
  ];

  // Name
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Name: ________________",
          font: "Helvetica",
          size: 22, // 11pt
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Department
  paragraphs.push(
    new Paragraph({
      text: `Department of ${exam.subject || "Unknown Subject"
        }`,
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 100 },
    })
  );

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: exam.title || "Untitled Exam",
          bold: true,
          font: "Helvetica",
          size: 36, // 18pt
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Time + total points
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Time: ${exam.timeLimitMin} minutes • Total Points: ${exam.totalPoints}`,
          font: "Helvetica",
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Instructions heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INSTRUCTIONS",
          bold: true,
          font: "Helvetica",
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Instructions bullets
  instructions.forEach((inst) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${inst}`,
            font: "Helvetica",
            size: 20,
          }),
        ],
        spacing: { after: 50 },
      })
    );
  });

  paragraphs.push(
    new Paragraph({
      text: "",
      spacing: { after: 200 },
    })
  );

  // Questions
  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const points = q.points ?? 1;
    const stem = q.snapshot?.stem ?? "(Question text)";

    // Stem
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${num}. `,
            bold: true,
            font: "Helvetica",
            size: 22,
          }),
          new TextRun({
            text: `(${points} pt${points !== 1 ? "s" : ""
              }) `,
            italics: true,
            font: "Helvetica",
            size: 20,
          }),
          new TextRun({
            text: stem,
            font: "Helvetica",
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // MC
    if (q.type === "MC" && q.snapshot?.choices) {
      q.snapshot.choices.forEach((choice: any, i: number) => {
        const letter = String.fromCharCode(65 + i);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${letter}. `,
                font: "Helvetica",
                size: 20,
              }),
              new TextRun({
                text: choice.text ?? choice.label ?? "",
                font: "Helvetica",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      });
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // TF
    if (q.type === "TF") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Circle one:  [ ] True    [ ] False",
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 800 },
        })
      );
    }

    // Essay
    if (q.type === "Essay") {
      const lines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < lines; i++) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "______________________________________________________",
                font: "Helvetica",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      }
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // Code
    if (q.type === "Code") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "// Write your code below:",
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        })
      );
      for (let i = 0; i < 6; i++) {
        paragraphs.push(
          new Paragraph({
            text: "",
            spacing: { after: 50 },
          })
        );
      }
    }
  });

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);

  const baseTitle =
    (exam.title && exam.title.trim().length > 0
      ? exam.title
      : "exam"
    )
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase() || "exam";

  saveAs(blob, `${baseTitle}.docx`);
}

export function DownloadExamCSV(exam: ExamDoc) {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const rows: string[] = [];

  rows.push([
    "question_number",
    "type",
    "points",
    "stem",
    "choices"
  ].join(","));

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const type = q.type ?? "";
    const points = q.points ?? "";
    const stem = (q.snapshot?.stem ?? "").replace(/"/g, '""');

    let choicesStr = "";
    if (q.type === "MC" && q.snapshot?.choices) {
      const choiceTexts = q.snapshot.choices.map((c: any) =>
        (c.text ?? c.label ?? "").replace(/"/g, '""')
      );
      choicesStr = choiceTexts.join(" | ");
    }

    rows.push([
      num,
      `"${type}"`,
      points,
      `"${stem}"`,
      `"${choicesStr}"`
    ].join(","));
  });

  const blob = new Blob([rows.join("\n")], {
    type: "text/csv;charset=utf-8",
  });

  const filename =
    `${exam.title || "exam"}`.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".csv";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DownloadAnswerKeyPDF(exam: ExamDoc) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  let y = margin;

  // Header that includes exam title + " Answer Key"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${exam.title} Answer Key`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Divider line 
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  // Iterate through each question to display the answers
  sortedQuestions.forEach((q, index) => {
    // Page break
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    // Question number, stem, and points for each question
    const num = index + 1;
    let stem = q.snapshot?.stem ?? "(Question text)";

    // Handle fill in the blank separately first since it has unique formatting
    if (q.type === "FIB") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${num}.`, margin, y);

      const answer = q.snapshot?.answer ?? "N/A";

      let beforeBlank = stem;
      let afterBlank = "";
      let hasBlank = false;

      // Find the underscores representing the blank
      const match = stem.match(/_+/);

      // If underscores found, split the stem
      if (match) {
        hasBlank = true;
        const idx = match.index!;

        // Split stem into before/after blank
        beforeBlank = stem.slice(0, idx);
        afterBlank = stem.slice(idx + match[0].length);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      // If blank found, format accordingly
      if (hasBlank) {
        const answerStyled = ` **${answer}** `; // This makes the answer stand out with asterisks
        const fullStem = beforeBlank + answerStyled + afterBlank; // Combine all parts into one line

        const wrappedStem = doc.splitTextToSize(fullStem, pageWidth - (2 * margin) - 20);

        wrappedStem.forEach((line: string) => {
          if (y > 240) {
            doc.addPage();
            y = margin;
          }

          doc.text(line, margin + 8, y);
          y += 5;
        });

        // Otherwise, put the answer on the next line
      } else {
        const wrappedStem = doc.splitTextToSize(stem, pageWidth - (2 * margin) - 20);

        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(wrappedStem, margin + 8, y);

        const stemHeight = wrappedStem.length * 5;
        y += stemHeight + 4;

        const answerStyled = `**${answer}**`;

        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(answerStyled, margin + 8, y);
      }

      y += 10;
      return;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${num}.`, margin, y);

    // Print the question stem, wrapped if necessary
    doc.setFont("helvetica", "normal");
    const wrappedStem = doc.splitTextToSize(stem, pageWidth - (2 * margin) - 10);

    wrappedStem.forEach((line: string) => {
      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.text(line, margin + 8, y);
      y += 5;
    });

    y += 3;
    doc.setFontSize(10);

    // If multiple choice, find and display the correct letter and answer
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";

      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.text(`${letter}. ${correct ? correct.text : "N/A"}`, margin + 8, y);
      y += 10;
    }

    // If true/false, find and display the correct answer
    else if (q.type === "TF" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);

      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.text(`${correct ? correct.text : "N/A"}`, margin + 8, y);
      y += 10;
    }

    // If essay, display the answer
    else if (q.type === "Essay") {
      const response = q.snapshot.answer ?? "N/A";
      const wrappedResponse = doc.splitTextToSize(response, pageWidth - margin * 2 - 20);

      // Prevent the answer from overflowing the page
      wrappedResponse.forEach((line: string) => {
        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(line, margin + 8, y);
        y += 5;
      });

      y += 6;
    }

    // If code, display the answer
    else if (q.type === "Code") {
      const code = q.snapshot.answer ?? "";
      const wrappedCode = doc.splitTextToSize(code, pageWidth - margin * 2 - 20);

      // Prevent the code from overflowing the page
      wrappedCode.forEach((line: string) => {
        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(line, margin + 8, y);
        y += 5;
      });

      y += 6;
    }

    y += 2; // Small space between questions
  });

  const filename = `${exam.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_answer_key.pdf`; // Filename for answer key PDF

  doc.save(filename); // Handles the rest
}

export function buildAnswerKeyPlainText(exam: ExamDoc): string {
  const lines: string[] = [];

  // Header
  lines.push(`${exam.title || "Untitled Exam"} Answer Key`);
  lines.push("=".repeat(60));
  lines.push("");

  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    let stem = q.snapshot?.stem ?? "(Question text)";
    const answer = q.snapshot?.answer ?? "N/A";

    // Handle fill in the blank separately since it has unique formatting
    if (q.type === "FIB") {
      // If the stem contains underscores, replace them with the answer
      if (stem.includes("_")) {
        stem = stem.replace(/_+/g, `**${answer}**`);
        lines.push(`${num}. ${stem}`);

        // Otherwise, put the answer on the next line
      } else {
        lines.push(`${num}. ${stem}`);
        lines.push(`**${answer}**`);
      }

      lines.push(""); // Add an extra space between questions
      return;
    }

    lines.push(`${num}. ${stem}`);

    // Multiple choice
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";
      lines.push(`${letter}. ${correct ? correct.text : "N/A"}`);
    }

    // True/False
    else if (q.type === "TF") {
      const correct = q.snapshot?.choices.find((c: any) => c.isCorrect);
      lines.push(`${correct ? correct.text : "N/A"}`);
    }

    // Essay and code
    else {
      lines.push(`${q.snapshot?.answer ?? "N/A"}`);
    }

    lines.push(""); // Add an extra space between questions
  });

  return lines.join("\n");
}

export function DownloadAnswerKeyTXT(exam: ExamDoc) {
  const content = buildAnswerKeyPlainText(exam);
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const filename =
    `${exam.title || "exam"}_answer_key`.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
    ".txt";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function DownloadAnswerKeyDOCX(exam: ExamDoc) {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const paragraphs: Paragraph[] = [];

  // Header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${exam.title || "Untitled Exam"} Answer Key`,
          bold: true,
          font: "Helvetica",
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Questions and answers
  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const stem = q.snapshot?.stem ?? "(Question text)";
    const answer = q.snapshot?.answer ?? "N/A";

    if (q.type === "FIB") {
      const hasBlank = stem.includes("_");

      // If underscores found, replace with answer
      if (hasBlank) {
        const answerStyled = `**${answer}**`;
        const stemWithAnswer = stem.replace(/_+/g, answerStyled);

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${num}. `,
                bold: true,
                font: "Helvetica",
                size: 22,
              }),
              new TextRun({
                text: stemWithAnswer,
                font: "Helvetica",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        // No underscores found, put answer on next line
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${num}. `,
                bold: true,
                font: "Helvetica",
                size: 22,
              }),
              new TextRun({
                text: stem,
                font: "Helvetica",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `**${answer}**`,
                font: "Helvetica",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      return; // Move to next question
    }

    // Question stem
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${num}. `,
            bold: true,
            font: "Helvetica",
            size: 22,
          }),
          new TextRun({
            text: stem,
            font: "Helvetica",
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // Multiple choice
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${letter}. ${correct ? correct.text : "N/A"}`,
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      // Extra space after each question
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }

    // True/False
    else if (q.type === "TF") {
      const correct = q.snapshot?.choices.find((c: any) => c.isCorrect);
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${correct ? correct.text : "N/A"}`,
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }

    // Essay and code
    else {
      const answer = q.snapshot?.answer ?? "";
      const lines = answer.replace(/\r\n/g, "\n").split("\n"); // Handle multi-line answers

      lines.forEach((line: string) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: "Helvetica",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      });

      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);

  const baseTitle =
    (exam.title && exam.title.trim().length > 0
      ? exam.title
      : "exam"
    )
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase() || "exam";

  saveAs(blob, `${baseTitle}_answer_key.docx`);
}

export function DownloadAnswerKeyCSV(exam: ExamDoc) {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const rows: string[] = [];

  rows.push([
    "question_number",
    "type",
    "stem",
    "correct_answer"
  ].join(","));

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const type = q.type ?? "";
    const stem = (q.snapshot?.stem ?? "").replace(/"/g, '""');

    let answerStr = "";

    // Multiple choice
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";
      answerStr = `${letter}. ${correct ? correct.text : "N/A"}`;
    }

    // True/False
    else if (q.type === "TF") {
      const correct = q.snapshot?.choices.find((c: any) => c.isCorrect);
      answerStr = `${correct ? correct.text : "N/A"}`;
    }

    // Fill in the blank, essay, code
    else {
      answerStr = q.snapshot?.answer?.replace(/"/g, '""') ?? "N/A";
    }

    // There are a total of 4 columns (question number, type, stem, correct answer)
    rows.push([
      num,
      `"${type}"`,
      `"${stem}"`,
      `"${answerStr}"`
    ].join(","));
  });

  const blob = new Blob([rows.join("\n")], {
    type: "text/csv;charset=utf-8",
  });

  const filename =
    `${exam.title || "exam"}_answer_key`.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".csv";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

//Function to generate PDF Blob for zip downloads
export async function generateExamPDFBlob(exam: ExamDoc): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth(); //210mm
  const pageHeight = doc.internal.pageSize.getHeight(); //297mm
  const margin = 28; //~1 inch margin

  //Set initial y position
  let y = margin;

  //Name field at top left
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Name: ______________________", margin, y);

  //Exam total points at top right
  doc.setFont("helvetica", "bold");
  doc.text(`  /${exam.totalPoints}`, pageWidth - margin, y, {align: "right"});
  y += 15;

  let courseName = "";

  //Display the subject/course number assigned to the test
  if (exam.subject) {
    courseName = exam.courseNum
    ? `${exam.subject} ${exam.courseNum}`
    : `Department of ${exam.subject}`;
  }

  if (courseName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(courseName, pageWidth / 2, y, { align: "center" });
    y += 7;
  }

  //Exam title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(exam.title || "Exam", pageWidth / 2, y, { align: "center" });
  y += 6;

  //Display the time limit
  const minutesText = `Time: ${exam.timeLimitMin} ${exam.timeLimitMin !== 1 ? "minutes" : "minute"}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(minutesText, pageWidth / 2, y, { align: "center" });
  y += 10;

  //Instructions
  const segments = exam.instructionsDoc ? tiptapToSegments(exam.instructionsDoc) : []; //Get instructions in segments
  const instructionsStartPos = y;
  const safeWidth = pageWidth - 2 * margin - 6; //Max width allowed for text so there is no runoff

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const flushLine = (segments: any[]) => {
    if (segments.length === 0) return;

    //Get the entire width of the instructions
    const fullText = segments.map(s => s.text).join("");
    const textWidth = doc.getTextWidth(fullText);

    const xStart = (pageWidth - textWidth) / 2;
    let x = xStart;

    //Draw bullet if the text segment contains one (this is customizable)
    const bullet = segments.find(s => s.bullet);
    if (bullet) {
      doc.text("•", margin, y);
    }

    //Go through each part of the text and write it on the PDF
    segments.forEach(seg => {
      doc.setFont("helvetica", seg.bold ? "bold" : "normal");
      doc.text(seg.text, x, y);
      x += doc.getTextWidth(seg.text);
    });

    y += 5;
  };

  let currentLine: any[] = [];
  let currentWidth = 0;

  //Go through each segment
  segments.forEach(seg => {
    const parts = seg.text.split("\n"); //Split the segment into parts based on paragraphs

    parts.forEach((part, idx) => {
      if (idx > 0) {
        flushLine(currentLine); //Write the current line

        //Reset
        currentLine = [];
        currentWidth = 0;
      }

      const wrapped = doc.splitTextToSize(part, safeWidth); //Wrap long text using jsPDF's built-in function
      
      //Go through each line in the array since it was split to be wrapped
      wrapped.forEach((line: string, wIdx: number) => {
        const isFirstWrappedLine = wIdx === 0;

        let cleanText = line.replace(/^•\s*/, ""); //Remove bullet characters from text

        //Only the first wrapped line keeps the bullet point
        const segForLine = {
          ...seg,
          bullet: isFirstWrappedLine ? seg.bullet : false,
          text: cleanText
        };

        if (wIdx > 0) {
          flushLine(currentLine);
          currentLine = [];
          currentWidth = 0;
        }

        const width = doc.getTextWidth(line);

        if (currentWidth + width > safeWidth) {
          flushLine(currentLine);
          currentLine = [];
          currentWidth = 0;
        }

        currentLine.push(segForLine);
        currentWidth += width;
      });
    });
  });

  flushLine(currentLine); //Write last line

  //Draw box around instructions
  doc.setDrawColor(150, 150, 150);
  doc.rect(margin - 4, instructionsStartPos - 6, pageWidth - margin * 2 + 4, y - instructionsStartPos);

  y += 10;

  //Questions section
  const sortedQuestions = exam.questions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  //Set counters so the headers can be displayed before question of each type
  let mcCount = 0;
  let tfCount = 0;
  let fibCount = 0;
  let codeCount = 0;
  let essayCount = 0;

  function getQuestionHeight(q: any, splitStemLines: number) {
    let height = 0;

    height += Math.max(splitStemLines * 5, 8); //Get question stem height (default to height of 8 if small)

    //Type-specific height
    if (q.type === "MC") {
      height += q.snapshot?.choices?.length * 5 + 4;
    }
    else if (q.type === "TF") {
      height += 10;
    }
    else if (q.type === "FIB") {
      height += 10;
    }
    else if (q.type === "Essay") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      height += blankLines * 8 + 2;
    }
    else if (q.type === "Code") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      height += blankLines * 8 + 2;
    }

    height += 2;

    return height;
  }

  //Go through each question in the exam
  sortedQuestions.forEach((q, index) => {
    const questionNumber = index + 1;
    const points = q.points ?? 1;
    const stem = q.snapshot?.stem ?? "";

    function addSectionHeader(headerName: string, neededHeight: number) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      //Create new page if needed (Add 10 for header height)
      if (y + 10 + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(headerName, margin, y); //Make the header

      const headerWidth = doc.getTextWidth(headerName);

      //Underline the header
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, y + 0.75, margin + headerWidth, y + 0.75);

      y += 6;
    }

    //Get width of the question number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const questionNumberWidth = doc.getTextWidth(`${questionNumber}. `);
    
    //Get width of point values
    const pointsText = `${points} pt${points !== 1 ? "s" : ""}`;
    doc.setFont("helvetica", "italic");
    const pointsTextWidth = doc.getTextWidth(`(${pointsText}) `);

    const stemBeginning = margin + questionNumberWidth + pointsTextWidth;

    doc.setFont("helvetica", "normal");

    //Split stem text to fit available width
    const safeStemWidth = pageWidth - margin - stemBeginning;
    const splitStemLines = doc.splitTextToSize(stem, safeStemWidth); //Puts the split lines into an array
    const neededHeight = getQuestionHeight(q, splitStemLines.length);

    //Add headers for each subsection
    if(q.type === "MC") {
      mcCount++;
      if(mcCount === 1) {
        addSectionHeader("Multiple Choice", neededHeight);
      }
    }
    else if(q.type === "TF") {
      tfCount++;
      if(tfCount === 1) {
        addSectionHeader("True/False", neededHeight);
      }
    }
    else if(q.type === "FIB") {
      fibCount++;
      if(fibCount === 1) {
        addSectionHeader("Fill in the Blank", neededHeight);
      }
    }
    else if(q.type === "Code") {
      codeCount++;
      if(codeCount === 1) {
        addSectionHeader("Code", neededHeight);
      }
    }
    else if(q.type === "Essay") {
      essayCount++;
      if(essayCount === 1) {
        addSectionHeader("Essay", neededHeight);
      }
    }
    
    //Add a new page if there will bot be enough room on current page
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    //Begin with drawing question number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${questionNumber}. `, margin, y);

    //Set the point value next to question number
    doc.setFont("helvetica", "italic");
    doc.text(`(${pointsText}) `, margin + questionNumberWidth, y);

    //Add the actual question stem
    doc.setFont("helvetica", "normal");
    doc.text(splitStemLines, stemBeginning + 1, y);

    y += Math.max(splitStemLines.length * 5, 8); //Move y-value down
    
    //Type-specific content/spacing
    if (q.type === "MC" && q.snapshot?.choices) {
      q.snapshot.choices.forEach((choice: any, choiceIndex: number) => {
        const choiceLetter = String.fromCharCode(65 + choiceIndex);
        const choiceText = choice.text ?? choice.label ?? "";
        doc.text(`${choiceLetter}. ${choiceText}`, margin + 8, y);
        y += 5;
      });
      y += 4;
    }
    else if (q.type === "TF") {
      doc.text("Circle one:", margin + 8, y);
      doc.text("True      False", margin + 30, y);
      y += 10;
    }
    else if (q.type === "FIB") {
      y += 10;
    }
    else if (q.type === "Essay") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < blankLines; i++) {
        doc.setDrawColor(0, 0, 0); //Set line color to black
        doc.line(margin + 8, y + 3, pageWidth - margin, y + 3);
        y += 8;
      }
      y += 2;
    }
    else if (q.type === "Code") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < blankLines; i++) {
        y += 8;
      }
    }
    y += 2;
  });

  return doc.output('blob');
}

//Function to generate Answer Key PDF Blob for zip downloads
export async function generateAnswerKeyPDFBlob(exam: ExamDoc): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  let y = margin;

  // Header that includes exam title + " Answer Key"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${exam.title} Answer Key`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Divider line 
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  const questions = exam.questions; // Grab the questions from the exam

  // Iterate through each question to display the answers
  questions.forEach((q, index) => {
    // Page break
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    // Question number, stem, and points for each question
    const num = index + 1;
    let stem = q.snapshot?.stem ?? "(Question text)";

    // Handle fill in the blank separately first since it has unique formatting
    if (q.type === "FIB") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${num}.`, margin, y);

      const answer = q.snapshot?.answer ?? "N/A";

      let beforeBlank = stem;
      let afterBlank = "";
      let hasBlank = false;

      // Find the underscores representing the blank
      const match = stem.match(/_+/);

      // If underscores found, split the stem
      if (match) {
        hasBlank = true;
        const idx = match.index!;

        // Split stem into before/after blank
        beforeBlank = stem.slice(0, idx);
        afterBlank = stem.slice(idx + match[0].length);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      // If blank found, format accordingly
      if (hasBlank) {
        const answerStyled = ` **${answer}** `; // This makes the answer stand out with asterisks
        const fullStem = beforeBlank + answerStyled + afterBlank; // Combine all parts into one line

        const wrappedStem = doc.splitTextToSize(fullStem, pageWidth - (2 * margin) - 20);

        wrappedStem.forEach((line: string) => {
          if (y > 240) {
            doc.addPage();
            y = margin;
          }

          doc.text(line, margin + 8, y);
          y += 5;
        });

        // Otherwise, put the answer on the next line
      } else {
        const wrappedStem = doc.splitTextToSize(stem, pageWidth - (2 * margin) - 20);

        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(wrappedStem, margin + 8, y);

        const stemHeight = wrappedStem.length * 5;
        y += stemHeight + 4;

        const answerStyled = `**${answer}**`;

        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(answerStyled, margin + 8, y);
      }

      y += 10;
      return;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${num}.`, margin, y);

    // Print the question stem, wrapped if necessary
    doc.setFont("helvetica", "normal");
    const wrappedStem = doc.splitTextToSize(stem, pageWidth - (2 * margin) - 10);

    wrappedStem.forEach((line: string) => {
      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.text(line, margin + 8, y);
      y += 5;
    });

    y += 3;
    doc.setFontSize(10);

    // If multiple choice, find and display the correct letter and answer
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";

      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.text(`${letter}. ${correct ? correct.text : "N/A"}`, margin + 8, y);
      y += 10;
    }

    // If true/false, find and display the correct answer
    else if (q.type === "TF" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);

      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.text(`${correct ? correct.text : "N/A"}`, margin + 8, y);
      y += 10;
    }

    // If essay, display the answer
    else if (q.type === "Essay") {
      const response = q.snapshot.answer ?? "N/A";
      const wrappedResponse = doc.splitTextToSize(response, pageWidth - margin * 2 - 20);

      // Prevent the answer from overflowing the page
      wrappedResponse.forEach((line: string) => {
        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(line, margin + 8, y);
        y += 5;
      });

      y += 6;
    }

    // If code, display the answer
    else if (q.type === "Code") {
      const code = q.snapshot.answer ?? "";
      const wrappedCode = doc.splitTextToSize(code, pageWidth - margin * 2 - 20);

      // Prevent the code from overflowing the page
      wrappedCode.forEach((line: string) => {
        if (y > 240) {
          doc.addPage();
          y = margin;
        }

        doc.text(line, margin + 8, y);
        y += 5;
      });

      y += 6;
    }

    y += 2; // Small space between questions
  });

  return doc.output('blob');
}

//Function to generate Exam Plain Text for zip downloads
export function generateExamPlainText(exam: ExamDoc): string {
  const lines: string[] = [];

  // Header
  lines.push(`Department of ${exam.subject || "Unknown Subject"}`);
  lines.push(exam.title || "Untitled Exam");
  lines.push(`Time: ${exam.timeLimitMin} minutes`);
  lines.push(`Total Points: ${exam.totalPoints}`);
  lines.push("Name: ______________________________");
  lines.push("");
  lines.push("=".repeat(60));
  lines.push("INSTRUCTIONS:");
  lines.push("- Answer all questions in the space provided.");
  lines.push("- Show your work where applicable. Circle your final answer.");
  lines.push("- No unauthorized materials. Calculators allowed unless otherwise stated.");
  lines.push("=".repeat(60));
  lines.push("");

  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const points = q.points ?? 1;
    const stem = q.snapshot?.stem ?? "(Question text)";

    lines.push(`${num}. (${points} pt${points !== 1 ? "s" : ""}) ${stem}`);

    if (q.type === "MC" && q.snapshot?.choices) {
      q.snapshot.choices.forEach((choice: any, i: number) => {
        const letter = String.fromCharCode(65 + i);
        const text = choice.text ?? choice.label ?? "";
        lines.push(`   ${letter}) ${text}`);
      });
      lines.push("");
    } else if (q.type === "TF") {
      lines.push("   [ ] True    [ ] False");
      lines.push("");
    } else if (q.type === "Essay") {
      const blankLines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < blankLines; i++) {
        lines.push("   _______________________________________________");
      }
      lines.push("");
    } else if (q.type === "Code") {
      lines.push("   // Write your code below:");
      lines.push("   ```");
      lines.push("   ");
      lines.push("   ```");
      lines.push("");
    } else {
      lines.push(""); // just a spacer
    }
  });

  return lines.join("\n");
}

//Function to generate Answer Key Plain Text for zip downloads
export function generateAnswerKeyPlainText(exam: ExamDoc): string {
  const lines: string[] = [];

  // Header
  lines.push(`${exam.title || "Untitled Exam"} Answer Key`);
  lines.push("=".repeat(60));
  lines.push("");

  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    let stem = q.snapshot?.stem ?? "(Question text)";
    const answer = q.snapshot?.answer ?? "N/A";

    // Handle fill in the blank separately since it has unique formatting
    if (q.type === "FIB") {
      // If the stem contains underscores, replace them with the answer
      if (stem.includes("_")) {
        stem = stem.replace(/_+/g, `**${answer}**`);
        lines.push(`${num}. ${stem}`);

        // Otherwise, put the answer on the next line
      } else {
        lines.push(`${num}. ${stem}`);
        lines.push(`**${answer}**`);
      }

      lines.push(""); // Add an extra space between questions
      return;
    }

    lines.push(`${num}. ${stem}`);

    // Multiple choice
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";
      lines.push(`${letter}. ${correct ? correct.text : "N/A"}`);
    }

    // True/False
    else if (q.type === "TF") {
      const correct = q.snapshot?.choices.find((c: any) => c.isCorrect);
      lines.push(`${correct ? correct.text : "N/A"}`);
    }

    // Essay and code
    else {
      lines.push(`${q.snapshot?.answer ?? "N/A"}`);
    }

    lines.push(""); // Add an extra space between questions
  });

  return lines.join("\n");
}

//Function to generate Exam CSV for zip downloads
export function generateExamCSVContent(exam: ExamDoc): string {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const rows: string[] = [];

  rows.push([
    "question_number",
    "type",
    "points",
    "stem",
    "choices"
  ].join(","));

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const type = q.type ?? "";
    const points = q.points ?? "";
    const stem = (q.snapshot?.stem ?? "").replace(/"/g, '""');

    let choicesStr = "";
    if (q.type === "MC" && q.snapshot?.choices) {
      const choiceTexts = q.snapshot.choices.map((c: any) =>
        (c.text ?? c.label ?? "").replace(/"/g, '""')
      );
      choicesStr = choiceTexts.join(" | ");
    }

    rows.push([
      num,
      `"${type}"`,
      points,
      `"${stem}"`,
      `"${choicesStr}"`
    ].join(","));
  });

  return rows.join('\n');
}

//Function to generate Answer Key CSV for zip downloads
export function generateAnswerKeyCSVContent(exam: ExamDoc): string {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const rows: string[] = [];

  rows.push([
    "question_number",
    "type",
    "stem",
    "correct_answer"
  ].join(","));

  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const type = q.type ?? "";
    const stem = (q.snapshot?.stem ?? "").replace(/"/g, '""');

    let answerStr = "";

    // Multiple choice
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";
      answerStr = `${letter}. ${correct ? correct.text : "N/A"}`;
    }

    // True/False
    else if (q.type === "TF") {
      const correct = q.snapshot?.choices.find((c: any) => c.isCorrect);
      answerStr = `${correct ? correct.text : "N/A"}`;
    }

    // Fill in the blank, essay, code
    else {
      answerStr = q.snapshot?.answer?.replace(/"/g, '""') ?? "N/A";
    }

    // There are a total of 4 columns (question number, type, stem, correct answer)
    rows.push([
      num,
      `"${type}"`,
      `"${stem}"`,
      `"${answerStr}"`
    ].join(","));
  });

  return rows.join('\n');
}

//Function to generate Exam DOCX Blob for zip downloads
export async function generateExamDOCXBlob(exam: ExamDoc): Promise<Blob> {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const paragraphs: Paragraph[] = [];

  // Name
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Name: ________________",
          font: "Helvetica",
          size: 22, // 11pt
        }),
        new TextRun({
          text: "\t\t\t\t\t\t\t\t", 
          font: "Helvetica",
          size: 22,
        }),
        new TextRun({
          text: ` /${exam.totalPoints}`,
          font: "Helvetica",
          size: 22,
          bold: true,
        }),

      ],
      spacing: { after: 200 },
    })
  );

  // Department
  paragraphs.push(
    new Paragraph({
      text: `Department of ${exam.subject || "Unknown Subject"
        }`,
      heading: HeadingLevel.HEADING_3,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: exam.title || "Untitled Exam",
          bold: true,
          font: "Helvetica",
          size: 36, // 18pt
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Time + total points
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Time: ${exam.timeLimitMin} minutes • Total Points: ${exam.totalPoints}`,
          font: "Helvetica",
          size: 22,
        }),
        new TextRun({
          text: `\n`,
          font: "Helvetica",
          size: 22,
        }),
        new TextRun({
          text: `_________________________________________________________________________`,
          font: "Helvetica",
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  //Top border of instructions
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "\n",
          font: "Helvetica",
          size: 24,
        }),
      ],
      spacing: { after: 0 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
      indent: { left: 360, right: 360 },
    })
  );

  // Instructions heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INSTRUCTIONS",
          bold: true,
          font: "Helvetica",
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
      indent: { left: 360, right: 360 },
    })
  );

  const instructions = [
    "Answer all questions in the space provided.",
    "Show your work where applicable. Circle or clearly mark your final answer.",
    "No unauthorized materials. Calculators allowed unless otherwise stated.",
  ];

  // Instructions bullets
  instructions.forEach((inst, index) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${inst}`,
            font: "Helvetica",
            size: 20,
          }),
        ],
        spacing: { after: index === instructions.length - 1 ? 100 : 50 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
        indent: { left: 360, right: 360 },
        alignment: AlignmentType.CENTER,
      })
    );
  });

  //Bottom border instruction paragraph
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "",
          font: "Helvetica",
          size: 20,
        }),
      ],
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
      indent: { left: 360, right: 360 },
    })
  );

  // Questions
  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const points = q.points ?? 1;
    const stem = q.snapshot?.stem ?? "(Question text)";
    const prevType = index > 0 ? sortedQuestions[index - 1].type : null;
    const showTypeHeader = prevType !== q.type;

    //Section header if type changes
    if (showTypeHeader) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: q.type === "MC" ? "Multiple Choice" :
                    q.type === "TF" ? "True/False" :
                    q.type === "FIB" ? "Fill in the Blank" :
                    q.type === "Essay" ? "Essay" :
                    q.type === "Code" ? "Coding" : "Questions",
              font: "Helvetica",
              size: 20,
              bold: true,
            }),
          ],
          spacing: { before: 400, after: 100 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
        })
      );
    }

    // Stem
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${num}. `,
            bold: true,
            font: "Helvetica",
            size: 22,
          }),
          new TextRun({
            text: `(${points} pt${points !== 1 ? "s" : ""
              }) `,
            italics: true,
            font: "Helvetica",
            size: 20,
          }),
          new TextRun({
            text: stem,
            font: "Helvetica",
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // MC
    if (q.type === "MC" && q.snapshot?.choices) {
      q.snapshot.choices.forEach((choice: any, i: number) => {
        const letter = String.fromCharCode(65 + i);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${letter}. `,
                font: "Helvetica",
                size: 20,
              }),
              new TextRun({
                text: choice.text ?? choice.label ?? "",
                font: "Helvetica",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      });
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // TF
    if (q.type === "TF") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Circle one:  True    False",
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        })
      );
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // Fill in the Blank
    if (q.type === "FIB") {
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }

    // Essay
    if (q.type === "Essay") {
      const lines = q.snapshot?.blankLines ?? 4;
      for (let i = 0; i < lines; i++) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "_________________________________________________________________________________",
                font: "Helvetica",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      }
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        })
      );
    }

    // Code
    if (q.type === "Code") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Write your code below:",
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { 
            before: 100,
            after: 400,
            line: 1300, 
          },
          border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
          shading: {
            fill: "F5F5F5",
          },
          children: [
            new TextRun({
              text: "\n\n\n",
              font: "Helvetica",
              size: 20,
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return await Packer.toBlob(doc);
}

//Function to generate Answer Key DOCX Blob for zip downloads
export async function generateAnswerKeyDOCXBlob(exam: ExamDoc): Promise<Blob> {
  const sortedQuestions = [...exam.questions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const paragraphs: Paragraph[] = [];

  // Header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${exam.title || "Untitled Exam"} Answer Key`,
          bold: true,
          font: "Helvetica",
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Questions and answers
  sortedQuestions.forEach((q, index) => {
    const num = index + 1;
    const stem = q.snapshot?.stem ?? "(Question text)";
    const answer = q.snapshot?.answer ?? "N/A";

    if (q.type === "FIB") {
      const hasBlank = stem.includes("_");

      // If underscores found, replace with answer
      if (hasBlank) {
        const answerStyled = `**${answer}**`;
        const stemWithAnswer = stem.replace(/_+/g, answerStyled);

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${num}. `,
                bold: true,
                font: "Helvetica",
                size: 22,
              }),
              new TextRun({
                text: stemWithAnswer,
                font: "Helvetica",
                size: 22,
              }),
            ],
            spacing: { after: 50 },
          })
        );

        paragraphs.push(
          new Paragraph({
            text: "",
            spacing: { after: 100 },
          })
        );

        // No underscores found, put answer on next line
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${num}. `,
                bold: true,
                font: "Helvetica",
                size: 22,
              }),
              new TextRun({
                text: stem,
                font: "Helvetica",
                size: 22,
              }),
            ],
            spacing: { after: 50 },
          })
        );

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `**${answer}**`,
                font: "Helvetica",
                size: 22,
              }),
            ],
            spacing: { after: 50 },
          })
        );

        paragraphs.push(
          new Paragraph({
            text: "",
            spacing: { after: 100 },
          })
        );
      }

      return; // Move to next question
    }

    // Question stem
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${num}. `,
            bold: true,
            font: "Helvetica",
            size: 22,
          }),
          new TextRun({
            text: stem,
            font: "Helvetica",
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // Multiple choice
    if (q.type === "MC" && q.snapshot?.choices) {
      const correct = q.snapshot.choices.find((c: any) => c.isCorrect);
      const letter = correct
        ? String.fromCharCode(65 + q.snapshot.choices.indexOf(correct))
        : "N/A";

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${letter}. ${correct ? correct.text : "N/A"}`,
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      // Extra space after each question
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }

    // True/False
    else if (q.type === "TF") {
      const correct = q.snapshot?.choices.find((c: any) => c.isCorrect);
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${correct ? correct.text : "N/A"}`,
              font: "Helvetica",
              size: 20,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }

    // Essay and code
    else {
      const answer = q.snapshot?.answer ?? "";
      const lines = answer.replace(/\r\n/g, "\n").split("\n"); // Handle multi-line answers

      lines.forEach((line: string) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: "Helvetica",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      });

      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { after: 100 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return await Packer.toBlob(doc);
}

//Main function to download exam package
export async function downloadExamPackage(exam: ExamDoc, format: DownloadFormat): Promise<void> {
  try {
    const zip = new JSZip();
    const baseName = (exam.title || "exam").replace(/[^a-z0-9]/gi, '_').toLowerCase();

    let examContent: string | Blob;
    let answerKeyContent: string | Blob;
    let examFilename: string;
    let answerKeyFilename: string;

    //Generate exam and answer key in the selected format
    switch (format) {
      case "txt":
        examContent = generateExamPlainText(exam);
        answerKeyContent = generateAnswerKeyPlainText(exam);
        examFilename = `${baseName}.txt`;
        answerKeyFilename = `${baseName}_answer_key.txt`;
        break;

      case "pdf":
        examContent = await generateExamPDFBlob(exam);
        answerKeyContent = await generateAnswerKeyPDFBlob(exam);
        examFilename = `${baseName}.pdf`;
        answerKeyFilename = `${baseName}_answer_key.pdf`;
        break;

      case "csv":
        examContent = generateExamCSVContent(exam);
        answerKeyContent = generateAnswerKeyCSVContent(exam);
        examFilename = `${baseName}.csv`;
        answerKeyFilename = `${baseName}_answer_key.csv`;
        break;

      case "docx":
        examContent = await generateExamDOCXBlob(exam);
        answerKeyContent = await generateAnswerKeyDOCXBlob(exam);
        examFilename = `${baseName}.docx`;
        answerKeyFilename = `${baseName}_answer_key.docx`;
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    //Add files to ZIP
    zip.file(examFilename, examContent);
    zip.file(answerKeyFilename, answerKeyContent);

    //Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFilename = `${baseName}_${format}_package.zip`;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error creating ZIP package:', error);
    throw error;
  }
}