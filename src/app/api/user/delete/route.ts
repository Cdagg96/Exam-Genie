import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
    try {
        const { userId } = await req.json();

        //Validate required fields
        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
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
        const user = await db.collection("users").findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        //Delete user's questions
        const questionsResult = await db.collection("questions").deleteMany({
            userID: userId
        });

        //Delete user's exams
        const examsResult = await db.collection("exams").deleteMany({
            userID: userId
        });

        //Delete user
        const result = await db.collection("users").deleteOne({
            _id: new ObjectId(userId)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { message: "Failed to delete user" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Account deleted successfully",
            signOut: true,
            deletedData: {
                user: result.deletedCount,
                questions: questionsResult.deletedCount,
                exams: examsResult.deletedCount
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}