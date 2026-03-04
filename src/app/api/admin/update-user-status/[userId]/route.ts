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
      return NextResponse.redirect(new URL('/admin/error?reason=invalid-action', request.url));
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