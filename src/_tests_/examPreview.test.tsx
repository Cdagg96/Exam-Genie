import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, test } from "vitest";
import "@testing-library/jest-dom";
import ExamPreviewModal from "@/components/examPreview";
import type { ExamDoc } from "@/types/exam";

// Sample exam 
const sampleExam: ExamDoc = {
  _id: "exam1",
  title: "CS 2400 Midterm",
  subject: "CS",        
  courseNum: "2400",    
  timeLimitMin: 55,
  difficulty: "mixed",
  totalPoints: 10,
  questions: [
    {
      questionId: "q1",
      type: "MC",
      subject: "CS",     
      courseNum: "2400", 
      points: 3,
      order: 1,
      snapshot: {
        stem: "What is 2 + 2?",
        choices: [
          { label: "A", text: "3", isCorrect: false },
          { label: "B", text: "4", isCorrect: true },
        ],
      },
    },
    {
      questionId: "q2",
      type: "TF",
      subject: "CS",
      courseNum: "2400",
      points: 2,
      order: 2,
      snapshot: { stem: "The Earth is flat." },
    },
    {
      questionId: "q3",
      type: "Essay",
      subject: "CS",
      courseNum: "2400",
      points: 5,
      order: 3,
      snapshot: { stem: "Explain Big-O.", blankLines: 6 },
    },
  ],
};

describe("ExamPreviewModal", () => {
  test("does not render when closed or when exam is null", () => {
    const { rerender } = render(
      <ExamPreviewModal open={false} onClose={() => {}} exam={sampleExam} />
    );
    expect(screen.queryByText(/CS 2400 Midterm/i)).not.toBeInTheDocument();

    rerender(<ExamPreviewModal open={true} onClose={() => {}} exam={null} />);
    expect(screen.queryByText(/CS 2400 Midterm/i)).not.toBeInTheDocument();
  });

  test("renders header, metadata, and question stems when open", () => {
    render(<ExamPreviewModal open={true} onClose={() => {}} exam={sampleExam} />);

    // Header/title + metadata
    expect(screen.getByText("CS 2400 Midterm")).toBeInTheDocument();
    expect(screen.getByText(/Time:\s*55 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Points:\s*10/i)).toBeInTheDocument();

    // "Name: ______" field in the top-left corner exists
    expect(screen.getByText(/Name:\s*_{6,}/i)).toBeInTheDocument();

    // Stems
    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    expect(screen.getByText("The Earth is flat.")).toBeInTheDocument();
    expect(screen.getByText("Explain Big-O.")).toBeInTheDocument();
  });

  test("renders MC choices and TF 'True/False' chips", () => {
    render(<ExamPreviewModal open={true} onClose={() => {}} exam={sampleExam} />);

    // MC choices (A/B style text content)
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    // TF chips text present
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    const onClose = vi.fn();
    render(<ExamPreviewModal open={true} onClose={onClose} exam={sampleExam} />);

    // aria-label="Close" on the × button
    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

});
