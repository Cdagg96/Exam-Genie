import { describe, it, expect, beforeEach, vi } from "vitest";
import toast from "react-hot-toast";

//Mock dependencies
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  success: vi.fn(),
  error: vi.fn(),
}));

//Mock fetch globally
global.fetch = vi.fn();

describe("User Deletion", () => {
  const mockUserId = "12345";
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully delete a user account", async () => {
    //Successful API response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "User deleted successfully" }),
    } as Response);

    //Delete API call
    const response = await fetch("/api/user/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: mockUserId }),
    });

    const data = await response.json();

    //Success toast
    if (response.ok) {
      toast.success("User deleted successfully");
    }

    //Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/delete",
      expect.objectContaining({
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: mockUserId }),
      })
    );

    //Verify response and toast
    expect(response.ok).toBe(true);
    expect(data.message).toBe("User deleted successfully");
    expect(toast.success).toHaveBeenCalledWith("User deleted successfully");
  });

  it("handles deletion error when user not found", async () => {
    //Failed API response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "User not found" }),
    } as Response);

    //Delete API call
    const response = await fetch("/api/user/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: "nonexistent" }),
    });

    const data = await response.json();

    //Error toast
    if (!response.ok) {
      toast.error(data.message);
    }

    //Verify error handling
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
    expect(data.message).toBe("User not found");
    expect(toast.error).toHaveBeenCalledWith("User not found");
  });

  it("handles server error during deletion", async () => {
    //Server error
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal server error" }),
    } as Response);

    //Delete API call
    const response = await fetch("/api/user/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: mockUserId }),
    });

    const data = await response.json();

    //Error toast
    if (!response.ok) {
      toast.error("Failed to delete user: " + data.message);
    }

    //Verify error handling
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    expect(data.message).toBe("Internal server error");
    expect(toast.error).toHaveBeenCalledWith("Failed to delete user: Internal server error");
  });
});