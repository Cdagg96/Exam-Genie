import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

function parseDifficulty(value: string | null) {
  if (!value) return null;

  const n = Number(value);
  if (Number.isInteger(n) && n >= 1 && n <= 5) {
    return n;
  }

  return null;
}

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
    const mcDifficulty = searchParams.get("mcDifficulty");
    const tfDifficulty = searchParams.get("tfDifficulty");
    const essayDifficulty = searchParams.get("essayDifficulty");
    const fibDifficulty = searchParams.get("fibDifficulty");
    const codeDifficulty = searchParams.get("codeDifficulty");
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const courseNum = searchParams.get('courseNum');
    const lastUsed = searchParams.get('lastUsed');
    
    const client = await clientPromise;
    const database = client.db(process.env.MONGODB_DB);
    const collection = database.collection('questions');
    
    const countsMode = searchParams.get("counts"); // "1" means return counts
    const userId = searchParams.get("userID") || searchParams.get("userId");

    // Detect pagination presence (only paginate if these params exist)
    const hasPage = searchParams.has("page");
    const hasLimit = searchParams.has("limit");
    const usePagination = hasPage || hasLimit;

    // If sorting by order in the table (Difficulty or Last used)
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const allowedSortFields = ["difficulty", "lastUsed"];

    let sort: Record<string, 1 | -1> = { createdOn: -1, _id: -1 };
    if (sortBy && allowedSortFields.includes(sortBy)) {
        sort = { [sortBy]: sortOrder as 1 | -1, _id: -1 };
    }

    // Build filter object based on provided parameters
    const filter: any = {};
    if (userId) {
      filter.userID = userId; // confirm your DB field name is exactly "userID"
    }    
    
    if (topic) {
      filter.topics = { $in: [topic] };
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
            
            //Get filter type (default to 'before' if not specified)
            const filterType = searchParams.get('lastUsedFilterType') || 'before';
            
            if (filterType === 'never'){
                filter.lastUsed = null;
            }
            else {
                //Create date range for the selected day
                const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
                const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
                
                if (filterType === 'before') {
                    //Filter for dates before the selected day
                    filter.lastUsed = { $lt: startOfDay };
                } 
                else if (filterType === 'after') {
                    //Filter for dates after the selected day
                    filter.lastUsed = { $gt: endOfDay };
                }
                else if (filterType === 'range') {
                    //Filter for dates between start and end
                    const lastUsedEnd = searchParams.get('lastUsedEnd');
                    
                    if (lastUsedEnd) {
                        const [endMonth, endDay, endYear] = lastUsedEnd.split('-').map(Number);
                        const endOfRangeDay = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
                        
                        filter.lastUsed = {
                        $gte: startOfDay,
                        $lte: endOfRangeDay
                        };
                    } else {
                        //If no end date provided, just use the single day
                        filter.lastUsed = {
                        $gt: startOfDay,
                        $lt: endOfDay
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing lastUsed date:', error);
            //If date parsing fails, don't apply the filter rather than throwing error
        }
    }
    else {
        const filterType = searchParams.get('lastUsedFilterType');
        if (filterType === 'never') {
            filter.lastUsed = null;
        }
    }

    if (countsMode === "1") {
        const difficultyByType = {
            MC: parseDifficulty(mcDifficulty),
            TF: parseDifficulty(tfDifficulty),
            Essay: parseDifficulty(essayDifficulty),
            FIB: parseDifficulty(fibDifficulty),
            Code: parseDifficulty(codeDifficulty),
        };
        const counts = {
            MC: 0,
            TF: 0,
            Essay: 0,
            FIB: 0,
            Code: 0,
        };
        for (const type of Object.keys(counts) as Array<keyof typeof counts>) {
            const typeFilter: any = {
                ...filter,
                type,
            };
            const selectedDifficulty = difficultyByType[type];
            if (selectedDifficulty !== null) {
                typeFilter.difficulty = selectedDifficulty;
            }
            counts[type] = await collection.countDocuments(typeFilter);
        }

        return NextResponse.json({ ok: true, counts });
    }

    if(usePagination){
        // For pagination
        const page = Math.max(1, Number(searchParams.get("page") ?? 1)); // page number
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25))); // questions per page
        const skip = (page - 1) * limit; // next/prev page

        const questions = await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray();

        // total count for pagination controls
        const total = await collection.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(total / limit));

        //Convert MongoDB ObjectId to string for serialization
        const items = questions.map(question => ({
        ...question,
        _id: question._id.toString()
        }));
        
        return NextResponse.json(
            {
                ok:true,
                items,
                page,
                limit,
                total,
                totalPages
            }
        );
    }

    const questions = await collection.find(filter).sort(sort).toArray();
    //Convert MongoDB ObjectId to string for serialization
    const serializedQuestions = questions.map(question => ({
      ...question,
      _id: question._id.toString(),
      lastUsed: question.lastUsed ? new Date(question.lastUsed).toISOString() : null
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