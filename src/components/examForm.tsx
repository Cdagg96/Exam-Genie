"use client";
import jsPDF from "jspdf";
import React, { useState } from "react";
import toast from "react-hot-toast";
import ExamPreviewModel from "@/components/examPreview";
import SelectBox from "@/components/SelectBox";


export type QuestionType =
    | "MC"
    | "TF"
    | "Essay"
    | "FIB"
    | "Code";


const TYPES: { value: QuestionType; label: string }[] = [
    { value: "MC", label: "Multiple Choice" },
    { value: "TF", label: "True/False" },
    { value: "Essay", label: "Short Answer" },
    { value: "FIB", label: "Fill in the Blank" },
    { value: "Code", label: "Code" },
];


const DEFAULT_SECTION = {
    topic: "",
    count: 5,
    type: "multiple_choice" as QuestionType,
    difficulty: "mixed",
};

// What consists of an exam question
export type ExamQuestionItem = {
    questionId: string;
    type: QuestionType;
    points: number;
    order?: number;
    snapshot?:any; // Snapshot of question
}

// What consists of a whole exam
export type ExamDoc = {
    _id: string;
    title: string;
    timeLimitMin: number;
    difficulty: string;
    totalPoints: number;
    questions: ExamQuestionItem[];
}


export default function ExamForm() {
    // Core fields (minimal state)
    const [title, setTitle] = useState("");
    const [totalQuestions, setTotalQuestions] = useState(25);
    const [difficulty, setDifficulty] = useState("mixed");
    const [timeLimit, setTimeLimit] = useState(60);
    const [randomize, setRandomize] = useState(true);
    const [allowedTypes, setAllowedTypes] = useState<QuestionType[]>([
        "MC",
        "TF",
        "Essay",
    ]);
    const [typeCounts, setTypeCounts] = useState<Record<QuestionType, number>>({
        MC: 0,
        TF: 0,
        Essay: 0,
        FIB: 0,
        Code: 0,
    });


    // Simple optional sections (can remove if you want ultra-minimal)
    const [sections, setSections] = useState([{ ...DEFAULT_SECTION }]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewExam, setPreviewExam] = useState<ExamDoc | null>(null);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            title, 
            timeLimit, 
            difficulty, 
            allowedTypes,
            typeCounts,
            totalQuestions,
            questions: [],
            totalPoints: 0
        }

        try {
            const res = await fetch("../api/exams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if(res.ok){
                toast.success("Exam Created!") // Notification that question was created
                setPreviewExam(result.exam);
                setPreviewOpen(true);
            } 
            else if(result?.shortages?.length){
                const msg = result.shortages.map((s: any) =>
                    `${s.type}: requested ${s.requested}, available ${s.available}`
                ).join("\n");
                toast.error(`Not enough questions\n--------------\n ${msg}`, {duration: 10000});
            }
            else{
                console.error(result);
                toast.error("Failed to create exam");
            }
        } catch (error) {
            console.error(error);
            alert("Network/Server error");
        }

        const examSpec = { title, totalQuestions, difficulty, timeLimit, randomize, allowedTypes, sections };

        console.log("Exam Spec:", examSpec);

        const questions = Array.from({ length: examSpec.totalQuestions }, (_, i) => {
            // Pick type based on index (cycle through allowedTypes)
            const typeIndex = i % examSpec.allowedTypes.length;
            const type = examSpec.allowedTypes[typeIndex];

            return {
                number: i + 1,
                text: `Sample question ${i + 1}?`,
                type,
            };
        });

        //generateExamPDF(examSpec, questions);
    }

    return (
        <div className="mx-auto w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-white rounded-2xl p-4 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold">General</h2>
                    <div className="pl-40 pr-40 grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Title</span>
                            <input
                                className="rounded-xl border px-3 py-3 focus:outline-none focus:ring-2"
                                placeholder="Midterm – Algorithms"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Time Limit</span>
                            <input
                                type="number"
                                min={0}
                                className="rounded-xl border px-3 py-3 focus:outline-none focus:ring-2"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Difficulty</span>
                            <select
                                className="rounded-xl border px-3 py-3 focus:outline-none focus:ring-2"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                required
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="mixed">Mixed</option>
                            </select>
                        </label>
                    </div>
                    <h2 className="mb-3 mt-8 text-lg font-semibold">Allowed Question Types</h2>
                    <p className="mb-3 text-sm text-gray-600">
                        Set how many questions of each type you want. Use 0 to exclude a type.
                    </p>
                    <div className="pl-40 pr-40 grid gap-4 sm:grid-cols-3">
                        {TYPES.map((t) => (
                            <label key={t.value} className="flex flex-col gap-2">
                                <span className="text-sm font-medium">{t.label}</span>
                                <input
                                    type="number"
                                    min={0}
                                    className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
                                    value={typeCounts[t.value]}
                                    onChange={e => setTypeCounts(prev => ({ ...prev, [t.value]: Number(e.target.value) }))}
                                />
                                
                            </label>
                        ))}
                    </div>
                </section>
                {/* Allowed Types */}
                
                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setTitle("");
                                setTotalQuestions(25);
                                setDifficulty("mixed");
                                setTimeLimit(60);
                                setRandomize(true);
                                setAllowedTypes(["MC", "TF", "Essay"]);
                                setSections([{ ...DEFAULT_SECTION }]);
                            }}
                            className="rounded-xl border px-4 py-2 btn btn-ghost"
                        >
                            Reset
                        </button>
                        <button type="submit" className="btn btn-primary-blue rounded-xl px-5 py-2">
                            Generate
                        </button>
                    </div>
                </div>
            </form>
            <ExamPreviewModel
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                exam={previewExam}
            />
        </div>
    );
}



function generateExamPDF(examSpec: any,
    questions: { number: number; text: string; type: string }[]
) {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(examSpec.title || "Untitled Exam", 10, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    let y = 35;

    const maxLabelIndex = examSpec.allowedTypes.length;

    questions.forEach((q, idx) => {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }

        let questionText = `${q.number}.`;

        if (idx < maxLabelIndex) {
            if (q.type === "multiple_choice") questionText += " Example multiple choice";
            else if (q.type === "true_false") questionText += " Example true/false";
            else questionText += ` Example ${q.type.replace("_", " ")}`;
        }

        doc.text(questionText, 10, y);
        y += 8;
    });



    doc.save(`${examSpec.title || "exam"}.pdf`);
}