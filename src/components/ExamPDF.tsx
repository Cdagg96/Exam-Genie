import jsPDF from "jspdf";
import type { ExamDoc } from "@/types/exam";

//PDF generation function
export default function generateExamPDF(exam: ExamDoc) {
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