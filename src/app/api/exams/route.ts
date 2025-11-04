import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";

// Insert an exam into the database
export async function POST(req:Request) {
    try {
        const body = await req.json();
        
        const {
            title,
            timeLimit,
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

        // Loop through each question type and grab -
        // the corresponding number of questions
        // Build pairs for type-count
        const pairs: Array<{type: string; requested: number}> =
            Object.entries(typeCounts).map(([t, n]) => ({
                type: t,
                requested: Number(n) || 0,
        })).filter(p => p.requested > 0);

        // Check to see the difficulty annd what questions we should match to
        const band = DIFF_MAP[difficulty];
        const diffFilter = band ? {$in: band} : undefined;

        // Check availability for each type in the DB
        const shortages: Array<{type: string; requested: number; available: number}> = [];

        for(const {type, requested} of pairs){
            const match: any = {type};
            if(diffFilter) match.difficulty = diffFilter;

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
                    points: 1
                })
            }
        }

        // get the total questions
        const totalPoints = items.reduce((s, it) => s + it.points, 0);

        const lastUsed = body.lastUsed ?? null;

        const exam_data = {
            title,
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