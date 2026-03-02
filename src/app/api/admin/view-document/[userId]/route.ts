import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/libs/mongo';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId  = params.userId;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    //Find the user by ID
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });

    //Error
    if (!user || !user.proofFile) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    //Get the file data from the user document
    const file = user.proofFile;

    //Return the file for viewing in the browser
     return new NextResponse(file.data.buffer, {
      status: 200,
      headers: {
        'Content-Type': file.fileType,
        'Content-Disposition': `inline; filename="${file.fileName}"`,
        'Content-Length': file.fileSize.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error viewing document:', error);
    return NextResponse.json(
      { error: 'Failed to load document' },
      { status: 500 }
    );
  }
}