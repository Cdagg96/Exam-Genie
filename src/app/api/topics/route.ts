import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userID = searchParams.get("userID") ?? searchParams.get("userId");

        if (!userID) {
            return NextResponse.json({ ok: false, topics: [], error: "Missing userID" }, { status: 400 });
        }
        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('questions');

        const topics: string[] = await collection.distinct("topics", { userID });

        return NextResponse.json({ ok: true, topics });
    } catch (error) {
        console.error("Error grabbing topics: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}