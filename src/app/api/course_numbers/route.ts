import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
    try {
        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('questions');

        const courseNums: string[] = await collection.distinct("courseNum");

        return NextResponse.json({ok: true, courseNums});
    } catch (error) {
        console.error("Error grabbing subjects: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}