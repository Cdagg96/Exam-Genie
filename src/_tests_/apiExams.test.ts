import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE, POST, PUT } from "@/app/api/exams/route";

const {
  findMock,
  findOneMock,
  toArrayMock,
  deleteOneMock,
  insertOneMock,
  updateOneMock,
  questionsCountMock,
  questionsAggregateMock,
  questionsUpdateManyMock,
  collectionMock,
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
        { questionId: "68f39166f8b09cb6a1df1afe", type: "TF", points: 1, order: 1 },
        { questionId: "68f3914cf8b09cb6a1df1afd", type: "TF", points: 1, order: 2 },
      ],
      lastUsed: null,
      createdAt: "2025-11-04T00:34:52.219Z",
      updatedAt: "2025-11-04T00:34:52.219Z",
      userID: "testUser",
    },
  ];

  const toArrayMock = vi.fn().mockResolvedValue(fakeExams);
  const sortMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
  const findMock = vi.fn().mockReturnValue({ sort: sortMock, toArray: toArrayMock });
  const findOneMock = vi.fn().mockResolvedValue(fakeExams[0]);
  const deleteOneMock = vi.fn().mockResolvedValue({ deletedCount: 1 });
  const insertOneMock = vi.fn().mockResolvedValue({ insertedId: "69094a2c5bd7abae970d1fb9" });
  const updateOneMock = vi.fn().mockResolvedValue({ modifiedCount: 1 });

  const examsCol = {
    find: findMock,
    findOne: findOneMock,
    deleteOne: deleteOneMock,
    insertOne: insertOneMock,
    updateOne: updateOneMock,
    countDocuments: vi.fn().mockResolvedValue(1),
  };

  // This is the piece that prevents the POST 500
  const usersCol = {
    findOne: vi.fn().mockResolvedValue(null),
  };

  const questionsCountMock = vi.fn(async () => 10);

  const questionsAggregateMock = vi.fn((pipeline?: any[]) => {
    const match = pipeline?.find((stage: any) => stage.$match)?.$match ?? {};
    const type = match.type;
    const size = pipeline?.find((stage: any) => stage.$sample)?.$sample?.size ?? 0;

    const bank: Record<string, any[]> = {
      TF: [
        {
          _id: "q-tf-1",
          type: "TF",
          subject: "CS",
          courseNum: "2400",
          topics: ["Logic"],
          stem: "Sun rises in the East?",
          choices: [
            { label: "True", text: "True", isCorrect: true },
            { label: "False", text: "False", isCorrect: false },
          ],
          difficulty: 1,
        },
      ],
      FIB: [
        {
          _id: "q-fib-1",
          type: "FIB",
          subject: "CS",
          courseNum: "2400",
          topics: ["Math"],
          stem: "2 + 2 = _",
          choices: "N/A",
          answer: "4",
          difficulty: 2,
          lines: 1,
        },
      ],
      MC: [
        {
          _id: "q-mc-1",
          type: "MC",
          subject: "CS",
          courseNum: "2400",
          topics: ["Geography"],
          stem: "Capital of France?",
          choices: [
            { label: "A", text: "Paris", isCorrect: true },
            { label: "B", text: "Rome", isCorrect: false },
          ],
          difficulty: 3,
        },
      ],
    };

    return {
      toArray: vi.fn().mockResolvedValue((bank[type] ?? []).slice(0, size)),
    };
  });

  const questionsUpdateManyMock = vi.fn().mockResolvedValue({ modifiedCount: 1 });

  const questionsCol = {
    countDocuments: questionsCountMock,
    aggregate: questionsAggregateMock,
    updateMany: questionsUpdateManyMock,
  };

  const collectionMock = vi.fn((name: string) => {
    if (name === "exams") return examsCol;
    if (name === "questions") return questionsCol;
    if (name === "users") return usersCol;
    throw new Error(`Unknown collection: ${name}`);
  });

  const dbMock = { collection: collectionMock };
  const clientMock = { db: vi.fn().mockReturnValue(dbMock) };

  return {
    findMock,
    findOneMock,
    toArrayMock,
    deleteOneMock,
    insertOneMock,
    updateOneMock,
    questionsCountMock,
    questionsAggregateMock,
    questionsUpdateManyMock,
    collectionMock,
    clientMock,
  };
});

vi.mock("@/libs/mongo", () => {
  const clientPromise = Promise.resolve(clientMock as any);
  return { default: clientPromise };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/exams", () => {
  it("Returns exams successfully", async () => {
    const req = new Request("http://localhost/api/exams?userID=testUser", {
      method: "GET",
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0]._id).toBe("69094a2c5bd7abae970d1fb9");
    expect(data[0].title).toBe("Big Exam");
  });

  it("Returns 500 if DB fails", async () => {
    toArrayMock.mockRejectedValueOnce(new Error("DB Failure"));

    const req = new Request("http://localhost/api/exams?userID=testUser", {
      method: "GET",
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Error fetching exams");
  });
});

describe("DELETE /api/exams", () => {
  it("Deletes exam successfully", async () => {
    const req = new Request(
      "http://localhost/api/exams?id=69094a2c5bd7abae970d1fb9",
      { method: "DELETE" }
    );

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.message).toBe("Exam deleted successfully!");
    expect(deleteOneMock).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/exams", () => {
  it("Stores exams successfully", async () => {
    const req = new Request("http://localhost/api/exams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "OK Exam",
        subject: "CS",
        courseNum: "2400",
        timeLimit: 45,
        difficulty: "mixed",
        typeCounts: { TF: 1 },
        userID: "507f1f77bcf86cd799439011",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(collectionMock).toHaveBeenCalledWith("exams");
    expect(insertOneMock).toHaveBeenCalledTimes(1);
  });

  it("Sorts question types based on provided user input", async () => {
    const req = new Request("http://localhost/api/exams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Ordered Exam",
        subject: "CS",
        courseNum: "2400",
        timeLimit: 60,
        difficulty: "mixed",
        typeCounts: { TF: 1, MC: 1, FIB: 1 },
        questionOrder: ["FIB", "MC", "TF"],
        userID: "507f1f77bcf86cd799439011",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.exam.questions.map((q: any) => q.type)).toEqual(["FIB", "MC", "TF"]);
  });
});

describe("PUT /api/exams", () => {
  it("Updates exam successfully", async () => {
    const updatedExamData = {
      id: "69094a2c5bd7abae970d1fb9",
      title: "Updated Exam Title",
      timeLimitMin: 90,
      questions: [
        {
          questionId: "68f39166f8b09cb6a1df1afe",
          type: "MC",
          points: 5,
          snapshot: {
            stem: "Updated question stem",
            choices: [{ label: "A", text: "Choice A" }],
            blankLines: 4,
          },
        },
      ],
    };

    const req = new Request("http://localhost/api/exams", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(updatedExamData),
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.message).toBe("Exam updated successfully");

    expect(updateOneMock).toHaveBeenCalledTimes(1);
    expect(updateOneMock).toHaveBeenCalledWith(
      { _id: expect.any(Object) },
      {
        $set: {
          title: "Updated Exam Title",
          timeLimitMin: 90,
          totalPoints: 5,
          questions: updatedExamData.questions,
          instructionsDoc: undefined,
          lastUsed: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      }
    );
  });
});