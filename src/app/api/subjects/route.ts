import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userID = searchParams.get("userID") ?? searchParams.get("userId");

        if (!userID) {
            return NextResponse.json(
                { ok: false, subjects: [], error: "Missing userID" },
                { status: 400 }
            );
        }
        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('questions');

        const subjects: string[] = await collection.distinct("subject", { userID, });

        return NextResponse.json({ ok: true, subjects });
    } catch (error) {
        console.error("Error grabbing subjects: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}