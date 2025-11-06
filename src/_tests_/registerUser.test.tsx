import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";

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
  const mockSetLoggedIn = vi.fn();

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

    // Select "Teacher" role
    const teacherButton = screen.getByRole("button", { name: /Teacher/i });
    fireEvent.click(teacherButton);

    // Fill out registration inputs
    const inputs = screen.getAllByPlaceholderText(/Email|Password/);
    const registerEmailInput = inputs[2] as HTMLInputElement;
    const registerPasswordInput = inputs[3] as HTMLInputElement;

    fireEvent.change(registerEmailInput, { target: { value: "teacher@example.com" } });
    fireEvent.change(registerPasswordInput, { target: { value: "password123" } });

    // Click the "Register" button
    const registerButtons = screen.getAllByRole("button", { name: /Register/i });
    const registerButton = registerButtons[registerButtons.length - 1];
    fireEvent.click(registerButton);

    // Wait for success alert to appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Success! User registered successfully!"
      );
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

    // Select "Student" role
    const studentButton = screen.getByRole("button", { name: /Student/i });
    fireEvent.click(studentButton);

    // Fill out registration inputs
    const inputs = screen.getAllByPlaceholderText(/Email|Password/);
    const registerEmailInput = inputs[2] as HTMLInputElement;
    const registerPasswordInput = inputs[3] as HTMLInputElement;

    fireEvent.change(registerEmailInput, { target: { value: "student@example.com" } });
    fireEvent.change(registerPasswordInput, { target: { value: "password123" } });

    // Click the "Register" button
    const registerButtons = screen.getAllByRole("button", { name: /Register/i });
    const registerButton = registerButtons[registerButtons.length - 1];
    fireEvent.click(registerButton);

    // Wait for error alert to appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Error! Registration failed."
      );
    });
  });
});

