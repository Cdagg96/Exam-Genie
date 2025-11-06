import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/questions/route";

//Create a mock mongo db without actually using mongoDB
const {
  findMock,
  toArrayMock,
  collectionMock,
  dbMock,
  clientMock,
} = vi.hoisted(() => {
  const fakeQuestions = [
    {
      _id: "1234567890abcdef",
      stem: "What is 2+2?",
      type: "Multiple Choice",
      difficulty: "1",
      topics: ["Math"],
      choices: [],
      lastUsed: null,
      userID: "user1",
    },
  ];

  const toArrayMock = vi.fn().mockResolvedValue(fakeQuestions);
  const findMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
  const collectionMock = vi.fn().mockReturnValue({ find: findMock });
  const dbMock = { collection: collectionMock };
  const clientMock = { db: vi.fn().mockReturnValue(dbMock) };

  return { findMock, toArrayMock, collectionMock, dbMock, clientMock };
});

//Mock mongo client
vi.mock("@/libs/mongo", () => {
  const clientPromise = Promise.resolve(clientMock as any);
  return { default: clientPromise };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/question_table", () => {
  //Successful fetch of questions
  it("Returns questions successfully", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0]._id).toBe("1234567890abcdef");
    expect(data[0].stem).toBe("What is 2+2?");
  });
  //Database error
  it("Returns 500 if DB fails", async () => {
    findMock.mockImplementationOnce(() => {
      throw new Error("DB Failure");
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Error fetching questions");
  });
});
