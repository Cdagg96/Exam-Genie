import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";
import toast from "react-hot-toast";
import { error } from "console";

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

//Mock fetch globally
global.fetch = vi.fn();

// Mock the AuthContext
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn()
  })
}));

describe("LoginModal Alerts", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
  });

  it("shows login alert if email or password is missing", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    //Click the "Sign In" button without entering fields
    const signInButton = screen.getByText("Sign In");
    fireEvent.click(signInButton);

    //Wait for the alert to appear
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Not all login fields are filled out.");
    });
  });

  it("shows register alert if role, email, or password is missing", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    //Switch to register
    const signUpLink = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpLink);

    //Click the "Register" button without filling anything
    const registerButton = screen.getByRole("button", { name: /^Register$/i });
    fireEvent.click(registerButton);

    //Wait for the alert to appear
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Not all registration fields are filled out.");
    });

  });

  it("does not show alert if login fields are filled", async () => {
    //Mock successful login response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Login successful" }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText("Password") as HTMLInputElement;

    const signInButton = screen.getByText("Sign In");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(signInButton);

    //Check that the "Not all fields" alert is NOT shown
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalledWith("Not all login fields are filled out.");
    });
  });

  it("does not show alert if register fields are filled", async () => {
    //Mock successful registration response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "User registered successfully" }),
    } as Response);

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    //Switch to register
    const signUpLink = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpLink);

    //Select role
    const teacherButton = screen.getByLabelText("Teacher") as HTMLInputElement;
    fireEvent.click(teacherButton);

    //Get register inputs 
    const registerEmailInput = screen.getByPlaceholderText("Email") as HTMLInputElement;
    const registerPasswordInput = screen.getByPlaceholderText("Password") as HTMLInputElement;

    fireEvent.change(registerEmailInput, { target: { value: "teacher@example.com" } });
    fireEvent.change(registerPasswordInput, { target: { value: "password123" } });

    //Get the main register button
    const registerButton = screen.getByRole("button", { name: /Register/i });
    fireEvent.click(registerButton);

    //Check that alert does not show
    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalledWith("Not all registration fields are filled out.");
    });
  });
});