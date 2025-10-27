import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";

// Mock fetch globally
global.fetch = vi.fn();

describe("User Login", () => {
  const mockOnClose = vi.fn();
  const mockSetLoggedIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
  });

  it("logs in successfully and shows success alert", async () => {
    // Mock successful backend login response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Login successful!" }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        LoggedIn={false}
        setLoggedIn={mockSetLoggedIn}
        onClose={mockOnClose}
      />
    );

    // Get login inputs (first two are for login section)
    const inputs = screen.getAllByPlaceholderText(/Email|Password/);
    const loginEmailInput = inputs[0] as HTMLInputElement;
    const loginPasswordInput = inputs[1] as HTMLInputElement;

    // Fill out login form
    fireEvent.change(loginEmailInput, { target: { value: "test@example.com" } });
    fireEvent.change(loginPasswordInput, { target: { value: "password123" } });

    // Click the "Sign In" button
    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInButton);

    // Wait for success alert to appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Success! Login successful!");
    });

    // Verify that setLoggedIn and onClose were called
    expect(mockSetLoggedIn).toHaveBeenCalledWith(true);
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
        LoggedIn={false}
        setLoggedIn={mockSetLoggedIn}
        onClose={mockOnClose}
      />
    );

    // Fill login form
    const inputs = screen.getAllByPlaceholderText(/Email|Password/);
    const loginEmailInput = inputs[0] as HTMLInputElement;
    const loginPasswordInput = inputs[1] as HTMLInputElement;

    fireEvent.change(loginEmailInput, { target: { value: "wrong@example.com" } });
    fireEvent.change(loginPasswordInput, { target: { value: "wrongpass" } });

    // Click the "Sign In" button
    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInButton);

    // Wait for error alert
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Error! Invalid credentials.");
    });

    // Verify setLoggedIn and onClose are NOT called
    expect(mockSetLoggedIn).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
