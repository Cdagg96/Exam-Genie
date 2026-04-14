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

describe("User Registration", async () => {
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

    // Fill out registration inputs
    const firstNameInput = screen.getByPlaceholderText("First Name");
    const lastNameInput = screen.getByPlaceholderText("Last Name");
    const phoneInput = screen.getByPlaceholderText("Phone Number");
    const registerEmailInput = screen.getByPlaceholderText("Email");
    const registerPasswordInput = screen.getByPlaceholderText("Password");
    const proofLinkInput = screen.getByPlaceholderText("Proof Link");

    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });
    fireEvent.change(registerEmailInput, { target: { value: "teacher@example.com" } });
    fireEvent.change(registerPasswordInput, { target: { value: "password123" } });
    fireEvent.change(proofLinkInput, { target: { value: "https://example.com/proof.pdf" } });

    // Click the "Register" button
    const registerButton = screen.getByRole("button", { name: /Register/i });
    fireEvent.click(registerButton);

    // Wait for success alert to appear
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Registration successful! Signing you in...");
    });

    // Verify that fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user",
      expect.objectContaining({
        method: "POST",
      })
    );
    // Get the actual fetch call arguments
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchOptions = fetchCall[1];

    // Check it's FormData
    expect(fetchOptions?.body).toBeInstanceOf(FormData)
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

    // Fill out registration inputs
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Jane" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "Smith" } });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByPlaceholderText("Proof Link"), { target: { value: "https://example.com/proof.pdf" } });

    // Click the "Register" button
    const registerButton = screen.getByRole("button", { name: /Register/i });
    fireEvent.click(registerButton);

    // Wait for error alert to appear
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration failed.");
    });
  });
});

