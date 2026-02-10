import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/questions/route";
import { NextRequest } from "next/server";

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
  const sortMock = vi.fn().mockReturnValue({toArray: toArrayMock})
  const findMock = vi.fn().mockReturnValue({ sort: sortMock, toArray: toArrayMock });
  const collectionMock = vi.fn().mockReturnValue({ find: findMock });
  const dbMock = { collection: collectionMock };
  const clientMock = { db: vi.fn().mockReturnValue(dbMock) };

  return { findMock, toArrayMock, collectionMock, dbMock, clientMock };
});

// Mock mongo client
vi.mock("@/libs/mongo", () => {
  const clientPromise = Promise.resolve(clientMock as any);
  return { default: clientPromise };
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper function to create a mock NextRequest with search params
function createMockRequest(searchParams: Record<string, string> = {}) {
  const urlSearchParams = new URLSearchParams(searchParams);
  const url = `http://localhost:3000/api/questions?${urlSearchParams.toString()}`;
  
  return new NextRequest(url);
}

describe("GET /api/questions", () => {
  //Successful fetch of questions without filters
  it("Returns questions successfully without filters", async () => {
    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0]._id).toBe("1234567890abcdef");
    expect(data[0].stem).toBe("What is 2+2?");
    
    //Verify database was called with empty filter
    expect(collectionMock).toHaveBeenCalledWith("questions");
    expect(findMock).toHaveBeenCalledWith({});
  });

  //Successful fetch with topic filter
  it("Returns questions successfully with topic filter", async () => {
    const req = createMockRequest({ topic: "Math" });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.length).toBe(1);
    
    //Verify database was called with topic filter
    expect(findMock).toHaveBeenCalledWith({
      topics: { $in: ["Math"] }
    });
  });

  //Successful fetch with difficulty filter
  it("Returns questions successfully with difficulty filter", async () => {
    const req = createMockRequest({ difficulty: "2" });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    
    //Verify database was called with difficulty filter
    expect(findMock).toHaveBeenCalledWith({
      difficulty: 2
    });
  });

  //Successful fetch with type filter
  it("Returns questions successfully with type filter", async () => {
    const req = createMockRequest({ type: "Multiple Choice" });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    
    //Verify database was called with type filter
    expect(findMock).toHaveBeenCalledWith({
      type: "MC"
    });
  });

  //Database error
  it("Returns 500 if DB fails", async () => {
    findMock.mockImplementationOnce(() => {
      throw new Error("DB Failure");
    });

    const req = createMockRequest();
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Error fetching questions");
  });

  //Test with multiple filters
  it("Returns questions successfully with multiple filters", async () => {
    const req = createMockRequest({ 
      topic: "Science", 
      difficulty: "3", 
      type: "True/False" 
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    
    //Verify database was called with combined filters
    expect(findMock).toHaveBeenCalledWith({
      topics: { $in: ["Science"] },
      difficulty: 3,
      type: "TF"
    });
  });

  //Test with lastUsed date filter
  it("Returns questions successfully with lastUsed filter", async () => {
    const req = createMockRequest({ lastUsed: "12-25-2024" });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    
    expect(findMock).toHaveBeenCalled();
  });
});