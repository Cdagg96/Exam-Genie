import jsPDF from "jspdf";
import type { ExamDoc } from "@/types/exam";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel,} from "docx";

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
      text: `Department of ${
        exam.subject || "Unknown Subject"
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
            text: `(${points} pt${
              points !== 1 ? "s" : ""
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
          spacing: { after: 200 },
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
