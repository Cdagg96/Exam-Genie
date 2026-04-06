import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

const DEFAULT_POINTS: Record<string, number> = {
    MC: 1,
    TF: 1,
    FIB: 1,
    Essay: 5,
    Code: 10,
};

//the default instuctions
const defaultInstructionsDoc = {
    type: "doc",
    content: [
        {
            type: "paragraph",
            attrs: { textAlign: "center" },
            content: [
                {
                    type: "text",
                    text: "INSTRUCTIONS",
                    marks: [
                        { type: "bold" },
                        { type: "textStyle", attrs: { fontSize: "18px" } },
                    ],
                },
            ],
        },
        {
            type: "bulletList",
            content: [
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Answer all questions in the space provided." }] }] },
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Show your work where applicable. Circle or clearly mark your final answer." }] }] },
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "No unauthorized materials. Calculators allowed unless otherwise stated." }] }] },
            ],
        },
    ],
};

function normalizeType(t: string): "MC" | "TF" | "FIB" | "Essay" | "Code" {
    const x = (t || "").trim();
    if (x === "MC" || x === "TF" || x === "FIB" || x === "Essay" || x === "Code") return x;
    if (x === "Multiple Choice") return "MC";
    if (x === "True/False") return "TF";
    if (x === "Fill in the Blank") return "FIB";
    return "MC";
}

function computeTotalPoints(questions: any[]): number {
    return questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const id = searchParams.get('id');
        const name = searchParams.get('name');
        const difficulty = searchParams.get('difficulty');
        const totalPoints = searchParams.get('totalPoints');
        const subject = searchParams.get('subject');
        const courseNum = searchParams.get('courseNum');
        const lastUsed = searchParams.get('lastUsed');
        //Get filter type (default to 'before' if not specified)
        const filterType = searchParams.get('lastUsedFilterType') || 'before';

        const userID = searchParams.get("userID");

        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('exams');

        // Detect pagination presence (only paginate if these params exist)
        const hasPage = searchParams.has("page");
        const hasLimit = searchParams.has("limit");
        const usePagination = hasPage || hasLimit;

        // If sorting by order in the table (Difficulty or Last used)
        const sortBy = searchParams.get("sortBy");
        const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
        const allowedSortFields = ["createdAt", "totalPoints", "lastUsed"];

        let sort: Record<string, 1 | -1> = { createdOn: -1, _id: -1 };
        if (sortBy && allowedSortFields.includes(sortBy)) {
            sort = { [sortBy]: sortOrder as 1 | -1, _id: -1 };
        }

        // Build filter object based on provided parameters
        const filter: any = {};

        // Scope exams to the current user only
        if (!userID) {
            return NextResponse.json([]);
        }

        filter.userID = userID;

        if (id) filter._id = new ObjectId(id);
        // If ID exists, fetch specific exam
        if (id) {
            // Validate the ID
            if (!ObjectId.isValid(id)) {
                return NextResponse.json(
                    { ok: false, error: 'Invalid exam ID' },
                    { status: 400 }
                );
            }
            filter._id = new ObjectId(id);
        }

        // Apply other filters
        if (name) {
            filter.title = { $regex: name, $options: 'i' }; // case-insensitive search
        }

        if (difficulty) {
            filter.difficulty = difficulty;
        }

        if (totalPoints) {
            // If there is a range it needs to return the numbers in between
            if (totalPoints.includes('-')) {
                const [min, max] = totalPoints.split('-').map(Number);
                filter.totalPoints = { $gte: min, $lte: max };
            }

            // Otherwise, take care of the rest of the cases which is 25+
            else {
                const min = Number(totalPoints.replace('+', ''));
                filter.totalPoints = { $gte: min };
            }
        }

        if (subject) {
            filter.subject = subject;
        }

        if (courseNum) {
            filter.courseNum = courseNum;
        }

        if (filterType === "never") {
            filter.$or = [
                { lastUsed: null },
                { lastUsed: { $exists: false } },
            ];
        } 
        else if (lastUsed) {
            try {
                //Parse the MM-DD-YYYY format from the frontend
                const [month, day, year] = lastUsed.split('-').map(Number);
                
                
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
            } catch (error) {
                console.error('Error parsing lastUsed date:', error);
                // If date parsing fails, don't apply the filter rather than throwing error
            }
        }
        
        if(usePagination){
            // For pagination
            const page = Math.max(1, Number(searchParams.get("page") ?? 1)); // Page number
            const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25))); // Exams per page
            const skip = (page - 1) * limit; // Next/prev page

            const exams = await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray();

            // Total count for pagination controls
            const total = await collection.countDocuments(filter);
            const totalPages = Math.max(1, Math.ceil(total / limit));

            // Convert MongoDB ObjectId to string for serialization
            const items = exams.map(exam => ({
                ...exam,
                _id: exam._id.toString()
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

        // If ID was provided return a single exam
        if (id) {
            const exam = await collection.findOne(filter);

            if (!exam) {
                return NextResponse.json(
                    { ok: false, error: "Exam not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                ...exam,
                _id: exam._id.toString(),
                lastUsed: exam.lastUsed ? new Date(exam.lastUsed).toISOString() : null
            });
        }
        // Otherwise return all matching exams (array)
        const exams = await collection.find(filter).sort(sort).toArray();

        const serializedExams = exams.map(exam => ({
            ...exam,
            _id: exam._id.toString(),
            lastUsed: exam.lastUsed ? new Date(exam.lastUsed).toISOString() : null
        }));

        return NextResponse.json(serializedExams);

    } catch (error) {
        console.error('Error fetching exams:', error);
        return NextResponse.json(
            { message: 'Error fetching exams' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Validate the ID
        if (!id) {
            return NextResponse.json(
                { ok: false, error: "Exam ID is required" },
                { status: 400 }
            );
        }

        // Check if the ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { ok: false, error: "Invalid exam ID" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const result = await db.collection("exams").deleteOne({ _id: new ObjectId(id) });

        // If no document was deleted, the exam was not found
        if (result.deletedCount === 0) {
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
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            title,
            subject,
            courseNum,
            timeLimit,
            randomize = true,
            totalQuestions,
            questionOrder,
            pointsByType,
            typeCounts,
            difficultyByType = {},
            userID,
            lastUsed,
            lastUsedFilterType = "before",
            lastUsedEnd,
        } = body;

        // create the connection
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const questionsdb = db.collection("questions"); // get the questions collection
        const usersdb = db.collection("users");

        let instructionsDoc = defaultInstructionsDoc;

        //get the users prefered instructions
        if (userID && ObjectId.isValid(userID)) {
            const user = await usersdb.findOne(
                { _id: new ObjectId(userID) },
                { projection: { instructionPrefs: 1 } }
            );

            instructionsDoc = user?.instructionPrefs?.examGeneration?.content ?? defaultInstructionsDoc;
        }

        const items: any[] = []; // array that will hold the questions for the exam

        const resolvedPoints: Record<string, number> = {
            ...DEFAULT_POINTS,
            ...(pointsByType || {}),
        };

        // Loop through each question type and grab -
        // the corresponding number of questions
        // Build pairs for type-count
        const pairs: Array<{ type: string; requested: number }> =
            Object.entries(typeCounts).map(([t, n]) => ({
                type: t,
                requested: Number(n) || 0,
            })).filter(p => p.requested > 0);


        // If a subject or course number is given, filter on those as well
        const subjectFilter = subject && subject.trim() !== "";
        const courseNumFilter = courseNum && courseNum.trim() !== "";

        // If a last used date is given, filter on that
        const lastUsedMatch: any = {};
        console.log("exam generation filters", {
            lastUsed,
            lastUsedFilterType,
            lastUsedEnd,
        });
        if (lastUsedFilterType === "never") {
            lastUsedMatch.$or = [{ lastUsed: null }, { lastUsed: { $exists: false } },];
        } 
        else if (lastUsed) {
            try {
                const [month, day, year] = lastUsed.split("-").map(Number);
                const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
                const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

                if (lastUsedFilterType === "before") {
                    lastUsedMatch.lastUsed = { $lt: startOfDay };
                }
                
                else if (lastUsedFilterType === "after") {
                    lastUsedMatch.lastUsed = { $gt: endOfDay };
                }
                else if (lastUsedFilterType === "range") {
                    if (lastUsedEnd) {
                        const [endMonth, endDay, endYear] = lastUsedEnd.split("-").map(Number);
                        const endOfRangeDay = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));

                        lastUsedMatch.lastUsed = {
                            $gte: startOfDay,
                            $lte: endOfRangeDay,
                        };
                    } else {
                        lastUsedMatch.lastUsed = {
                            $gte: startOfDay,
                            $lte: endOfDay,
                        };
                    }
                }
            } catch (error) {
                console.error("Error parsing lastUsed in POST /api/exams:", error);
            }
        }

        // Check availability for each type in the DB
        const shortages: Array<{ type: string; requested: number; available: number }> = [];

        //Store all selected question IDs for bulk update
        const selectedQuestionIds: ObjectId[] = [];

        for (const { type, requested } of pairs) {
            const match: any = { type };

            const rawDifficulty = difficultyByType?.[type];
            const parsedDifficulty =
                rawDifficulty === "" || rawDifficulty == null
                ? null
                : Number(rawDifficulty);

            if (Number.isInteger(parsedDifficulty)) {
                match.difficulty = parsedDifficulty;
            }

            match.userID = userID;
            if (subjectFilter) match.subject = subject;
            if (courseNumFilter) match.courseNum = courseNum;
            Object.assign(match, lastUsedMatch);

            const available = await questionsdb.countDocuments(match);
            if (available < requested) {
                shortages.push({ type, requested, available });
            }
        }

        // If there are shortages in the DB, fail
        if (shortages.length) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Not enough questions to create exam",
                    shortages
                },
                { status: 401 }
            );
        }

        // Now go through and grab questions if valid
        for (const { type, requested } of pairs) {
            const match: any = { type };
            
            const rawDifficulty = difficultyByType?.[type];
            const parsedDifficulty =
                rawDifficulty === "" || rawDifficulty == null
                ? null
                : Number(rawDifficulty);

            if (Number.isInteger(parsedDifficulty)) {
                match.difficulty = parsedDifficulty;
            }

            match.userID = userID;
            if (subjectFilter) match.subject = subject;
            if (courseNumFilter) match.courseNum = courseNum;
            Object.assign(match, lastUsedMatch);

            // Randomly sample questions for current type
            const sample = await questionsdb.aggregate([
                { $match: match },
                { $sample: { size: requested } }
            ]).toArray();

            // loop throup the array of sample questions and push them onto items
            for (const q of sample) {
                selectedQuestionIds.push(q._id); //Keep track of selected question IDs for later update of lastUsed
                items.push({
                    questionId: q._id,
                    type: q.type,
                    subject: q.subject,
                    courseNum: q.courseNum,
                    points: resolvedPoints[normalizeType(q.type)] ?? 1,
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

        // get the total points
        const totalPoints = computeTotalPoints(items);

        const examLastUsed = new Date();

        // Sort the order of types (MC, TF, FIB, Essay, Code by default)
        const TYPE_ORDER = questionOrder && questionOrder.length > 0
            ? questionOrder
            : ["MC", "TF", "FIB", "Essay", "Code"];

        items.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

        // Assign order to each question
        items.forEach((item, index) => {
            item.order = index + 1;
        });

        const exam_data = {
            title,
            subject,
            courseNum,
            timeLimitMin: timeLimit,
            difficultyByType,
            totalPoints,
            instructionsDoc,
            questions: items,
            lastUsed: examLastUsed,
            userID,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await db.collection("exams").insertOne(exam_data);

        //Update lastUsed for all selected questions
        if (selectedQuestionIds.length > 0) {
            await questionsdb.updateMany(
                { _id: { $in: selectedQuestionIds } },
                { $set: { lastUsed: examLastUsed } }
            );
        }

        return NextResponse.json(
            { ok: true, message: "Exam created!", exam: { ...exam_data, _id: result.insertedId.toString() } },
            { status: 201 }
        );
    } catch (error) {
        // Throw an error message for any unexpected server error
        console.error("Error adding exam: ", error)
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        console.log('PUT /api/exams received:', body);

        const { id, title, timeLimitMin, questions, instructionsDoc } = body;

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
        const questionsdb = database.collection('questions');

        // Check if exam exists
        const existingExam = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingExam) {
            return NextResponse.json(
                { ok: false, error: 'Exam not found' },
                { status: 404 }
            );
        }

        const totalPoints = questions.reduce((sum: number, q: any) => {
            return sum + (Number(q?.points) || 0);
        }, 0);

        //Set lastUsed
        const lastUsed = new Date();

        //Get all question IDs from the updated exam to update their lastUsed field in the questions collection
        const updatedQuestionIds = questions
            .map((q: any) => q.questionId)
            .filter((id: string | ObjectId) => id != null);

        // Update the exam
        const updateData = {
            title,
            timeLimitMin,
            totalPoints,
            questions,
            instructionsDoc,
            lastUsed,
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

        //Update lastUsed for all questions in the exam
        if (updatedQuestionIds.length > 0) {
            const objectIds = updatedQuestionIds.map((id: string) => {
                try {
                    return new ObjectId(id);
                } catch (error) {
                    return id;
                }
            });

            await questionsdb.updateMany(
                { _id: { $in: objectIds } },
                { $set: { lastUsed } }
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