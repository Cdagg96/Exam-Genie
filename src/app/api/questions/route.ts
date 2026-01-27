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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const courseNum = searchParams.get('courseNum');
    const lastUsed = searchParams.get('lastUsed');
    
    const client = await clientPromise;
    const database = client.db(process.env.MONGODB_DB);
    const collection = database.collection('questions');
    
    const countsMode = searchParams.get("counts"); // "1" means return counts
    const userId = searchParams.get("userId");

    // Build filter object based on provided parameters
    const filter: any = {};
    if (userId) {
      filter.userID = userId; // confirm your DB field name is exactly "userID"
    }    
    
    if (topic) {
      filter.topics = { $in: [topic] };
    }
    
   if (difficulty && difficulty !== "mixed") {
        const n = Number(difficulty);
        if (Number.isInteger(n) && n >= 1 && n <= 5) {
            //if difficulty comes from questions page
            filter.difficulty = n;
        }else {
            //if difficulty comes from exam gen 
            const diffMap: Record<string, number[]> = {
            easy: [1, 2],
            medium: [3, 4],
            hard: [5],
        };

    const vals = diffMap[difficulty];
    if (vals) filter.difficulty = { $in: vals };
  }
}
    
    if (type) {
      //Map the display types to database types
      const typeMap: { [key: string]: string } = {
        'Multiple Choice': 'MC',
        'True/False': 'TF',
        'Fill In The Blank': 'FIB',
        'Essay': 'Essay',
        'Coding': 'Code'
      };
      filter.type = typeMap[type] || type;
    }

    if(subject){
        filter.subject = subject;
    }

    if(courseNum){
        filter.courseNum = courseNum;
    }
    
    if (lastUsed) {
      try {
        //Parse the MM-DD-YYYY format from the frontend
        const [month, day, year] = lastUsed.split('-').map(Number);
        const lastUsedDate = new Date(year, month - 1, day); 
        
        //Set the date range for the entire day
        const startOfDay = new Date(lastUsedDate);
        const endOfDay = new Date(lastUsedDate);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        filter.lastUsed = {
          $gte: startOfDay.toISOString(),
          $lt: endOfDay.toISOString()
        };
      } catch (error) {
        console.error('Error parsing lastUsed date:', error);
        //If date parsing fails, don't apply the filter rather than throwing error
      }
    }

    const questions = await collection.find(filter).toArray();
    if (countsMode === "1") {
        const counts = { MC: 0, TF: 0, Essay: 0, FIB: 0, Code: 0 };

        for (const q of questions) {
            const t = q.type;
            if (t in counts) counts[t as keyof typeof counts] += 1;
        }

            return NextResponse.json({ ok: true, counts });
    }

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