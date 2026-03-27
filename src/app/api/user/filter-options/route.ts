import { NextResponse } from "next/server";
import clientPromise from "@/libs/mongo";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const users = await db.collection("users").find(
            {},
            {
                projection: {
                    firstName: 1,
                    lastName: 1,
                    institution: 1,
                    tSubject: 1,
                    department: 1,
                },
            }
        ).toArray();

        const names = Array.from(
            new Set(
                users
                    .map((user) =>
                        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                    )
                    .filter((name) => name !== "")
            )
        ).sort();

        const institutions = Array.from(
            new Set(
                users
                    .map((user) => user.institution?.trim())
                    .filter((value) => value)
            )
        ).sort();

        const subjects = Array.from(
            new Set(
                users
                    .flatMap((user) =>
                        Array.isArray(user.tSubject) ? user.tSubject : []
                    )
                    .map((subject) => subject?.trim())
                    .filter((value) => value)
            )
        ).sort();

        const departments = Array.from(
            new Set(
                users
                    .map((user) => user.department?.trim())
                    .filter((value) => value)
            )
        ).sort();

        return NextResponse.json({
            names,
            institutions,
            subjects,
            departments,
        });
    } catch (error) {
        console.error("Error fetching filter options:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}