"use client";
import jsPDF from "jspdf";
import React, { useState } from "react";
// Minimal UI-only form for exam generation (no API calls)
// File: app/components/ExamForm.tsx
// Usage (example): app/exams/new/page.tsx -> import and render <ExamForm/>


export type QuestionType =
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "fill_in_blank"
    | "coding";


const TYPES: { value: QuestionType; label: string }[] = [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "true_false", label: "True/False" },
    { value: "short_answer", label: "Short Answer" },
    { value: "fill_in_blank", label: "Fill in the Blank" },
    { value: "coding", label: "Coding" },
];


const DIFFICULTIES = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "mixed", label: "Mixed" },
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
        "multiple_choice",
        "true_false",
        "short_answer",
    ]);


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


    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        // UI-only: do nothing for now. Keep this console for dev visibility.

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
            <form onSubmit={onSubmit} className="space-y-6">
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
                            />
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
                                //className="h-4 w-4"
                                //checked={allowedTypes.includes(t.value)}
                                //onChange={() => toggleType(t.value)}
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
                            setAllowedTypes(["multiple_choice", "true_false", "short_answer"]);
                            setSections([{ ...DEFAULT_SECTION }]);
                        }}
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button type="submit" className="rounded-xl bg-black px-5 py-2 text-white shadow hover:opacity-90">
                        Save (Simple PDF ONLY)
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