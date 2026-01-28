import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import crypto from "crypto";

//Get to verify reset password token
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        //Check if token is provided
        if (!token) {
            return NextResponse.json(
                {
                    valid: false,
                    message: "No token provided",
                },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const usersCollection = db.collection("users");

        //Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        //Find user with valid token
        const user = await usersCollection.findOne(
            {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: new Date() },
            },
            {
                projection: {
                    email: 1,
                    role: 1,
                    _id: 0,
                },
            }
        );

        //If no user found, token is invalid or expired
        if (!user) {
            return NextResponse.json(
                {
                    valid: false,
                    message: "Invalid or expired reset token",
                },
                { status: 200 }
            );
        }

        //Mask email (privacy purpose)
        const maskEmail = (email: string) => {
            const [name, domain] = email.split("@");
            const maskedName = name[0] + "*".repeat(Math.max(0, name.length - 2)) + name.slice(-1);
            return `${maskedName}@${domain}`;
        };

        //Valid token response return masked email and role
        return NextResponse.json(
            {
                valid: true,
                email: maskEmail(user.email),
                role: user.role,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verify token API error:", error);
        return NextResponse.json(
            {
                valid: false,
                message: "Error verifying token",
            },
            { status: 500 }
        );
    }
}