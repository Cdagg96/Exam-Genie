import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/questions/route";

// Create mocked mongo methods
const { insertOne, updateOne, collection, db, client } = vi.hoisted(() => {
    const insertOne = vi.fn().mockResolvedValue({ insertedId: "test1" });
    const updateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });

    const collection = vi.fn((name: string) => {
        if (name === "questions") {
            return { insertOne };
        }
        if (name === "users") {
            return { updateOne };
        }
        return {};
    });

    const db = { collection } as any;
    const client = { db: vi.fn().mockReturnValue(db) };

    return { insertOne, updateOne, collection, db, client };
});

vi.mock("@/libs/mongo", async () => {
    return { default: Promise.resolve(client as any) };
});

function makeRequest(body: any) {
    return new NextRequest("http://localhost/api/questions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
    } as any);
}

describe("Testing POST (api/questions) with MC only", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("Returns 201 when type is MC and all fields are valid", async () => {
        const req = makeRequest({
            stem: "Testing MC insert",
            type: "MC",
            difficulty: 1,
            topics: ["Testing"],
            courseNum: "CS101",
            userID: "507f1f77bcf86cd799439011",
            choices: [
                { label: "A", text: "a", isCorrect: true },
                { label: "B", text: "b", isCorrect: false },
                { label: "C", text: "c", isCorrect: false },
            ],
            lastUsed: null,
        });

        const response = await POST(req);
        expect(response.status).toBe(201);

        expect(collection).toHaveBeenCalledWith("questions");
        expect(collection).toHaveBeenCalledWith("users");
        expect(insertOne).toHaveBeenCalledTimes(1);
        expect(updateOne).toHaveBeenCalledTimes(1);
    });

    test("Returns 400 when fields are not valid (missing the topics field)", async () => {
        const req = makeRequest({
            stem: "Testing invalid fields",
            type: "MC",
            difficulty: 1,
            userID: "507f1f77bcf86cd799439011",
            choices: [
                { label: "A", text: "a", isCorrect: true },
                { label: "B", text: "b", isCorrect: false },
                { label: "C", text: "c", isCorrect: false },
            ],
            lastUsed: null,
        });

        const response = await POST(req);
        expect(response.status).toBe(400);

        expect(insertOne).not.toHaveBeenCalled();
        expect(updateOne).not.toHaveBeenCalled();
    });
});
