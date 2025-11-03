"use client";
import jsPDF from "jspdf";
import React, { useState } from "react";
import toast from "react-hot-toast";


export type QuestionType =
    | "MC"
    | "TF"
    | "Essay"
    | "FIB"
    | "Coding";


const TYPES: { value: QuestionType; label: string }[] = [
    { value: "MC", label: "Multiple Choice" },
    { value: "TF", label: "True/False" },
    { value: "Essay", label: "Short Answer" },
    { value: "FIB", label: "Fill in the Blank" },
    { value: "Coding", label: "Coding" },
];


const DEFAULT_SECTION = {
    topic: "",
    count: 5,
    type: "multiple_choice" as QuestionType,
    difficulty: "mixed",
};


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
        MC: 10,
        TF: 5,
        Essay: 0,
        FIB: 0,
        Coding: 0,
    });


    // Simple optional sections (can remove if you want ultra-minimal)
    const [sections, setSections] = useState([{ ...DEFAULT_SECTION }]);


    const toggleType = (t: QuestionType) => {
        setAllowedTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
        );
    };


    const updateSection = (i: number, patch: Partial<typeof DEFAULT_SECTION>) => {
        setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    };


    const addSection = () => setSections((p) => [...p, { ...DEFAULT_SECTION }]);
    const removeSection = (i: number) => setSections((p) => p.filter((_, idx) => idx !== i));


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

        generateExamPDF(examSpec, questions);
    }

    return (
        <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-2xl border p-4 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold">General</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Title</span>
                            <input
                                className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
                                placeholder="Midterm – Algorithms"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Total Questions</span>
                            <input
                                type="number"
                                min={1}
                                className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
                                value={totalQuestions}
                                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Time Limit</span>
                            <input
                                type="number"
                                min={0}
                                className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Difficulty</span>
                            <select
                                className="rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2"
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
                </section>
                {/* Allowed Types */}
                <section className="rounded-2xl border p-4 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold">Allowed Question Types</h2>
                    <p className="mb-3 text-sm text-gray-600">
                        Set how many questions of each type you want. Use 0 to exclude a type.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {TYPES.map((t) => (
                            <label key={t.value} className="inline-flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
                                    value={typeCounts[t.value]}
                                    onChange={e => setTypeCounts(prev => ({ ...prev, [t.value]: Number(e.target.value) }))}
                                />
                                <span>{t.label}</span>
                            </label>
                        ))}
                    </div>
                </section>
                <div className="flex items-center justify-end gap-3">
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
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button type="submit" className="rounded-xl bg-black px-5 py-2 text-white shadow hover:opacity-90">
                        Generate
                    </button>
                </div>
            </form>
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