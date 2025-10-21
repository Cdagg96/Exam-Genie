import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";

// Insert a question into the database
export async function POST(req:Request) {
    try {
        const body = await req.json();
        
        // validate the data coming in
        if(!body.stem || !body.type || !body.difficulty || !body.topics || !body.choices){
            return NextResponse.json(
                {ok: false, error: "Missing required fields"},
                {status: 400}
            );
        }

        // convert fields if needed
        body.lastUsed = body.lastUsed ?? null;
        body.createdOn = new Date();
        body.lastUpdated = new Date();

        // Insert the data into mongoDB
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("questions").insertOne(body);
        
        return NextResponse.json(
            {ok: true, message: "Question created!", insertedId: result.insertedId},
            {status: 201}
        );
    } catch (error) {
        // Throw an error message for any unexpected server error
        console.error("Error adding question: ", error)
        return NextResponse.json(
            {ok: false, error: "Internal server error"},
            {status: 500}
        );
    }
}