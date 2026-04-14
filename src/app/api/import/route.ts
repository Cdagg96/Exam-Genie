import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, sourceQuestionId } = body;
        
        //No user ID or source question ID provided
        if (!userId || !sourceQuestionId) {
            return NextResponse.json(
                { ok: false, error: "Missing required fields: userId and sourceQuestionId" },
                { status: 400 }
            );
        }
        
        //Validate ObjectId format
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(sourceQuestionId)) {
            return NextResponse.json(
                { ok: false, error: "Invalid user ID or source question ID format" },
                { status: 400 }
            );
        }
        
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        
        //Check if the user exists
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return NextResponse.json(
                { ok: false, error: "User not found" },
                { status: 404 }
            );
        }
        
        //Get the source question
        const sourceQuestion = await db.collection("questions").findOne({ _id: new ObjectId(sourceQuestionId) });
        if (!sourceQuestion) {
            return NextResponse.json(
                { ok: false, error: "Source question not found" },
                { status: 404 }
            );
        }
        
        //Check if user already has a question with the same stem and type
        const existingQuestion = await db.collection("questions").findOne({
            userID: userId,
            stem: sourceQuestion.stem,
            type: sourceQuestion.type
        });
        
        if (existingQuestion) {
            return NextResponse.json(
                { 
                    ok: false, 
                    error: "You already have a similar question in your collection",
                    existing: true 
                },
                { status: 409 }
            );
        }

        //Create a new question object for import
        const importedQuestion: any = {
            stem: sourceQuestion.stem,
            type: sourceQuestion.type,
            difficulty: sourceQuestion.difficulty,
            topics: sourceQuestion.topics || [],
            lastUsed: null,
            userID: userId,
            createdOn: new Date(),
            lastUpdated: new Date(),
            subject: sourceQuestion.subject || null,
            courseNum: sourceQuestion.courseNum || null,
        };

        //Type-specific fields
        switch (sourceQuestion.type) {
            case 'MC':  //Multiple Choice
                if (sourceQuestion.choices) {
                    importedQuestion.choices = JSON.parse(JSON.stringify(sourceQuestion.choices));
                }
                break;
                
            case 'TF':  //True/False
                if (sourceQuestion.choices) {
                    importedQuestion.choices = JSON.parse(JSON.stringify(sourceQuestion.choices));
                }
                break;
                
            case 'FIB':  //Fill In The Blank
                if (sourceQuestion.answer) {
                    importedQuestion.answer = sourceQuestion.answer;
                }
                if (sourceQuestion.blankLines !== undefined) {
                    importedQuestion.blankLines = sourceQuestion.blankLines;
                }
                break;
                
            case 'Code':  //Coding question
                if (sourceQuestion.answer) {
                    importedQuestion.answer = sourceQuestion.answer;
                }
                if (sourceQuestion.lines !== undefined) {
                    importedQuestion.lines = sourceQuestion.lines;
                }
                break;
                
            case 'Essay':  //Essay question
                if (sourceQuestion.answer) {
                    importedQuestion.answer = sourceQuestion.answer;
                }
                if (sourceQuestion.lines !== undefined) {
                    importedQuestion.lines = sourceQuestion.lines;
                }
                break;
        }
        
        //Insert the imported question
        const result = await db.collection("questions").insertOne(importedQuestion);
        
        return NextResponse.json(
            { 
                ok: true, 
                message: "Question imported successfully!", 
                insertedId: result.insertedId 
            },
            { status: 201 }
        );
        
    } catch (error) {
        console.error("Error importing question: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}