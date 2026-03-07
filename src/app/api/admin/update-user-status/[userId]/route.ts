import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/libs/mongo';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    //Get the action from the query parameter
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    //Validate action
    if (!action || !['Approved', 'Denied'].includes(action)) {
      return NextResponse.redirect(new URL('/admin/error?reason=invalid-action', request.url));
    }

    //Connect to the database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    //Get the user's email and name
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    //If no user was found, return an error page
    if (!user) {
      return NextResponse.redirect(new URL('/admin/error?reason=user-not-found', request.url));
    }

    //Update the user's status based on the action
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          status: action
        } 
      }
    );

    //Check if Resend API key is correct
    if (!process.env.RESEND_API_KEY) {
        return NextResponse.json(
            {
                error: 'Email service is not configured',
                success: false
            },
            { status: 500 }
        );
    }

    const baseUrl = process.env.NEXTAUTH_URL;
      
      if (action === 'Approved') {
        //Send approval email
        await resend.emails.send({
          from: 'Exam Genie <onboarding@resend.dev>',
          to: ['tgen57485@gmail.com'],
          subject: `Your Exam Genie Account Has Been Approved`,
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; background: #f3f8ff; padding: 40px; border-radius: 12px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                
                <div style="background: linear-gradient(to right, #10b981, #22d3ee, #2563eb); padding: 20px;">
                  <h1 style="margin: 0; font-size: 28px; text-align: center; font-weight: 700; color: white;">
                    Account Approved
                  </h1>
                </div>

                <div style="padding: 30px;">
                  <p style="font-size: 18px; color: #1e3a8a; font-weight: 600;">Hello ${user.firstName} ${user.lastName},</p>
                  
                  <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    Your teacher registration has been <span style="color: #10b981; font-weight: 600;">approved</span>. 
                    You can now log in to your account and start using Exam Genie to create and manage exams.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}" 
                       style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                      Log In to Your Account
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `,
        });
      } else {
        //Send denial email
        await resend.emails.send({
          from: 'Exam Genie <onboarding@resend.dev>',
          to: ['tgen57485@gmail.com'],
          subject: `Update on Your Exam Genie Registration`,
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; background: #f3f8ff; padding: 40px; border-radius: 12px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                
                <div style="background: linear-gradient(to right, #ef4444, #f97316, #f59e0b); padding: 20px;">
                  <h1 style="margin: 0; font-size: 28px; text-align: center; font-weight: 700; color: white;">
                    Registration Status Update
                  </h1>
                </div>

                <div style="padding: 30px;">
                  <p style="font-size: 18px; color: #1e3a8a; font-weight: 600;">Hello ${user.firstName} ${user.lastName},</p>
                  
                  <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    Thank you for your interest in Exam Genie. After reviewing your registration, 
                    we regret to inform you that your application has been <span style="color: #ef4444; font-weight: 600;">denied</span>.
                  </p>

                  <p style="font-size: 16px; color: #374151; font-weight: 600; margin-bottom: 5px;">
                    Possible reasons:
                  </p>
                  <ul style="color: #374151; margin-top: 0; margin-bottom: 20px; padding-left: 20px;">
                    <li style="margin-bottom: 5px;">Unable to verify teacher/educational affiliation</li>
                    <li style="margin-bottom: 5px;">Insufficient proof documentation</li>
                    <li style="margin-bottom: 5px;">Invalid or unverifiable credentials</li>
                  </ul>

                  <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 10px;">
                    <strong>What you can do:</strong> You may submit a new registration with additional 
                    verification documents.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}" 
                       style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); margin-right: 10px;">
                      Try Again
                    </a>
                  </div>

                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                    If you believe this is an error, please reach us at tgen57485@gmail.com
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      }
    
    //If no user was found, return an error page
    if (result.matchedCount === 0) {
      return NextResponse.redirect(new URL('/admin/error?reason=user-not-found', request.url));
    }

    return NextResponse.redirect(new URL(`/admin/result?status=${action.toLowerCase()}`, request.url));

  } catch (error) {
    return NextResponse.redirect(new URL('/admin/error?reason=server-error', request.url));
  }
}