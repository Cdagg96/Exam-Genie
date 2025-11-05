import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import { ObjectId } from "mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const database = client.db(process.env.MONGODB_DB);
        const collection = database.collection('exams');

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