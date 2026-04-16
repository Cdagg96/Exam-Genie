import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, vi, test, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import ExamPreviewModal from "@/components/examPreview";
import type { ExamDoc } from "@/types/exam";

// Mocks
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/components/renderTipTap", () => ({
  renderTipTap: vi.fn(() => <div>Rendered Instructions</div>),
}));

vi.mock("@/components/answerKeyModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Answer Key Modal</div> : null,
}));

vi.mock("@/components/ExamDownload", () => ({
  DownloadExamTXT: vi.fn(),
  DownloadExamPDF: vi.fn(),
  DownloadExamCSV: vi.fn(),
  DownloadExamDOCX: vi.fn(),
  DownloadAnswerKeyPDF: vi.fn(),
  DownloadAnswerKeyTXT: vi.fn(),
  DownloadAnswerKeyDOCX: vi.fn(),
  DownloadAnswerKeyCSV: vi.fn(),
  downloadExamPackage: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    expect(screen.getByText("CS 2400 Midterm")).toBeInTheDocument();
    expect(screen.getByText("Department of CS")).toBeInTheDocument();
    expect(screen.getByText("2400")).toBeInTheDocument();
    expect(screen.getByText(/Time:\s*55 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Points:\s*10/i)).toBeInTheDocument();

    expect(screen.getByText(/Name:/i)).toBeInTheDocument();

    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    expect(screen.getByText("The Earth is flat.")).toBeInTheDocument();
    expect(screen.getByText("Explain Big-O.")).toBeInTheDocument();
  });

  test("renders MC choices and TF true/false text", () => {
    render(<ExamPreviewModal open={true} onClose={() => {}} exam={sampleExam} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByText(/Circle one:/i)).toBeInTheDocument();
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    const onClose = vi.fn();

    render(<ExamPreviewModal open={true} onClose={onClose} exam={sampleExam} />);

    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});