import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import bcrypt from "bcryptjs"; //for password hashing

export async function POST(req:Request) {
    try {
        const {role, email, password } = await req.json();
        
        // validate the data coming in
        if (!role || !email || !password) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const body = {
            role,
            email,
            password: hashedPassword, // We might need to hash we are not supposed to keep real passwords
            createdOn: new Date(),
            domain: ".edu",
            status: "Disabled"
        };


        // Insert the data into mongoDB
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("users").insertOne(body);
        
        return NextResponse.json(
            {ok: true, message: "User Registration Successful!", insertedId: result.insertedId},
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