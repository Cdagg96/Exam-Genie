import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        //Validate the ID
        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Question ID is required" },
                { status: 400 }
            );
        }

        //Check if the ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { ok: false, error: "Invalid question ID" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("questions").deleteOne({ _id: new ObjectId(id) });

        //If no document was deleted, the question was not found
        if (result.deletedCount === 0) {
            return NextResponse.json(
                { ok: false, error: "Question not found" },
                { status: 404 }
            );
        }

        //Successful deletion
        return NextResponse.json(
            { ok: true, message: "Question deleted successfully!" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting question: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}