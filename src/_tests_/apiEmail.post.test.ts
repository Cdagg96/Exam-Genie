import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/send_email/route";

//Create Mock Email Sending
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({
    data: { id: "mock123" },
    error: null,
  }),
}));

//Mock at module level with hoisted mocks
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockSend,
      };
    },
    default: class {
      emails = {
        send: mockSend,
      };
    },
  };
});

//Helper to construct request body
function makeRequest(body: any) {
  return new NextRequest("http://localhost/api/send_email", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  } as any);
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "test_key_123";
  mockSend.mockClear();
});

//Create test cases
describe("POST /api/send_email", () => {
  it("Success — returns 200 and sends email", async () => {
    const req = makeRequest({
      issueType: "UI/UX Issue",
      message: "Example bug",
    });

    const res = await POST(req);
    const json = await res.json();

    //Expected to pass
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("Missing fields — returns 400", async () => {
    const req = makeRequest({
      issueType: "",
      message: "",
    });

    const res = await POST(req);
    const json = await res.json();

    //Expected faliure with validation
    expect(res.status).toBe(400);
    expect(json.error).toBe("Issue type and message are required");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("No API key — returns 500", async () => {
    delete process.env.RESEND_API_KEY;

    const req = makeRequest({
      issueType: "Functional Bug",
      message: "Something broken",
    });

    //Make POST
    const res = await POST(req);
    const json = await res.json();

    //Expected to fail with no API key
    expect(res.status).toBe(500);
    expect(json.error).toBe("Email service is not configured");
    //Don't send email
    expect(mockSend).not.toHaveBeenCalled();
  });
});