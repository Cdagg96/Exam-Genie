import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "@/components/LoginModal";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

global.fetch = vi.fn();

describe("LoginModal Alerts", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
    vi.mocked(signIn).mockReset();
  });

  it("shows login alert if email or password is missing", async () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Not all login fields are filled out.");
    });
  });

  it("shows register alert if role, email, or password is missing", async () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid email address.");
    });
  });

  it("does not show missing-fields alert if login fields are filled", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "Approved" }),
    } as Response);

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      status: 200,
      url: null,
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "1", email: "test@example.com" }),
    } as Response);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalledWith("Not all login fields are filled out.");
    });

    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "test@example.com",
      password: "password123",
    });
  });

  it("does not show missing-fields alert if register fields are filled", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "User registered successfully" }),
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
    fireEvent.change(screen.getByPlaceholderText("Teaching Subject(s) - Comma Seperated"), {
      target: { value: "Testing, QA" },
    });
    fireEvent.change(screen.getByPlaceholderText("Proof Link"), {
      target: { value: "https://example.com/proof.pdf" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() => {
      expect(toast.error).not.toHaveBeenCalledWith("Not all registration fields are filled out.");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/user", {
      method: "POST",
      body: expect.any(FormData),
    });
  });

  it("hide/unhide the password when the eye icon is clicked", () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");

    const visibilityButton = input.parentElement?.querySelector("button") as HTMLButtonElement;

    fireEvent.click(visibilityButton);
    expect(input.type).toBe("text");

    fireEvent.click(visibilityButton);
    expect(input.type).toBe("password");
  });
});