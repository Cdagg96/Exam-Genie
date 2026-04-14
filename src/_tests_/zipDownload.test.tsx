/**
 * File to test the ZIP download functionality
 *
 * Test1 -> downloadExamPackage creates a ZIP file with correct filenames
 * Test2 -> ZIP contains both exam and answer key files
 * Test3 -> Different formats (PDF, TXT, CSV, DOCX) generate correct content
 * Test4 -> ZIP download handles errors gracefully with fallback
 * Test5 -> ZIP filename is generated correctly from exam title
 * Test6 -> Empty exam title still generates valid ZIP
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import JSZip from "jszip";
import { ExamDoc } from "@/types/exam";
import { 
  downloadExamPackage, 
  generateExamPlainText,
  generateAnswerKeyPlainText,
  generateExamCSVContent,
  generateAnswerKeyCSVContent,
} from "../components/ExamDownload";

//Mock JSZip
vi.mock("jszip", () => {
  const MockJSZip = vi.fn();
  MockJSZip.prototype.file = vi.fn();
  MockJSZip.prototype.generateAsync = vi.fn(() => 
    Promise.resolve(new Blob(["mock ZIP content"], { type: 'application/zip' }))
  );
  return { default: MockJSZip };
});

global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

const mockAnchor = {
  href: "",
  download: "",
  click: vi.fn(),
};

global.document.createElement = vi.fn(() => mockAnchor as any);
global.document.body.appendChild = vi.fn(() => mockAnchor as any);
global.document.body.removeChild = vi.fn();

//Mock helper functions
vi.mock("../components/ExamDownload", async () => {
  const actual = await vi.importActual("../components/ExamDownload");
  return {
    ...actual as any,
    generateExamPDFBlob: vi.fn(() => Promise.resolve(new Blob(["mock PDF"], { type: 'application/pdf' }))),
    generateAnswerKeyPDFBlob: vi.fn(() => Promise.resolve(new Blob(["mock answer PDF"], { type: 'application/pdf' }))),
    generateExamDOCXBlob: vi.fn(() => Promise.resolve(new Blob(["mock DOCX"], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))),
    generateAnswerKeyDOCXBlob: vi.fn(() => Promise.resolve(new Blob(["mock answer DOCX"], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))),
  };
});

describe("ZIP Download Functionality Tests", () => {
  let mockExam: ExamDoc;

  beforeEach(() => {
    //Reset all mocks
    vi.clearAllMocks();
    
    //Reset  anchor mock
    mockAnchor.href = "";
    mockAnchor.download = "";
    mockAnchor.click.mockClear();
    
    //Mock exam for testing
    mockExam = {
      _id: "test-exam-123",
      title: "Computer Science Midterm",
      subject: "Computer Science",
      courseNum: "CS101",
      difficulty: "medium",
      totalPoints: 50,
      timeLimitMin: 60,
      createdAt: new Date().toISOString(),
      questions: [
        {
          _id: "q1",
          type: "MC" as const,
          points: 10,
          order: 1,
          snapshot: {
            stem: "What is the capital of France?",
            choices: [
              { text: "London", isCorrect: false },
              { text: "Paris", isCorrect: true },
              { text: "Berlin", isCorrect: false },
              { text: "Madrid", isCorrect: false },
            ],
          },
        },
        {
          _id: "q2",
          type: "FIB" as const,
          points: 5,
          order: 2,
          snapshot: {
            stem: "The process of finding errors in code is called _____.",
            answer: "debugging",
          },
        },
        {
          _id: "q3",
          type: "TF" as const,
          points: 5,
          order: 3,
          snapshot: {
            stem: "JavaScript is a compiled language.",
            choices: [
              { text: "True", isCorrect: false },
              { text: "False", isCorrect: true },
            ],
          },
        },
      ],
    };
  });

  // 1. Test if downloadExamPackage creates a ZIP file with correct filenames
  test("downloadExamPackage creates ZIP with correct filenames for PDF format", async () => {
    await downloadExamPackage(mockExam, "pdf");

    //Get the JSZip
    const JSZipInstance = (JSZip as any).mock.instances[0];
    
    //Check that files were added with correct names
    expect(JSZipInstance.file).toHaveBeenCalledWith(
      "computer_science_midterm.pdf",
      expect.any(Blob)
    );
    expect(JSZipInstance.file).toHaveBeenCalledWith(
      "computer_science_midterm_answer_key.pdf",
      expect.any(Blob)
    );
    //Check that ZIP was generated
    expect(JSZipInstance.generateAsync).toHaveBeenCalledWith({ type: 'blob' });
    
    //Check that download was triggered
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.download).toBe("computer_science_midterm_pdf_package.zip");
  });

  // 2. Test if ZIP contains both exam and answer key files
  test("ZIP contains both exam and answer key files for all formats", async () => {
    const formats: Array<"pdf" | "txt" | "csv" | "docx"> = ["pdf", "txt", "csv", "docx"];
    
    for (const format of formats) {
      await downloadExamPackage(mockExam, format);
      
      //Get the JSZip 
      const JSZipInstance = (JSZip as any).mock.instances[(JSZip as any).mock.instances.length - 1];
      
      //Should have called file() twice (once for exam, once for answer key)
      expect(JSZipInstance.file).toHaveBeenCalledTimes(2);
      
      //Reset mock for next iteration
      vi.clearAllMocks();
      (JSZip as any).mockClear();
    }
  });

  // 3. Test different formats generate correct content
  test("TXT format generates correct plain text content", () => {
    const examText = generateExamPlainText(mockExam);
    const answerKeyText = generateAnswerKeyPlainText(mockExam);
    
    //Check  exam title
    expect(examText).toContain("Computer Science Midterm");
    expect(answerKeyText).toContain("Computer Science Midterm Answer Key");
    
    //Check questions
    expect(examText).toContain("What is the capital of France?");
    expect(answerKeyText).toContain("What is the capital of France?");
    
    //Check that FIB questions are handled correctly
    expect(answerKeyText).toContain("debugging");
  });

  test("CSV format generates correct CSV content", () => {
    const examCSV = generateExamCSVContent(mockExam);
    const answerKeyCSV = generateAnswerKeyCSVContent(mockExam);
    
    //Check CSV headers
    expect(examCSV).toContain("question_number,type,points,stem,choices");
    expect(answerKeyCSV).toContain("question_number,type,stem,correct_answer");
    
    //Check that data rows are present
    const examRows = examCSV.split('\n');
    expect(examRows.length).toBeGreaterThan(2); //Header + at least 1 data row
    
    const answerKeyRows = answerKeyCSV.split('\n');
    expect(answerKeyRows.length).toBeGreaterThan(2);
  });

  // 4. Test ZIP download handles errors gracefully
  test("downloadExamPackage handles JSZip errors gracefully", async () => {
    //Mock JSZip generateAsync to throw an error
    const originalGenerateAsync = (JSZip as any).prototype.generateAsync;
    (JSZip as any).prototype.generateAsync = vi.fn(() => 
      Promise.reject(new Error("JSZip generation failed"))
    );
    
    //Check if error is logged
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // This should throw an error
    await expect(downloadExamPackage(mockExam, "pdf")).rejects.toThrow("JSZip generation failed");
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating ZIP package:",
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
    
    //Restore original mock
    (JSZip as any).prototype.generateAsync = originalGenerateAsync;
  });

  // 5. Test ZIP filename is generated correctly from exam title
  test("ZIP filename is correctly generated from exam title", async () => {
    await downloadExamPackage(mockExam, "pdf");
    
    //Check that the ZIP filename was set correctly
    expect(mockAnchor.download).toBe("computer_science_midterm_pdf_package.zip");
  });

  // 6. Test empty exam title still generates valid ZIP
  test("Empty exam title still generates valid ZIP filename", async () => {
    //Create exam with empty title
    const emptyTitleExam = { ...mockExam, title: "" };
    
    await downloadExamPackage(emptyTitleExam, "pdf");
    
    //Should use "exam" as default
    expect(mockAnchor.download).toBe("exam_pdf_package.zip");
  });
});