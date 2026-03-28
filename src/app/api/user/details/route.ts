import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    //Check if the user is authenticated and has an email
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    //No email provided
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    //Find the user in the database
    const user = await db.collection("users").findOne(
      { email },
      { projection: { password: 0 } }
    );
    
    //No user
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    //Return user details
    return NextResponse.json({
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      createdOn: user.createdOn,
      isAdmin: user.isAdmin || false,
      status: user.status,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}