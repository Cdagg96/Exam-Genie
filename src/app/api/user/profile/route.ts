import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

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

        //Find user by ID
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0, proofFile: 0 } }
        );

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            user: user
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
