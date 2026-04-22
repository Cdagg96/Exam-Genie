import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";
import toast from "react-hot-toast";

// Mock hot toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
  error: vi.fn(),
  success: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock the AuthContext
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

// Mock next-auth signIn since LoginModal imports it
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("User Registration", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
  });

  it("registers user successfully and shows success alert", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "User registered successfully!" }),
    } as Response);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "teacher@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Institution (School)"), {
      target: { value: "Test University" },
    });
    fireEvent.change(screen.getByPlaceholderText("Department"), {
      target: { value: "Computer Science" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Teaching Subject(s) - Comma Seperated"),
      {
        target: { value: "Testing, QA" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Proof Link"), {
      target: { value: "https://example.com/proof.pdf" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Registration successful! Your account is pending approval. You will receive an email once approved.",
        { duration: 5000 }
      );
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const fetchOptions = fetchCall[1];
    expect(fetchOptions?.body).toBeInstanceOf(FormData);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error alert when registration fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Registration failed." }),
    } as Response);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText("Phone Number"), {
      target: { value: "9876543210" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Institution (School)"), {
      target: { value: "Test University" },
    });
    fireEvent.change(screen.getByPlaceholderText("Department"), {
      target: { value: "Engineering" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Teaching Subject(s) - Comma Seperated"),
      {
        target: { value: "Math" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText("Proof Link"), {
      target: { value: "https://example.com/proof.pdf" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration failed.");
    });
  });
});