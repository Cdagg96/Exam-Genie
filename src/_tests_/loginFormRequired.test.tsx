import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";

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
  const mockSetLoggedIn = vi.fn();

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
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Error! Not all login fields are filled out."
      );
    });
  });

  it("shows register alert if role, email, or password is missing", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    //Click the "Register" button
    const registerButtons = screen.getAllByRole("button", { name: /Register/i });
    const registerButton = registerButtons[registerButtons.length - 1];
    fireEvent.click(registerButton);


    fireEvent.click(registerButton);

    //Wait for the alert to appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Error! Not all register fields are filled out."
      );
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

    //Get login inputs (first two inputs are for login)
    const inputs = screen.getAllByPlaceholderText(/Email|Password/);
    const emailInput = inputs[0] as HTMLInputElement;
    const passwordInput = inputs[1] as HTMLInputElement;

    const signInButton = screen.getByText("Sign In");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(signInButton);

    //Check that the "Not all fields" alert is NOT shown
    await waitFor(() => {
      const alert = screen.queryByText("Not all login fields are filled out.");
      expect(alert).toBeNull();
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

    //Select role
    const teacherButton = screen.getByText("Teacher");
    fireEvent.click(teacherButton);

    //Get register inputs (inputs[2] and inputs[3] are for register section)
    const inputs = screen.getAllByPlaceholderText(/Email|Password/);
    const registerEmailInput = inputs[2] as HTMLInputElement;
    const registerPasswordInput = inputs[3] as HTMLInputElement;

    fireEvent.change(registerEmailInput, { target: { value: "teacher@example.com" } });
    fireEvent.change(registerPasswordInput, { target: { value: "password123" } });

    //Get the main register button
    const registerButtons = screen.getAllByRole("button", { name: /Register/i });
    const registerButton = registerButtons[registerButtons.length - 1];

    fireEvent.click(registerButton);

    //Check that alert does not show
    await waitFor(() => {
      const alert = screen.queryByText("Not all register fields are filled out.");
      expect(alert).toBeNull();
    });
  });
});