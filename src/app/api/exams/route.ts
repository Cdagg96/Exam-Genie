import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";

// Insert an exam into the database
export async function POST(req:Request) {
    try {
        const body = await req.json();
        
        const {
            title,
            timeLimit,             // consider renaming to timeLimitMin for clarity
            difficulty = "mixed",
            randomize = true,
            totalQuestions,
            typeCounts,
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

        for(const [type, count] of Object.entries(typeCounts)){
            const size = Number(count) || 0;
            if (size <= 0) continue;
            
            const match: any = {type};

            // Check to see the difficulty annd what questions we should match to
            const band = DIFF_MAP[difficulty];
            if(band) match.difficulty = {$in: band};

            // Randomly sample questions for current type
            const sample = await questionsdb.aggregate([
                {$match: match},
                {$sample: {size}}
            ]).toArray();

            // loop throup the array of sample questions and push them onto items
            for(const q of sample){
                items.push({
                    questionId: q._id,
                    type: q.type,
                    points: 1
                })
            }
        }

        // get the total questions
        const totalPoints = items.reduce((s, it) => s + it.points, 0);

        const exam_data = {
            title,
            timeLimitMin: timeLimit,
            difficulty,
            totalPoints,
            questions: items,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await db.collection("exams").insertOne(exam_data);
        
        return NextResponse.json(
            {ok: true, message: "Exam created!", insertedId: result.insertedId},
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