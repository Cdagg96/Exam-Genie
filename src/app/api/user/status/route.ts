import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    //No email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    //Find the user by email
    const user = await db.collection("users").findOne(
      { email },
      { projection: { status: 1, firstName: 1, lastName: 1 } }
    );

    //User doesn't exist
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    //Get status and name
    return NextResponse.json({
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName
    });

  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}