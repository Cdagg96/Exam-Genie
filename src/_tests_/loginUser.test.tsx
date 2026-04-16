import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

// Mock hot toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
  error: vi.fn(),
  success: vi.fn(),
}));

// Mock next-auth signIn
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

const mockLogin = vi.fn();

// Mock AuthContext
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe("User Login", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
    vi.mocked(signIn).mockReset();
    mockLogin.mockClear();
  });

  it("logs in successfully and shows success alert", async () => {
    const mockUser = { id: 1, email: "test@example.com", role: "teacher" };

    // 1. status check
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "Approved" }),
    } as Response);

    // 2. next-auth signIn
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      status: 200,
      url: null,
    });

    // 3. user details fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    } as Response);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const loginEmailInput = screen.getByPlaceholderText("Email");
    const loginPasswordInput = screen.getByPlaceholderText("Password");

    fireEvent.change(loginEmailInput, {
      target: { value: "test@example.com" },
    });
    fireEvent.change(loginPasswordInput, {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
    });

    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "test@example.com",
      password: "password123",
    });

    expect(mockLogin).toHaveBeenCalledWith(mockUser);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error alert if signIn returns failure", async () => {
    // 1. status check
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "Approved" }),
    } as Response);

    // 2. signIn failure
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: "Invalid credentials.",
      status: 401,
      url: null,
    });

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Login failed. Invalid credentials."
      );
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});