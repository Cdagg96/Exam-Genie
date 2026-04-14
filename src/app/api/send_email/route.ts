import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueType, message } = body;

    //Check if both fields are filled out
    if (!issueType || !message) {
      return NextResponse.json(
        {
          error: 'Issue type and message are required',
          success: false
        },
        { status: 400 }
      );
    }

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

    //Send email to tgen57485@gmail.com
    const { data, error } = await resend.emails.send({
      from: 'Exam Genie <onboarding@resend.dev>',
      to: ['tgen57485@gmail.com'],
      subject: `New Issue Report: ${issueType}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; background: #f3f8ff; padding: 40px; border-radius: 12px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            
            <div style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2563eb); padding: 20px;">
              <h1 style="margin: 0; font-size: 28px; text-align: center; font-weight: 700; color: white;">
                New Issue Report
              </h1>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1e3a8a; font-weight: 600;">Issue Type:</p>
              <p style="font-size: 16px; background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 15px; border-radius: 6px;">
                ${issueType}
              </p>

              <p style="font-size: 16px; color: #1e3a8a; font-weight: 600; margin-top: 20px;">Description:</p>
              <p style="white-space: pre-wrap; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 15px; line-height: 1.5; color: #1e293b;">
                ${message}
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                This issue was submitted from your contact form.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        {
          error: `Failed to send email: ${error.message}`,
          success: false
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Issue report sent successfully!',
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}