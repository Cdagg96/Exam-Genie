import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/libs/mongo";

export async function GET() {
  try {    
    const session = await getServerSession();
    console.log("Session:", session?.user?.email);
    
    //Check if the user is authenticated and has an email
    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    //Check if user is admin
    const currentUser = await db.collection("users").findOne({ 
      email: session.user.email 
    });
    
    //User not found or not admin
    if (!currentUser?.isAdmin) {
      console.log("User is not admin");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    //Fetch all non-admin users
    const users = await db.collection("users")
      .find({ isAdmin: { $ne: true } })
      .project({ 
        password: 0, 
        instructionPrefs: 0,
        "proofFile.data": 0 
      })
      .sort({ createdOn: -1 })
      .toArray();
    
    console.log(`Found ${users.length} users`);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}