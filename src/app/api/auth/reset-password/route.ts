import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import crypto from "crypto";
import bcrypt from "bcryptjs";

//Post to handle reset password requests
export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        //Needs token and new password
        if (!token || !newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Token and new password are required",
                },
                { status: 400 }
            );
        }

        //Password has to be atleast 1 character for now (can chage requirements later)
        if (newPassword.length < 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Password must be at least a character",
                },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const usersCollection = db.collection("users");

        //Hash the incoming token to compare with stored hash
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        //Find user with valid, non-expired token
        const user = await usersCollection.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        });

        //If no user found, token is invalid or expired
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired reset token",
                },
                { status: 400 }
            );
        }

        //Check if new password is same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "New password cannot be the same as current password",
                },
                { status: 400 }
            );
        }

        //Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        //Update user password and clear reset token
        const result = await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedPassword                },
                $unset: {
                    resetPasswordToken: "",
                    resetPasswordExpires: "",
                },
            }
        );

        //Check if update was successful
        if (result.modifiedCount === 0) {
            throw new Error("Failed to update password");
        }

        //Success response
        return NextResponse.json(
            {
                success: true,
                message: "Password reset successful. You can now login.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password API error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "An error occurred. Please try again.",
            },
            { status: 500 }
        );
    }
}