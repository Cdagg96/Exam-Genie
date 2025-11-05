import { describe, it, expect, vi, beforeEach, test } from "vitest";
import { GET, DELETE } from "@/app/api/exams/route";

//Create a mock mongo db without actually using mongoDB
const {
    findMock,
    toArrayMock,
    deleteOneMock,
    collectionMock,
    dbMock,
    clientMock,
} = vi.hoisted(() => {
    const fakeExams = [
        {
        _id: "69094a2c5bd7abae970d1fb9",
        title: "Big Exam",
        timeLimitMin: 60,
        difficulty: "mixed",
        totalPoints: 2,
        questions: [
            { questionId: "68f39166f8b09cb6a1df1afe", type: "TF", points: 1 },
            { questionId: "68f3914cf8b09cb6a1df1afd", type: "TF", points: 1 },
        ],
        lastUsed: null,
        createdAt: "2025-11-04T00:34:52.219Z",
        updatedAt: "2025-11-04T00:34:52.219Z",
        },
    ];

    const toArrayMock = vi.fn().mockResolvedValue(fakeExams);
    const findMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
    const deleteOneMock = vi.fn().mockResolvedValue({ deletedCount: 1 });
    const collectionMock = vi.fn().mockReturnValue({
        find: findMock,
        deleteOne: deleteOneMock,
    });
    const dbMock = { collection: collectionMock };
    const clientMock = { db: vi.fn().mockReturnValue(dbMock) };

    return { findMock, toArrayMock, deleteOneMock, collectionMock, dbMock, clientMock };
});

// Mock mongo client
vi.mock("@/libs/mongo", () => {
    const clientPromise = Promise.resolve(clientMock as any);
    return { default: clientPromise };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/exams", () => {
    // Successful fetch of exams
    it("Returns exams successfully", async () => {
        const res = await GET();
        const data = await res.json();

        // Confirm all the fields are collected properly
        expect(res.status).toBe(200);
        expect(data.length).toBe(1);
        expect(data[0]._id).toBe("69094a2c5bd7abae970d1fb9");
        expect(data[0].title).toBe("Big Exam");
        expect(data[0].timeLimitMin).toBe(60);
        expect(data[0].difficulty).toBe("mixed");
        expect(data[0].totalPoints).toBe(2);
        expect(data[0].questions.length).toBe(2);
        expect(data[0].questions[0].questionId).toBe("68f39166f8b09cb6a1df1afe");
        expect(data[0].questions[0].type).toBe("TF");
        expect(data[0].questions[0].points).toBe(1);
        expect(data[0].questions[1].questionId).toBe("68f3914cf8b09cb6a1df1afd");
        expect(data[0].questions[1].type).toBe("TF");
        expect(data[0].questions[1].points).toBe(1);
        expect(data[0].createdAt).toBe("2025-11-04T00:34:52.219Z");
        expect(data[0].updatedAt).toBe("2025-11-04T00:34:52.219Z");
    });
    // Database error
    it("Returns 500 if DB fails", async () => {
        findMock.mockImplementationOnce(() => {
            throw new Error("DB Failure");
        });

        const res = await GET();
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data.message).toBe("Error fetching exams");
    });
});

describe("DELETE /api/exams", () => {
    // Successful deletion
    it("Deletes exam successfully", async () => {
        const req = new Request("http://localhost/api/exams?id=69094a2c5bd7abae970d1fb9", { method: "DELETE" });

        const res = await DELETE(req);
        const data = await res.json();
        
        expect(res.status).toBe(200);
        expect(data.ok).toBe(true);
        expect(data.message).toBe("Exam deleted successfully!");
        expect(deleteOneMock).toHaveBeenCalledTimes(1);
    });
});