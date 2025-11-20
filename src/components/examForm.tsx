"use client";
import jsPDF from "jspdf";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ExamPreviewModel from "@/components/examPreview";
import SelectBox from "@/components/SelectBox";
import { useAuth } from "@/components/AuthContext";
import { ExamDoc, ExamQuestionItem, QuestionType } from "@/types/exam";


const TYPES: { value: QuestionType; label: string }[] = [
    { value: "MC", label: "Multiple Choice" },
    { value: "TF", label: "True/False" },
    { value: "Essay", label: "Short Answer" },
    { value: "FIB", label: "Fill in the Blank" },
    { value: "Code", label: "Code" },
];


const DEFAULT_SECTION = {
    topic: "",
    subject: "",
    count: 5,
    type: "multiple_choice" as QuestionType,
    difficulty: "mixed",
};


export default function ExamForm() {
    // Core fields (minimal state)
    const { user } = useAuth(); 
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [courseNum, setCourseNum] = useState("");
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

    // For select dropdown
    const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
    const [courseNums, setCourseNums] = useState<{ value: string; label: string }[]>([]);

    // Simple optional sections (can remove if you want ultra-minimal)
    const [sections, setSections] = useState([{ ...DEFAULT_SECTION }]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewExam, setPreviewExam] = useState<ExamDoc | null>(null);
    const [generating, setGenerating] = useState(false);

    //Runs when page opens to get subjects
    useEffect(() => {
        async function loadSubjects(){
            try {
                const response = await fetch("/api/subjects");
                const data = await response.json();

                if(!response.ok || !data.ok){
                    console.log("Failed to load subjects: ", data);
                    return
                }

                const options = data.subjects.map((s: string) => ({
                    value: s,
                    label: s
                }))

                setSubjects([
                    { value: '', label: 'All Subjects' },
                    ...options
                ]);
            } catch (error) {
                console.error("Error fetching subjects");
                
            }
        }

        async function loadCourseNums(){
            try {
                const response = await fetch("/api/course_numbers");
                const data = await response.json();

                if(!response.ok || !data.ok){
                    console.log("Failed to load course numbers: ", data);
                    return
                }

                const options = data.courseNums.map((s: string) => ({
                    value: s,
                    label: s
                }))

                setCourseNums([
                    { value: '', label: 'All Course Numbers' },
                    ...options
                ]);
            } catch (error) {
                console.error("Error fetching subjects");
                
            }
        }

        loadCourseNums();
        loadSubjects();
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        //Check if user is logged in
        if (!user) {
            toast.error("You must be logged in to generate exams");
            return;
        }

        setGenerating(true);

        const data = {
            title,
            subject,
            courseNum,
            timeLimit,
            difficulty,
            allowedTypes,
            typeCounts,
            totalQuestions,
            questions: [],
            totalPoints: 0,
            userID: user._id
        }

        try {
            const res = await fetch("../api/exams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                toast.success("Exam Created!") // Notification that question was created
                setPreviewExam(result.exam);
                setPreviewOpen(true);
            }
            else if (result?.shortages?.length) {
                const msg = result.shortages.map((s: any) =>
                    `${s.type}: requested ${s.requested}, available ${s.available}`
                ).join("\n");
                toast.error(`Not enough questions\n--------------\n ${msg}`, { duration: 10000 });
            }
            else {
                console.error(result);
                toast.error("Failed to create exam");
            }
        } catch (error) {
            console.error(error);
            alert("Network/Server error");
        } finally {
            setGenerating(false);
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
                            <span className="text-sm font-medium">Difficulty</span>
                            {/* Difficulty Filter */}
                            <SelectBox
                                label=""
                                options={[
                                    { value: '', label: 'All Difficulties' },
                                    { value: 'easy', label: 'Easy' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'hard', label: 'Hard' },
                                    { value: 'mixed', label: 'Mixed' },
                                ]}
                                onSelect={setDifficulty}
                                defaultValue="mixed"
                                value={difficulty}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Subject</span>
                            <SelectBox
                                label=""
                                options={subjects}
                                placeholder="All Subjects"
                                onSelect={setSubject}
                                defaultValue=""
                                value={subject}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Course Number</span>
                            <SelectBox
                                label=""
                                options={courseNums}
                                placeholder="All Course Numbers"
                                onSelect={setCourseNum}
                                defaultValue=""
                                value={courseNum}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Time Limit</span>
                            <input
                                type="number"
                                min={0}
                                className="rounded-xl border px-3 py-3 focus:outline-none focus:ring-2"
                                placeholder="60"
                                value={timeLimit || ""}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                required
                            />
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
                                    placeholder="0"
                                    className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
                                    value={typeCounts[t.value] || ""}
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
                                setCourseNum("");
                                setSubject("");
                                setTimeLimit(60);
                                setRandomize(true);
                                setAllowedTypes(["MC", "TF", "Essay"]);
                                setSections([{ ...DEFAULT_SECTION }]);
                                setTypeCounts({
                                    MC: 0,
                                    TF: 0,
                                    Essay: 0,
                                    FIB: 0,
                                    Code: 0,
                                });
                            }}
                            className="rounded-xl border px-4 py-2 btn btn-ghost"
                        >
                            Reset
                        </button>
                        <button type="submit" className="btn btn-primary-blue rounded-xl px-5 py-2" disabled={generating || !user}>
                            {generating ? "Generating..." : "Generate Exam"}
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