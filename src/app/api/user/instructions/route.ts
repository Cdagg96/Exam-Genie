import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function PUT(req: Request) {
  try {
    const { userId, content } = await req.json();

    if (!userId || !content) {
      return NextResponse.json({ ok: false, message: "Missing userId or content" }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid user ID format" }, { status: 400 });
    }

    // light validation for TipTap doc
    if (content?.type !== "doc" || !Array.isArray(content?.content)) {
      return NextResponse.json({ ok: false, message: "Invalid TipTap document" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "instructionPrefs.examGeneration.editor": "tiptap",
          "instructionPrefs.examGeneration.content": content,
          "instructionPrefs.examGeneration.updatedAt": new Date(),
          updatedOn: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Instructions saved" }, { status: 200 });
  } catch (error) {
    console.error("Error saving instructions:", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}