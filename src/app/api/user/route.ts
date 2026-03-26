import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/libs/mongo";
import bcrypt from "bcryptjs"; //for password hashing
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

//function for eaiser viewing of instructions in mongo
//stores it as preview
function tiptapToPreview(doc: any): string {
  if (!doc?.content) return "";

  const lines: string[] = [];

  for (const node of doc.content) {
    if (node.type === "paragraph") {
      const text = (node.content ?? []).map((c: any) => c.text ?? "").join("");
      if (text.trim()) lines.push(text.trim());
    }

    if (node.type === "bulletList") {
      for (const item of node.content ?? []) {
        const para = item.content?.find((n: any) => n.type === "paragraph");
        const text = (para?.content ?? []).map((c: any) => c.text ?? "").join("");
        if (text.trim()) lines.push(`• ${text.trim()}`);
      }
    }
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        //the document that stores the users prefered instructions
        //makes sure every new user gets the default
        const defaultTipTapDoc = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
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
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        { type: "text", text: "Answer all questions in the space provided." },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        { type: "text", text: "Show your work where applicable. Circle or clearly mark your final answer." },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        { type: "text", text: "No unauthorized materials. Calculators allowed unless otherwise stated." },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        //Extract form fields
        const role = "teacher";
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const institution = formData.get("institution") as string;
        const department = formData.get("department") as string;
        const tSubject = formData.getAll("tSubject") as string[];
        const proofLink = formData.get("proofLink") as string;
        const proofFile = formData.get("proofFile") as File | null;
        const defaultPreview = tiptapToPreview(defaultTipTapDoc);
        //will be the prefered instuctions for all exams
        const instructionPrefs = {
            examGeneration: {
                editor: "tiptap",
                content: defaultTipTapDoc,
                preview: defaultPreview,
                updatedAt: new Date(),
            },
        };

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
            institution,
            department,
            tSubject,
            instructionPrefs,
            proofLink: proofLink || null,
            proofFile: fileData,
            createdOn: new Date(),
            domain: ".edu",
            status: "Pending"
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

        let proofContent = '';

        //If they submit a link
        if (proofLink) {
            proofContent = `
                    <p style="font-size: 16px; color: #1e3a8a; font-weight: 600;">Proof Link:</p>
                    <p style="font-size: 16px; background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 15px; border-radius: 6px;">
                        <a href="${proofLink}" target="_blank" style="color: #2563eb; text-decoration: none;">${proofLink}</a>
                    </p>
                `;
        }

        //If the submit a file
        if (fileData) {
            const fileUrl = `${process.env.NEXTAUTH_URL}/api/admin/view-document/${result.insertedId}`;
            proofContent = `
                    <p style="font-size: 16px; color: #1e3a8a; font-weight: 600;">Proof Document:</p>
                    <p style="font-size: 16px; background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 15px; border-radius: 6px;">
                        <strong>File Name:</strong> ${fileData.fileName}<br>
                        <a href="${fileUrl}" target="_blank" style="display: inline-block; margin-top: 10px; background: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none;">View Document</a>
                    </p>
                `;
        }

        //Check if Resend API key is correct
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                {
                    error: 'Email service is not configured',
                    success: false
                },
                { status: 500 }
            );
        }

        //Base URL for approve/deny buttons
        const baseUrl = process.env.NEXTAUTH_URL;

        //Send email to admin 
        const { data, error } = await resend.emails.send({
            from: 'Exam Genie <onboarding@resend.dev>',
            to: ['tgen57485@gmail.com'],
            subject: `New Teacher Registration: ${firstName} ${lastName}`,
            html: `
                    <div style="font-family: 'Inter', Arial, sans-serif; background: #f3f8ff; padding: 40px; border-radius: 12px;">
                        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                            
                            <div style="background: linear-gradient(to right, #60a5fa, #22d3ee, #2563eb); padding: 20px;">
                                <h1 style="margin: 0; font-size: 28px; text-align: center; font-weight: 700; color: white;">
                                    New Teacher Registration
                                </h1>
                            </div>

                            <div style="padding: 30px;">
                                <p style="font-size: 16px; color: #1e3a8a; font-weight: 600;">Teacher Information:</p>
                                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                    <p style="margin: 5px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
                                    <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
                                </div>

                                ${proofContent}

                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${baseUrl}/api/admin/update-user-status/${result.insertedId}?action=Approved" 
                                       style="background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-right: 10px; display: inline-block;">
                                        Approve
                                    </a>
                                    <a href="${baseUrl}/api/admin/update-user-status/${result.insertedId}?action=Denied" 
                                       style="background: #ef4444; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                                        Deny
                                    </a>
                                </div>

                                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                                    Click Approve to activate this teacher's account or Deny to reject the registration.
                                </p>
                            </div>
                        </div>
                    </div>
                `,
        });

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