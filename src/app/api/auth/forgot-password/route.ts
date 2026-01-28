import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

//Post to handle forgot password requests
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        //Needs email to search
        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email is required",
                },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const usersCollection = db.collection("users");

        //Find user by email (case-insensitive)
        const user = await usersCollection.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") },
        });

        //No user found
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "user not found",
                },
                { status: 200 }
            );
        }

        //Generate reset token (32 random bytes)
        const resetToken = crypto.randomBytes(32).toString("hex");

        //Hash the token
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        //Set expiration (1 hour)
        const resetPasswordExpires = new Date(Date.now() + 3600000);

        //Update user with reset token and expiration
        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: resetPasswordExpires,
                },
            }
        );

        //Create reset link (When we deploy change to domain)
        const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

        //Send email using Resend (email design)
        const { data, error } = await resend.emails.send({
            from: "Exam Genie <onboarding@resend.dev>",
            to: ['tgen57485@gmail.com'], //should be email when we get domain
            subject: "Reset Your Password - Exam Genie",
            html: `
        <div style="font-family: 'Inter', Arial, sans-serif; background: #f3f8ff; padding: 40px; border-radius: 12px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            
            <div style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2563eb); padding: 20px;">
              <h1 style="margin: 0; font-size: 28px; text-align: center; font-weight: 700; color: white;">
                Password Reset Request
              </h1>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
                Hello${user.name ? ` ${user.name}` : ""},
              </p>
              
              <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">
                You requested to reset your password for your Exam Genie account.
                Click the button below to reset your password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(to right, #60a5fa, #22d3ee); 
                          color: white; padding: 14px 28px; text-decoration: none; 
                          border-radius: 8px; font-weight: 600; font-size: 16px;
                          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #ef4444; margin-top: 20px;">
                This link will expire in 1 hour.
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                If you didn't request this password reset, please ignore this email.
              </p>

            </div>
          </div>
        </div>
      `,
        });

        if (error) {
            console.error("Resend error:", error);
        }

        //Success response
        return NextResponse.json(
            {
                success: true,
                message: "If an account exists with this email, you will receive a reset link.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password API error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "An error occurred. Please try again later.",
            },
            { status: 500 }
        );
    }
}