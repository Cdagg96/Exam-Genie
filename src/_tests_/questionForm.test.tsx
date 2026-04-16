import { test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import toast from "react-hot-toast";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    user: { _id: "507f1f77bcf86cd799439011" },
  }),
}));

import QuestionForm from "@/components/QuestionForm";

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

function openModal() {
  const onClose = vi.fn();
  render(<QuestionForm isOpen={true} onClose={onClose} />);
  return onClose;
}

test("MC: submits valid form, posts expected payload, shows success toast, closes modal", async () => {
  const user = userEvent.setup();

  // First two fetches are from useEffect for subjects and course numbers
  vi.mocked(global.fetch)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, subjects: [] }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, courseNumbers: [] }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ insertedId: "abc123", newSubjectAdded: false }),
    } as Response);

  const onClose = openModal();

  await user.type(screen.getByPlaceholderText(/question/i), "Which starts a comment in C++?");
  await user.clear(screen.getByPlaceholderText(/difficulty/i));
  await user.type(screen.getByPlaceholderText(/difficulty/i), "1");
  await user.type(screen.getByPlaceholderText(/topic/i), "C++ Syntax");
  await user.type(screen.getByPlaceholderText(/type or select subject/i), "Computer Science");
  await user.type(screen.getByPlaceholderText(/type or select course number/i), "CS2401");

  const choiceA = screen.getByPlaceholderText("Choice A");
  const choiceB = screen.getByPlaceholderText("Choice B");
  const choiceC = screen.getByPlaceholderText("Choice C");
  const choiceD = screen.getByPlaceholderText("Choice D");

  await user.type(choiceA, "//");
  await user.type(choiceB, "/* */");
  await user.type(choiceC, "#");
  await user.type(choiceD, "--");

  await user.selectOptions(screen.getByRole("combobox"), "A");

  await user.click(screen.getByRole("button", { name: /add question/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  const submitCall = vi.mocked(global.fetch).mock.calls[2];
  const [url, opts] = submitCall;

  expect(String(url)).toMatch(/\.\.\/api\/questions$/);

  const sent = JSON.parse((opts as RequestInit).body as string);
  expect(sent).toMatchObject({
    stem: "Which starts a comment in C++?",
    type: "MC",
    difficulty: 1,
    topics: ["C++ Syntax"],
    subject: "Computer Science",
    courseNum: "CS2401",
    userID: "507f1f77bcf86cd799439011",
    points: 1,
    lastUsed: null,
  });

  expect(sent.choices).toEqual([
    { label: "A", text: "//", isCorrect: true },
    { label: "B", text: "/* */", isCorrect: false },
    { label: "C", text: "#", isCorrect: false },
    { label: "D", text: "--", isCorrect: false },
  ]);

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith("Question added to question bank");
  });

  expect(onClose).toHaveBeenCalled();
});

test("TF: true/false buttons appear and failed submit shows generic error toast", async () => {
  const user = userEvent.setup();

  vi.mocked(global.fetch)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, subjects: [] }),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, courseNumbers: [] }),
    } as Response)
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Please choose multiple choice type" }),
    } as Response);

  openModal();

  // Open type dropdown and switch to TF
  await user.click(screen.getByText(/multiple choice/i));
  await user.click(screen.getByText("True/False"));

  const trueButton = screen.getByRole("button", { name: "True" });
  const falseButton = screen.getByRole("button", { name: "False" });

  expect(trueButton).toBeInTheDocument();
  expect(falseButton).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/question/i), "C++ comments start with //.");
  await user.clear(screen.getByPlaceholderText(/difficulty/i));
  await user.type(screen.getByPlaceholderText(/difficulty/i), "1");
  await user.type(screen.getByPlaceholderText(/topic/i), "C++ Syntax");
  await user.type(screen.getByPlaceholderText(/type or select subject/i), "Computer Science");
  await user.type(screen.getByPlaceholderText(/type or select course number/i), "CS2401");

  await user.click(trueButton);
  await user.click(screen.getByRole("button", { name: /add question/i }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Failed to create question");
  });
});