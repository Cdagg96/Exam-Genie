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

const mockLogin = vi.fn();

// Mock the AuthContext
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

describe("User Login", () => {
  const mockOnClose = vi.fn();
  

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
    mockLogin.mockClear();
  });

  it("logs in successfully and shows success alert", async () => {
    const mockUser = { id: 1, email: "test@example.com", role: "teacher" };

    // Mock successful backend login response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Get login inputs 
    const loginEmailInput = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const loginPasswordInput = screen.getByPlaceholderText("Password") as HTMLInputElement;

    // Fill out login form
    fireEvent.change(loginEmailInput, { target: { value: "test@example.com" } });
    fireEvent.change(loginPasswordInput, { target: { value: "password123" } });

    // Click the "Sign In" button
    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInButton);

    // Wait for success alert to appear
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
    });

    
    expect(mockLogin).toHaveBeenCalledWith(mockUser);
    expect(mockOnClose).toHaveBeenCalled();

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith("/api/login", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    }));
  });

  it("shows error alert if backend returns failure", async () => {
    // Mock failed login response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Invalid credentials." }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Get login inputs
    const loginEmailInput = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const loginPasswordInput = screen.getByPlaceholderText("Password") as HTMLInputElement;

    // Fill login form
    fireEvent.change(loginEmailInput, { target: { value: "wrong@example.com" } });
    fireEvent.change(loginPasswordInput, { target: { value: "wrongpass" } });

    // Click the "Sign In" button
    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInButton);

    // Wait for error alert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Login failed.");
    });

    // Verify setLoggedIn and onClose are NOT called
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
