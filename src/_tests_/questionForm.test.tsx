/**
 * File to test question form
 * 
 * Test1 -> Render MC input: when submit is hit fetch is called with correct data payload, shows toast.success, calls onClose()
 * Test2 -> Conditional UI: MC selected shows choices A-C, TF selected shows True/False buttons
 */

import { describe, it, test, expect, vi, beforeEach } from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import toast from "react-hot-toast";

// 1) Define the mock functions inside the mock factory (no outer refs)
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

// Mock fetch (reset per test)
beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

function openModal() {
  const onClose = vi.fn();
  render(<QuestionForm isOpen={true} onClose={onClose} />);
  return onClose;
}

test("MC: submits valid form → posts and shows success toast, closes modal", async () => {
  const user = userEvent.setup();
  const onClose = openModal();

  // Fill the form (defaults type='MC' per component)
  await user.type(screen.getByPlaceholderText(/question/i), "Which starts a comment in C++?");
  await user.clear(screen.getByPlaceholderText(/difficulty/i));
  await user.type(screen.getByPlaceholderText(/difficulty/i), "1");
  await user.type(screen.getByPlaceholderText(/topic/i), "C++ Syntax");

  await user.type(screen.getByPlaceholderText(/choice a/i), "//");
  await user.type(screen.getByPlaceholderText(/choice b/i), "/* */");
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

  // Assert fetch called with expected payload
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

  // success toast + modal closed
  expect((toast as any).success).toHaveBeenCalledWith("Question Created!");
  expect(onClose).toHaveBeenCalled();
});