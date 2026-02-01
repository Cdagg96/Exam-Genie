
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/libs/mongo';
import { parse } from 'csv-parse/sync';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const userID = formData.get('userID') as string;
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const fileBuffer = await file.arrayBuffer();
        const fileContent = Buffer.from(fileBuffer).toString('utf-8');
        
        //Parse CSV
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        
        const questionsToInsert = records.map((record: any) => {
            //Base question structure
            const question: any = {
                stem: record.stem,
                type: record.type,
                difficulty: parseInt(record.difficulty) || 1,
                topics: record.topics ? record.topics.split(',').map((t: string) => t.trim()) : [],
                lastUsed: null,
                userID: userID || null,
                createdOn: new Date(),
                lastUpdated: new Date()
            };

            //Add subject and courseNum if provided
            if (record.subject && record.subject.trim() !== '') {
                question.subject = record.subject;
            }
            if (record.courseNum && record.courseNum.trim() !== '') {
                question.courseNum = record.courseNum;
            }

            //Handle different question types
            if (record.type === 'MC') {
                //Multiple Choice
                question.choices = [];
                
                //Parse choices A, B, C
                ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
                    const choiceText = record[`choice${letter}`];
                    if (choiceText && choiceText.trim() !== '') {
                        question.choices.push({
                            label: letter,
                            text: choiceText.trim(),
                            isCorrect: record.correctAnswer === letter
                        });
                    }
                });

            } else if (record.type === 'TF') {
                question.choices = [
                    {
                        label: "True",
                        text: "True",
                        isCorrect: record.correctAnswer === "A" || record.correctAnswer === "True"
                    },
                    {
                        label: "False", 
                        text: "False",
                        isCorrect: record.correctAnswer === "B" || record.correctAnswer === "False"
                    }
                ];

            } else if (record.type === 'FIB') {
                //Fill in the Blank
                question.answer = record.answer || '';
                question.blankLines = parseInt(record.blankLines) || 1;

            } else if (record.type === 'Essay') {
                //Essay
                question.answer = record.answer || '';
                question.lines = parseInt(record.lines) || 1;

            } else if (record.type === 'Code') {
                //Code
                question.answer = record.answer || '';
                question.lines = parseInt(record.lines) || 1;
            }

            return question;
        });

        //Validate required fields
        for (const question of questionsToInsert) {
            if (!question.stem || !question.type || !question.difficulty || !question.topics.length) {
                return NextResponse.json(
                    { error: 'Missing required fields in one or more questions' },
                    { status: 400 }
                );
            }

            //Validate question type
            const validTypes = ['MC', 'TF', 'FIB', 'Essay', 'Code'];
            if (!validTypes.includes(question.type)) {
                return NextResponse.json(
                    { error: `Invalid question type: ${question.type}. Must be one of: MC, TF, FIB, Essay, Code` },
                    { status: 400 }
                );
            }

            //Validate MC/TF have choices
            if ((question.type === 'MC' || question.type === 'TF') && (!question.choices || question.choices.length === 0)) {
                return NextResponse.json(
                    { error: 'MC and TF questions must have choices' },
                    { status: 400 }
                );
            }

            //Validate FIB, Essay, Code have answers
            if ((question.type === 'FIB' || question.type === 'Essay' || question.type === 'Code') && !question.answer) {
                return NextResponse.json(
                    { error: `${question.type} questions must have an answer` },
                    { status: 400 }
                );
            }
        }

        //Insert into database
        const result = await db.collection('questions').insertMany(questionsToInsert);

        return NextResponse.json({
            message: 'Questions imported successfully',
            importedCount: result.insertedCount
        });

    } catch (error) {
        console.error('Error importing CSV:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}