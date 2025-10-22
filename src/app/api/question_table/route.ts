import { NextResponse } from 'next/server';
import clientPromise from "@/libs/mongo";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db(process.env.MONGODB_DB);
    const collection = database.collection('questions');

    const questions = await collection.find({}).toArray();
    
    //Convert MongoDB ObjectId to string for serialization
    const serializedQuestions = questions.map(question => ({
      ...question,
      _id: question._id.toString()
    }));
    
    return NextResponse.json(serializedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { message: 'Error fetching questions' },
      { status: 500 }
    );
  }
}