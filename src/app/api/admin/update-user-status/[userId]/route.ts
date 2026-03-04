import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/libs/mongo';
import { ObjectId } from 'mongodb';

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
      return new NextResponse(`
        <html>
          <head><title>Invalid Action</title></head>
          <body style="font-family: Arial, sans-serif; background: #f3f8ff; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
              <h1 style="color: #ef4444; margin-bottom: 20px;">Invalid Action</h1>
              <p style="color: #6b7280;">Please specify either 'Approved' or 'Denied' as an action.</p>
            </div>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    //Connect to the database
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    //Update the user's status based on the action
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          status: action
        } 
      }
    );

    //If no user was found, return an error page
    if (result.matchedCount === 0) {
      return NextResponse.redirect(new URL('/admin/error?reason=user-not-found', request.url));
    }

    return NextResponse.redirect(new URL(`/admin/result?status=${action.toLowerCase()}`, request.url));

  } catch (error) {
    return NextResponse.redirect(new URL('/admin/error?reason=server-error', request.url));
  }
}