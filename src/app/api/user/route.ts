import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import bcrypt from "bcryptjs"; //for password hashing

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        //Extract form fields
        const role = formData.get("role") as string;
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const proofLink = formData.get("proofLink") as string;
        const proofFile = formData.get("proofFile") as File | null;

        // validate the data coming in
        if (!role || !email || !password || !firstName || !lastName || !phone || (!proofLink && !proofFile)) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        //Handle file upload if exists
        let fileData = null;
        if (proofFile && proofFile.size > 0) {
            //Validate file type
            const validTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/jpeg",
                "image/png",
                "image/jpg",
            ];

            if (!validTypes.includes(proofFile.type)) {
                return NextResponse.json(
                    { ok: false, message: "Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files." },
                    { status: 400 }
                );
            }

            //Validate file size (10MB max)
            if (proofFile.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { ok: false, message: "File size exceeds 10MB limit" },
                    { status: 400 }
                );
            }

            //Convert file to buffer for MongoDB storage
            const bytes = await proofFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            fileData = {
                fileName: proofFile.name,
                fileType: proofFile.type,
                fileSize: proofFile.size,
                data: buffer,
                uploadedAt: new Date(),
            };
        }

        const body = {
            role,
            firstName,
            lastName,
            phone,
            email,
            password: hashedPassword,
            proofLink: proofLink || null,
            proofFile: fileData,
            createdOn: new Date(),
            domain: ".edu",
            status: "Disabled"
        };


        // Insert the data into mongoDB
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        //check to see if the user is already in the database
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { ok: false, message: "Email Already Registered" },
                { status: 400 }
            );
        }

        const result = await db.collection("users").insertOne(body);

        return NextResponse.json(
            { ok: true, message: "User Registration Successful!", insertedId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        // Throw an error message for any unexpected server error
        console.error("Error adding user: ", error);
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}