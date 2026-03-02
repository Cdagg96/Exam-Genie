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
      return new NextResponse(`
        <html>
          <head><title>User Not Found</title></head>
          <body style="font-family: Arial, sans-serif; background: #f3f8ff; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
              <h1 style="color: #ef4444; margin-bottom: 20px;">User Not Found</h1>
              <p style="color: #6b7280;">The user you're trying to '${action}' doesn't exist.</p>
            </div>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    //Appoved or Denied confirmation page
    const isApprove = action === 'Approved';
    return new NextResponse(`
      <html>
        <head><title>User ${isApprove ? 'Approved' : 'Denied'}</title></head>
        <body style="font-family: Arial, sans-serif; background: #f3f8ff; display: flex; justify-content: center; align-items: center; height: 100vh;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h1 style="color: ${isApprove ? '#10b981' : '#ef4444'}; margin-bottom: 20px;">
              ${isApprove ? 'User Approved Successfully!' : 'User Denied'}
            </h1>
            <p style="color: #6b7280; margin-bottom: 30px;">
              ${isApprove 
                ? 'The teacher\'s account has been approved.' 
                : 'The teacher\'s registration has been denied.'}
            </p>
            <a href="/" style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none;">Return to Home</a>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    //Error page
    console.error('Error updating user status:', error);
    return new NextResponse(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; background: #f3f8ff; display: flex; justify-content: center; align-items: center; height: 100vh;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h1 style="color: #ef4444; margin-bottom: 20px;">Error</h1>
            <p style="color: #6b7280;">Failed to update user status. Please try again.</p>
          </div>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}