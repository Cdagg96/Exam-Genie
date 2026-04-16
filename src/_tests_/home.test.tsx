import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import Home from "../app/page";

vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}));

vi.mock("@/components/navbar", () => ({
  default: () => <div>Mock NavBar</div>,
}));

vi.mock("@/components/BackgroundModal", () => ({
  Background: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/useTheme", () => ({
  default: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

describe("Home Page", () => {
  test("renders welcome step by default", () => {
    render(<Home />);

    expect(screen.getByText("Exam Genie")).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to Exam Genie, a tool designed for professors/i)
    ).toBeInTheDocument();
  });

  test("clicking Manage Questions tab shows its description and link", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "Manage Questions" }));

    expect(
      screen.getByText(/Create, edit, and organize your question bank/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /go to questions page/i })
    ).toHaveAttribute("href", "/data_view");
  });

  test("Next button advances to the next tutorial step", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(
      screen.getByText(/Create, edit, and organize your question bank/i)
    ).toBeInTheDocument();
  });

  test("Back button returns to previous step", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(
      screen.getByText(/Welcome to Exam Genie, a tool designed for professors/i)
    ).toBeInTheDocument();
  });
});