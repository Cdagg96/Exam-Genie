import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";
import bcrypt from "bcryptjs"; //for password hashing

export async function POST(req:Request) {
    try {
        const {email, password} = await req.json();

        // validate the data coming in
        if (!email || !password) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }
        
        // check if the user exists in the database with the given email
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const user = await db.collection("users").findOne({ email });

        // if the user does not exist, return email not found
        if(!user) {
            return NextResponse.json(
                {ok: false, message: "Email not found"},
                {status: 404}
            );
        }

        // if the password does not match, return incorrect password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if(!passwordMatch) {
            return NextResponse.json(
                {ok: false, message: "Incorrect password"},
                {status: 401}
            );
        }

        const userData = {
            _id: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        // if both email and password match, return success
        return NextResponse.json(
            {ok: true, message: "Login successful", user},
            {status: 200}
        );
    } catch (error) {
        // throw an error message for any unexpected server error
        console.error("Error during login: ", error)
        return NextResponse.json(
            {ok: false, error: "Internal server error"},
            {status: 500}
        );
    }       
}