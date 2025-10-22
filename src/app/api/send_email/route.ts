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
      from: 'Exam Geine <onboarding@resend.dev>',
      to: ['tgen57485@gmail.com'],
      subject: `New Issue Report: ${issueType}`,
      html: `
        <div class="font-sans p-5">
          <h2 class="text-gray-800 text-xl font-bold mb-4">New Issue Report</h2>
          <div class="border border-gray-200 rounded-lg p-4">
            <p class="mb-2"><strong>Issue Type:</strong> ${issueType}</p>
            <p class="mb-2"><strong>Description:</strong></p>
            <p class="whitespace-pre-wrap border border-gray-200 rounded p-3">${message}</p>
          </div>
          <p class="text-gray-600 mt-5 text-sm">
            This issue was submitted from your contact form.
          </p>
      </div>`,
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