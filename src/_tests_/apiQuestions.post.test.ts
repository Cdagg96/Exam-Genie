import { describe, it, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/questions/route";

// Create a mock mongo db without actually using mongoDB
const {
    insertOne, collection, db, client,
} = vi.hoisted(() => {
    const insertOne = vi.fn().mockResolvedValue({ insertedId: "test1"});
    const collection = vi.fn().mockReturnValue({insertOne});
    const db = {collection} as any;
    const client = {db: vi.fn().mockReturnValue(db)};
    return {insertOne, collection, db, client};
});

vi.mock("@/libs/mongo", async () => {
    const clientPromise = Promise.resolve(client as any);
    return {default: clientPromise};
});

function makeRequest(body: any){
    return new NextRequest("http://localhost/api/questions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {"content-type": "applications/json"},
    } as any);
}

describe("Testing POST (api/questions) with MC only", () => {
    test("Returns 201 when type is MC and all fields are valid", async () => {
        // Create the mock question
        const req = makeRequest({
            stem: "Testing MC insert",
            type: "MC",
            difficulty: 1,
            topics: ["Testing"],
            choices: [
                {label: "A", text: "a", isCorrect: true},
                {label: "B", text: "b", isCorrect: false},
                {label: "C", text: "c", isCorrect: false}
            ],
            lastUsed: null,
        });

        const response = await POST(req); // Make the POST
        expect(response.status).toBe(201); // Valid insert returns status of 201

        // Make sure we wrote to the right collection
        expect(collection).toHaveBeenCalledWith("questions");
        expect(insertOne).toHaveBeenCalledTimes(1);
    });

    test("Returns 400 when fields are not valid (missing the topics field)", async () => {
        // Create the mock question
        const req = makeRequest({
            stem: "Testing invalid fields",
            type: "MC",
            difficulty: 1,
            choices: [
                {label: "A", text: "a", isCorrect: true},
                {label: "B", text: "b", isCorrect: false},
                {label: "C", text: "c", isCorrect: false}
            ],
            lastUsed: null,
        });

        const response = await POST(req); // Make the POST
        expect(response.status).toBe(400); // Valid insert returns status of 201

        // Make sure we wrote to the right collection
        expect(collection).toHaveBeenCalledWith("questions");
        expect(insertOne).toHaveBeenCalledTimes(1);
    });
})