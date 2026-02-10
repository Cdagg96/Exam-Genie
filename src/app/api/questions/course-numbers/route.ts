import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: "User ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('questions');

        //Filter course numbers by user ID
        const courseNumbers: string[] = await collection.distinct("courseNum", {
            userID: userId
        });

        return NextResponse.json({ok: true, courseNumbers});
    } catch (error) {
        console.error("Error grabbing course numbers: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}