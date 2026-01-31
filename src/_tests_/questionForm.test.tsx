/**
 * File to test question form
 * 
 * Test1 -> Render MC input: when submit is hit fetch is called with correct data payload, shows toast.success, calls onClose()
 * Test2 -> Conditional UI: TF selected shows True/False buttons and returns 401 with toast.error
 */

import { describe, it, test, expect, vi, beforeEach } from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import toast from "react-hot-toast";

// Define the mock functions
vi.mock("react-hot-toast", () => {
  return {
    default: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

// Import after the mock
import QuestionForm from "../components/QuestionForm";
import { AuthProvider } from "../components/AuthContext"; 

// Mock fetch
beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

function openModal() {
  const onClose = vi.fn();
  render(<QuestionForm isOpen={true} onClose={onClose} />, {
    wrapper: AuthWrapper 
  });
  return onClose;
}

// 1. Test for question form component
test("MC: submits valid form → posts and shows success toast, closes modal", async () => {
  const user = userEvent.setup();
  const onClose = openModal();

  // Fill the form (defaults type='MC' per component)
  await user.type(screen.getByPlaceholderText(/question/i), "Which starts a comment in C++?");
  await user.clear(screen.getByPlaceholderText(/difficulty/i));
  await user.type(screen.getByPlaceholderText(/difficulty/i), "1");
  await user.type(screen.getByPlaceholderText(/topic/i), "C++ Syntax");
  await user.type(screen.getByPlaceholderText(/subject/i), "Computer Science");
  await user.type(screen.getByPlaceholderText(/Course Number/i), "CS2401");

  await user.type(screen.getByPlaceholderText(/choice a/i), "//");
  await user.type(screen.getByPlaceholderText(/choice b/i), "/* */");

  // Click "Add Choice" button to add a third choice
  await user.click(screen.getByRole("button", { name: /\+ Add Choice/i }));
  
  // Now fill the third choice (it should be Choice C)
  await user.type(screen.getByPlaceholderText(/choice c/i), "#");
  
  // choose correct answer A
  await user.selectOptions(screen.getByRole("combobox", { name: /correct answer/i }), "A");

  // mock successful POST
  (global.fetch as any).mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ insertedId: "abc123" }),
  });

  // Submit
  await user.click(screen.getByRole("button", { name: /add question/i }));

  // Check that fetch called with expected payload
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url, opts] = (global.fetch as any).mock.calls[0];
  expect(String(url)).toMatch(/\/api\/questions$/);
  const sent = JSON.parse(opts.body);
  expect(sent).toMatchObject({
    stem: expect.any(String),
    type: "MC",
    difficulty: 1,
    topics: ["C++ Syntax"],
  });
  expect(sent.choices).toEqual([
    { label: "A", text: "//", isCorrect: true },
    { label: "B", text: "/* */", isCorrect: false },
    { label: "C", text: "#", isCorrect: false },
  ]);

  // Check that toast.success and onClose is called
  expect((toast as any).success).toHaveBeenCalledWith("Question Created!");
  expect(onClose).toHaveBeenCalled();
});

test("TF: true/false buttons should appear and submitting should return 401 with error toast", async () => {
  const user = userEvent.setup();
  const onClose = openModal();

  // Set type to TF
  const typeCombo = screen.getByText(/multiple choice/i);
  await user.click(typeCombo);
  await user.click(screen.getByText("True/False"));
  // True/False buttons should appear
  const trueB = screen.getByRole("button", {name: "True"});
  const falseB = screen.getByRole("button", {name: "False"});
  expect(trueB).toBeInTheDocument();
  expect(falseB).toBeInTheDocument();

  // Fill the rest of the form
  await user.type(screen.getByPlaceholderText(/question/i), "Which starts a comment in C++?");
  await user.clear(screen.getByPlaceholderText(/difficulty/i));
  await user.type(screen.getByPlaceholderText(/difficulty/i), "1");
  await user.type(screen.getByPlaceholderText(/topic/i), "C++ Syntax");
  await user.type(screen.getByPlaceholderText(/subject/i), "Computer Science");
  await user.type(screen.getByPlaceholderText(/Course Number/i), "CS2401");

  // choose correct answer A
  await user.click(trueB);

  // mock error 401 from POST
  (global.fetch as any).mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ error: "Please choose multiple choice type" }),
  });

  // Submit
  await user.click(screen.getByRole("button", { name: /add question/i }));

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect((toast as any).error).toHaveBeenCalledWith("Please choose multiple choice type");
  expect(onClose).toHaveBeenCalledTimes(0); // Doesn't close the popup
});