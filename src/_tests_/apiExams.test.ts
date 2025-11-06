import { describe, it, expect, vi, beforeEach, test } from "vitest";
import { GET, DELETE, POST } from "@/app/api/exams/route";

//Create a mock mongo db without actually using mongoDB
const {
    findMock,
    toArrayMock,
    deleteOneMock,
    insertOneMock,
    questionsCountMock,
    questionsAggregateMock,
    collectionMock,
    dbMock,
    clientMock,
} = vi.hoisted(() => {
    // Exams Collection
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
    const insertOneMock = vi.fn().mockResolvedValue({ insertedId: "69094a2c5bd7abae970d1fb9"});
    const examsCol = {
        find: findMock,
        deleteOne: deleteOneMock,
        insertOne: insertOneMock
    };

    // Questions collection
    const questionsCountMock = vi.fn(async (_match?: any) => 10);
    const questionsAggregateMock = vi.fn((_pipeline?: any[]) => ({
        toArray: async () => [
        { _id: "q1", type: "TF", difficulty: 1, stem: "Sun rises in the East?" },
        { _id: "q2", type: "TF", difficulty: 2, stem: "2 + 2 = 4?" },
        // add more if you request more than 2
        ],
    }));

    const questionsCol = {
        countDocuments: questionsCountMock,
        aggregate: questionsAggregateMock,
    };

    const collectionMock = vi.fn((name: string) => {
        if(name === "exams") return examsCol;
        if(name === "questions") return questionsCol;
        throw new Error(`Unkown collection: ${name}`);
    });


    const dbMock = { collection: collectionMock };
    const clientMock = { db: vi.fn().mockReturnValue(dbMock) };

    return { findMock, toArrayMock, deleteOneMock,insertOneMock, questionsCountMock, questionsAggregateMock, collectionMock, dbMock, clientMock };
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

describe("POST /api/exams", () => {
    // Successful fetch of exams
    it("Stores exams successfully", async () => {
        const req = new Request("http://localhost/api/exams", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                title: "OK Exam",
                timeLimit: 45,
                difficulty: "mixed",
                typeCounts: { TF: 2 }
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        // Confirm all the fields are collected properly
        expect(res.status).toBe(201);
        expect(data.ok).toBe(true);
        
        expect(collectionMock).toHaveBeenCalledWith("exams");
        expect(insertOneMock).toHaveBeenCalledTimes(1);
    });
});