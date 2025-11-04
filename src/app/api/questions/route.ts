import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

// Insert a question into the database
export async function POST(req:Request) {
    try {
        const body = await req.json();
        
        // validate the data coming in
        if(!body.stem || !body.type || !body.difficulty || !body.topics){
            return NextResponse.json(
                {ok: false, error: "Missing required fields"},
                {status: 400}
            );
        }
        

        // convert fields if needed
        body.lastUsed = body.lastUsed ?? null;
        body.createdOn = new Date();
        body.lastUpdated = new Date();

        // Insert the data into mongoDB
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("questions").insertOne(body);
        
        return NextResponse.json(
            {ok: true, message: "Question created!", insertedId: result.insertedId},
            {status: 201}
        );
    } catch (error) {
        // Throw an error message for any unexpected server error
        console.error("Error adding question: ", error)
        return NextResponse.json(
            {ok: false, error: "Internal server error"},
            {status: 500}
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        //Validate the ID
        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Question ID is required" },
                { status: 400 }
            );
        }

        //Check if the ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { ok: false, error: "Invalid question ID" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("questions").deleteOne({ _id: new ObjectId(id) });

        //If no document was deleted, the question was not found
        if (result.deletedCount === 0) {
            return NextResponse.json(
                { ok: false, error: "Question not found" },
                { status: 404 }
            );
        }

        //Successful deletion
        return NextResponse.json(
            { ok: true, message: "Question deleted successfully!" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting question: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

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

//Update a question in the database
export async function PUT(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const body = await req.json();

        //Validate the ID
        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Question ID is required" },
                { status: 400 }
            );
        }

        //Check if the ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { ok: false, error: "Invalid question ID" },
                { status: 400 }
            );
        }

        //Validate required fields
        if (!body.stem || !body.type || !body.difficulty || !body.topics) {
            return NextResponse.json(
                { ok: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        //Update the document with new data and update timestamp
        const updateData = {
            ...body,
            lastUpdated: new Date()
        };

        const result = await db.collection("questions").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        //If no document was updated, the question was not found
        if (result.matchedCount === 0) {
            return NextResponse.json(
                { ok: false, error: "Question not found" },
                { status: 404 }
            );
        }

        //Successful update
        return NextResponse.json(
            { ok: true, message: "Question updated successfully!" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating question: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}