import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('exams');

        // If ID exists, fetch specific exam
        if(id) {
            // Validate the ID
            if(!ObjectId.isValid(id)) {
                return NextResponse.json(
                    { ok: false, error: 'Invalid exam ID' },
                    { status: 400 }
                );
            }

            const exam = await collection.findOne({ _id: new ObjectId(id) }); // Fetch by the ID

            // If no exam found with that ID
            if(!exam) {
                return NextResponse.json(
                    { ok: false, error: 'Exam not found' },
                    { status: 404 }
                );
            }

            const serializedExam = {...exam, _id: exam._id.toString() }; // Convert ObjectId to string
            return NextResponse.json(serializedExam);
        }

        // If no ID exists, fetch all exams
        const exams = await collection.find({}).toArray();

        // Convert MongoDB ObjectId to string for serialization
        const serializedExams = exams.map(exam => ({
            ...exam,
            _id: exam._id.toString()
        }));

        return NextResponse.json(serializedExams);
    } catch (error) {
        console.error('Error fetching exams:', error);
        return NextResponse.json(
            { message: 'Error fetching exams' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Validate the ID
        if(!id) {
            return NextResponse.json(
                { ok: false, error: "Exam ID is required" },
                { status: 400 }
            );
        }

        // Check if the ID is a valid ObjectId
        if(!ObjectId.isValid(id)) {
            return NextResponse.json(
                { ok: false, error: "Invalid exam ID" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("exams").deleteOne({ _id: new ObjectId(id) });

        // If no document was deleted, the exam was not found
        if(result.deletedCount === 0) {
            return NextResponse.json(
                { ok: false, error: "Exam not found" },
                { status: 404 }
            );
        }

        // Successful deletion
        return NextResponse.json(
            { ok: true, message: "Exam deleted successfully!" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting exam: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Insert an exam into the database
export async function POST(req:Request) {
    try {
        const body = await req.json();
        
        const {
            title,
            subject,
            courseNum,
            timeLimit,
            difficulty = "mixed",
            randomize = true,
            totalQuestions,
            typeCounts,
            userID,
        } = body;

        // create the connection
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const questionsdb = db.collection("questions"); // get the questions collection

        const items: any [] = []; // array that will hold the questions for the exam

        const DIFF_MAP: Record<string, number[] | null> = {
            mixed: null,          // no filter
            easy:  [1, 2],
            medium:[2, 3, 4],
            hard:  [4, 5],
        };

        // Loop through each question type and grab -
        // the corresponding number of questions
        // Build pairs for type-count
        const pairs: Array<{type: string; requested: number}> =
            Object.entries(typeCounts).map(([t, n]) => ({
                type: t,
                requested: Number(n) || 0,
        })).filter(p => p.requested > 0);

        // Check to see the difficulty and what questions we should match to
        const band = DIFF_MAP[difficulty];
        const diffFilter = band ? {$in: band} : undefined;

        // If a subject or course number is given, filter on those as well
        const subjectFilter = subject && subject.trim() !== "";
        const courseNumFilter = courseNum && courseNum.trim() !== "";

        // Check availability for each type in the DB
        const shortages: Array<{type: string; requested: number; available: number}> = [];

        for(const {type, requested} of pairs){
            const match: any = {type};
            if(diffFilter) match.difficulty = diffFilter;
            match.userID = userID;
            if(subjectFilter) match.subject = subject;
            if(courseNumFilter) match.courseNum = courseNum;

            const available = await questionsdb.countDocuments(match);
            if(available < requested){
                shortages.push({type, requested, available});
            }
        }

        // If there are shortages in the DB, fail
        if(shortages.length){
            return NextResponse.json(
                {
                    ok: false,
                    error: "Not enough questions to create exam",
                    shortages
                },
                {status: 401}
            );
        }

        // Now go through and grab questions if valid
        for(const {type, requested} of pairs){
            const match: any = {type};
            if(diffFilter) match.difficulty = diffFilter;
            match.userID = userID;
            if(subjectFilter) match.subject = subject;
            if(courseNumFilter) match.courseNum = courseNum;

            // Randomly sample questions for current type
            const sample = await questionsdb.aggregate([
                {$match: match},
                {$sample: {size: requested}}
            ]).toArray();

            // loop throup the array of sample questions and push them onto items
            for(const q of sample){
                items.push({
                    questionId: q._id,
                    type: q.type,
                    subject: q.subject,
                    courseNum: q.courseNum,
                    points: 1,
                    snapshot: {
                        stem: q.stem,
                        choices: q.choices,
                        answer: q.answer,
                        difficulty: q.difficulty,
                        blankLines: q.lines
                    }
                })
            }
        }

        // get the total questions
        const totalPoints = items.reduce((s, it) => s + it.points, 0);

        const lastUsed = body.lastUsed ?? null;

        // Sort the order of types (MC, TF, FIB, Short Answer, Code)
        const TYPE_ORDER = ["MC", "TF", "FIB", "Essay", "Code"];
        items.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

        const exam_data = {
            title,
            subject,
            courseNum,
            timeLimitMin: timeLimit,
            difficulty,
            totalPoints,
            questions: items,
            lastUsed,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await db.collection("exams").insertOne(exam_data);
        
        return NextResponse.json(
            {ok: true, message: "Exam created!", exam: { _id: result.insertedId, ...exam_data }},
            {status: 201}
        );
    } catch (error) {
        // Throw an error message for any unexpected server error
        console.error("Error adding exam: ", error)
        return NextResponse.json(
            {ok: false, error: "Internal server error"},
            {status: 500}
        );
    } 
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    console.log('PUT /api/exams received:', body);

    const { id, title, timeLimitMin, totalPoints, questions } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Validate the ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid exam ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db(process.env.MONGODB_DB);
    const collection = database.collection('exams');

    // Check if exam exists
    const existingExam = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingExam) {
      return NextResponse.json(
        { ok: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Update the exam
    const updateData = {
      title,
      timeLimitMin,
      totalPoints,
      questions,
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { ok: false, error: 'No changes made to exam' },
        { status: 400 }
      );
    }

    // Return the updated exam 
    const updatedExam = await collection.findOne({ _id: new ObjectId(id) });
    
    // Check if updatedExam exists 
    if (!updatedExam) {
      return NextResponse.json(
        { ok: false, error: 'Exam not found after update' },
        { status: 404 }
      );
    }

    const serializedExam = { ...updatedExam, _id: updatedExam._id.toString() };

    return NextResponse.json({
      ok: true,
      message: 'Exam updated successfully',
      exam: serializedExam
    });

  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}