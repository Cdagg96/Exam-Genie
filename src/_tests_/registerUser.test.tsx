import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";
import toast from "react-hot-toast";

//Mock hot toast
vi.mock("react-hot-toast", () => {
  return {
    default: {
      error: vi.fn(),
      success: vi.fn(),
    },
    error: vi.fn(),
    success: vi.fn(),
  };
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock the AuthContext
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn()
  })
}));

describe("User Registration", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
  });

  it("registers user successfully and shows success alert", async () => {
    // Mock a successful backend response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "User registered successfully!" }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    // Select "Teacher" role
    const teacherButton = screen.getByLabelText("Teacher") as HTMLInputElement;
    fireEvent.click(teacherButton);

    // Fill out registration inputs
    const registerEmailInput = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const registerPasswordInput = screen.getByPlaceholderText("Password") as HTMLInputElement;
    
    fireEvent.change(registerEmailInput, { target: { value: "teacher@example.com" } });
    fireEvent.change(registerPasswordInput, { target: { value: "password123" } });

    // Click the "Register" button
    const registerButton = screen.getByRole("button", { name: /Register/i });
    fireEvent.click(registerButton);

    // Wait for success alert to appear
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registration successful! Signing you in...");
    });

    // Verify that fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith("/api/user", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "teacher",
        email: "teacher@example.com",
        password: "password123",
      }),
    }));
  });

  it("shows error alert when registration fails", async () => {
    // Mock failed response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Registration failed." }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    // Select "Student" role
    const studentButton = screen.getByLabelText("Student") as HTMLInputElement;
    fireEvent.click(studentButton);

    // Fill out registration inputs
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });

    // Click the "Register" button
    const registerButton = screen.getByRole("button", { name: /Register/i });
    fireEvent.click(registerButton);

    // Wait for error alert to appear
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration failed.");
    });
  });
});

