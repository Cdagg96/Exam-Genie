import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request) {
    try {
        const { userId, isCooperating } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { message: "Missing user ID" },
                { status: 400 }
            );
        }

        if (!ObjectId.isValid(userId)) {
            return NextResponse.json(
                { message: "Invalid user ID" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const updates: any = {
            updatedOn: new Date()
        };

        if (isCooperating !== undefined) {
            updates.isCooperating = isCooperating;
        }

        if (Object.keys(updates).length === 1) {
            return NextResponse.json(
                { message: "No valid fields provided" },
                { status: 400 }
            );
        }

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Preferences updated"
        });

    } catch (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}