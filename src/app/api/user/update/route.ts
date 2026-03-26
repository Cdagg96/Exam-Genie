import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function PUT(req: Request) {
    try {
        const { userId, firstName, lastName, phone, email, institution, department, tSubject } = await req.json();

        //Validate required fields
        if (!userId || !firstName || !lastName || !phone || !email || !institution || !department || !tSubject) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        //Validate userId format
        if (!ObjectId.isValid(userId)) {
            return NextResponse.json(
                { message: "Invalid user ID format" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        //Check if user exists
        const existingUser = await db.collection("users").findOne({
            _id: new ObjectId(userId)
        });

        //User doesn't exist
        if (!existingUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        //Update user
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    firstName,
                    lastName,
                    phone,
                    email,
                    institution,
                    department,
                    tSubject,
                    updatedOn: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        //Get the updated user data
        const updatedUser = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0, proofFile: 0 } }
        );

        return NextResponse.json({
            ok: true,
            message: "Profile updated successfully",
            user: updatedUser
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}