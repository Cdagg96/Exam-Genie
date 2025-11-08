import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock NextResponse properly
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => {
      return new Response(JSON.stringify(data), init);
    },
  },
}));

// Create a complete mock for MongoDB with proper typing
const { deleteOne, collection, db, client, ObjectIdMock } = vi.hoisted(() => {
  const deleteOne = vi.fn();
  const collection = vi.fn().mockReturnValue({ deleteOne });
  
  const db = { 
    collection,
    command: vi.fn().mockResolvedValue({})
  };
  
  const mockClient = {
    db: vi.fn().mockReturnValue(db),
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  };

  // Create a proper ObjectId mock with proper typing
  const ObjectIdMock = vi.fn().mockImplementation(function(this: any, id: string) {
    this._id = id;
    this.toString = () => id;
    return this;
  }) as any; // Cast to any to avoid type issues
  
  // Add static isValid method with proper typing
  (ObjectIdMock as any).isValid = vi.fn();
  
  return { 
    deleteOne, 
    collection, 
    db, 
    client: mockClient, 
    ObjectIdMock: ObjectIdMock as any 
  };
});

// Mock the mongodb package
vi.mock("mongodb", () => {
  return {
    MongoClient: vi.fn().mockImplementation(() => client),
    ObjectId: ObjectIdMock,
  };
});

// Mock the actual mongo connection file more thoroughly
vi.mock("@/libs/mongo", async (importOriginal) => {
  const mockClientPromise = Promise.resolve(client);
  
  return {
    default: mockClientPromise,
  };
});

// Import after all mocks are set up
import { DELETE } from "../app/api/questions/route";

describe("DELETE API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteOne.mockReset();
    (ObjectIdMock as any).isValid.mockReset();
    ObjectIdMock.mockClear();
    client.db.mockReturnValue(db);
  });

  test("Successful deletion", async () => {
    (ObjectIdMock as any).isValid.mockReturnValue(true);
    deleteOne.mockResolvedValue({ 
      deletedCount: 1
    });

    const request = new Request("http://localhost/api/questions?id=507f1f77bcf86cd799439011", {
      method: "DELETE",
    });

    const response = await DELETE(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      ok: true,
      message: "Question deleted successfully!",
    });
    expect(deleteOne).toHaveBeenCalledOnce();
    expect((ObjectIdMock as any).isValid).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(ObjectIdMock).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
  });

  test("Missing ID returns 400", async () => {
    const request = new Request("http://localhost/api/questions", {
      method: "DELETE",
    });

    const response = await DELETE(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData).toEqual({
      ok: false,
      error: "Question ID is required",
    });
  });

  test("Invalid ID returns 400", async () => {
    ObjectIdMock.isValid.mockReturnValue(false);

    const request = new Request("http://localhost/api/questions?id=invalid-id", {
      method: "DELETE",
    });

    const response = await DELETE(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData).toEqual({
      ok: false,
      error: "Invalid question ID",
    });
  });

  test("Question not found returns 404", async () => {
    ObjectIdMock.isValid.mockReturnValue(true);
    deleteOne.mockResolvedValue({ 
      deletedCount: 0
    });

    const request = new Request("http://localhost/api/questions?id=507f1f77bcf86cd799439011", {
      method: "DELETE",
    });

    const response = await DELETE(request);
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData).toEqual({
      ok: false,
      error: "Question not found",
    });
  });

  test("Database error returns 500", async () => {
    ObjectIdMock.isValid.mockReturnValue(true);
    deleteOne.mockRejectedValue(new Error("Database connection failed"));

    const request = new Request("http://localhost/api/questions?id=507f1f77bcf86cd799439011", {
      method: "DELETE",
    });

    const response = await DELETE(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData).toEqual({
      ok: false,
      error: "Internal server error",
    });
  });
});