import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return NextResponse.json({ message: "Missing user ID" }, { status: 400 });
    if (!ObjectId.isValid(userId)) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB;
    if (!dbName) return NextResponse.json({ message: "DB not configured" }, { status: 500 });

    const db = client.db(dbName);
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Convert all ObjectIds to strings for frontend
    const formatIds = (arr: any[]) => (arr || []).map((id) => id.toString());

    return NextResponse.json({
      connections: formatIds(user.connections),
      outgoingRequests: formatIds(user.outgoingRequests),
      incomingRequests: formatIds(user.incomingRequests),
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, targetUserId, action } = await req.json();
    if (!userId || !targetUserId) return NextResponse.json({ message: "Missing user IDs" }, { status: 400 });
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(targetUserId))
      return NextResponse.json({ message: "Invalid user IDs" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const userObjId = new ObjectId(userId);
    const targetObjId = new ObjectId(targetUserId);

    const user = await db.collection("users").findOne({ _id: userObjId });
    const targetUser = await db.collection("users").findOne({ _id: targetObjId });

    if (!user || !targetUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (action === "request") {
      const alreadyRequested = (user.outgoingRequests || []).some((id: any) => id.equals(targetObjId));
      const alreadyConnected = (user.connections || []).some((id: any) => id.equals(targetObjId));

      if (alreadyRequested) {
        //Cancel request
        await db.collection("users").updateOne(
          { _id: userObjId },
          { $pull: { outgoingRequests: targetObjId as any } }
        );

        await db.collection("users").updateOne(
          { _id: targetObjId },
          { $pull: { incomingRequests: userObjId as any } }
        );

        return NextResponse.json({ ok: true, message: "Request cancelled" });
      }

      if (alreadyConnected) return NextResponse.json({ message: "Already connected" }, { status: 400 });
      //Send request
      await db.collection("users").updateOne(
        { _id: userObjId },
        { $addToSet: { outgoingRequests: targetObjId } }
      );

      await db.collection("users").updateOne(
        { _id: targetObjId },
        { $addToSet: { incomingRequests: userObjId } }
      );

      return NextResponse.json({ ok: true, message: "Friend request sent" });
    }

    if (action === "accept") {
      //Accept friend request
      await db.collection("users").updateOne(
        { _id: userObjId },
        {
          $pull: { incomingRequests: targetObjId as any },
          $addToSet: { connections: targetObjId }
        }
      );

      await db.collection("users").updateOne(
        { _id: targetObjId },
        {
          $pull: { outgoingRequests: userObjId as any },
          $addToSet: { connections: userObjId }
        }
      );

      return NextResponse.json({ ok: true, message: "Friend request accepted" });
    }

    if (action === "reject") {
      //Reject friend request
      await db.collection("users").updateOne(
        { _id: userObjId },
        { $pull: { incomingRequests: targetObjId as any } }
      );

      await db.collection("users").updateOne(
        { _id: targetObjId },
        { $pull: { outgoingRequests: userObjId as any } }
      );

      return NextResponse.json({ ok: true, message: "Friend request rejected" });
    }

    if (action === "remove") {
      //Remove connection from both users
      await db.collection("users").updateOne(
        { _id: userObjId },
        { $pull: { connections: targetObjId as any } }
      );

      await db.collection("users").updateOne(
        { _id: targetObjId },
        { $pull: { connections: userObjId as any } }
      );

      return NextResponse.json({ ok: true, message: "Connection removed" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating connections:", error);
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}