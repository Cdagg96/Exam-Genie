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
    const [availableCounts, setAvailableCounts] = useState<Record<QuestionType, number>>({
        MC: 0,
        TF: 0,
        Essay: 0,
        FIB: 0,
        Code: 0,
    });
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
    const [pointsByType, setPointsByType] = useState<Record<QuestionType, string>>({
        MC: "1",
        TF: "1",
        FIB: "1",
        Essay: "5",
        Code: "10",
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
        const userID = user?._id;
        if (!userID) return;
        async function loadSubjects() {
            try {
                const response = await fetch(`/api/subjects?userID=${userID}`);
                const data = await response.json();

                if (!response.ok || !data.ok) {
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

        async function loadCourseNums() {
            try {
                const response = await fetch(`/api/course_numbers?userID=${userID}`);
                const data = await response.json();

                if (!response.ok || !data.ok) {
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

        async function loadQuestionTypeCounts() {
            setAvailableCounts({
                MC: 0,
                TF: 0,
                Essay: 0,
                FIB: 0,
                Code: 0,
            });

            if (!user) {
                return;
            }

            const params = new URLSearchParams();
            params.set("userID", String(user._id));
            params.set("counts", "1");
            if (difficulty && difficulty !== "mixed") params.set("difficulty", difficulty);
            if (subject) params.set("subject", subject);
            if (courseNum) params.set("courseNum", courseNum);

            try {
                params.set("counts", "1");
                const res = await fetch(`/api/questions?${params.toString()}`);
                if (!res.ok) {
                    const text = await res.text();
                    console.error("Counts failed:", res.status, res.statusText, text);
                    return;
                }

                const data = await res.json();


                setAvailableCounts({
                    MC: data?.counts?.MC ?? 0,
                    TF: data?.counts?.TF ?? 0,
                    Essay: data?.counts?.Essay ?? 0,
                    FIB: data?.counts?.FIB ?? 0,
                    Code: data?.counts?.Code ?? 0,
                });

            } catch (err) {
                console.error("Error fetching question counts:", err);
            }
        }

        loadCourseNums();
        loadSubjects();
        loadQuestionTypeCounts();
    }, [user?._id, difficulty, subject, courseNum]);

    // States for ordering question by type
    const [questionOrder, setQuestionOrder] = useState<QuestionType[]>([]);
    const [draggedType, setDraggedType] = useState<QuestionType | null>(null);
    const [hoveredType, setHoveredType] = useState<QuestionType | null>(null);
    const [dropType, setDropType] = useState<number | null>(null);

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, type: QuestionType) => {
        e.dataTransfer.setData("text/plain", type);
        setDraggedType(type);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDropType(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();

        if (draggedType === null) return; // No type being dragged

        const newOrder = [...questionOrder]; // Keep current question ordering
        const oldIndex = newOrder.indexOf(draggedType); // Get the index where the dragged type was

        if (oldIndex === -1) return;

        newOrder.splice(oldIndex, 1); // Remove the dragged type from old position

        let newIndex = index; // Set new index to drop position

        // Adjust index if it was after the old index
        if (oldIndex < index) {
            newIndex = index - 1;
        }

        newOrder.splice(newIndex, 0, draggedType); // Insert the dragged type at new position

        setQuestionOrder(newOrder);
        setDraggedType(null);
        setDropType(null);
    };

    // Update the question ordering when the counts of the types change
    useEffect(() => {
        setQuestionOrder(prev => {
            const selectedTypes = Object.entries(typeCounts)
                .filter(([_, count]) => count > 0) // Only keep types with count larger than 0
                .map(([type]) => type as QuestionType);

            const filtered = prev.filter(t => selectedTypes.includes(t)); // Keep existing order and remove deleted types
            const newOnes = selectedTypes.filter(t => !filtered.includes(t)); // Add newly selected types to the end

            return [...filtered, ...newOnes]; // Combine the existing ordered types as well as new ones
        });
    }, [typeCounts]);

    //this is to convert the string in the points box to an integer 
    function normalizePoints(p: Record<QuestionType, string>) {
        const toNum = (s: string) => {
            if (s === "" || s == null) return 1;
            const n = Number(s);
            return Number.isFinite(n) && n >= 0 ? n : 1;
        };

        return {
            MC: toNum(p.MC),
            TF: toNum(p.TF),
            FIB: toNum(p.FIB),
            Essay: toNum(p.Essay),
            Code: toNum(p.Code),
        } satisfies Record<QuestionType, number>;
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user is logged in
        if (!user) {
            toast.error("You must be logged in to generate exams");
            return;
        }

        let emptyCount = true; // Flag to check if all counts are zero

        // Go through all question types to see if any count is greater than zero
        for (const count of Object.values(typeCounts)) {
            if (count > 0) {
                emptyCount = false; // Found at least one question
                break;
            }
        }

        // If all counts are zero, show an error and return before generating exam
        if (emptyCount) {
            toast.error("Select at least one question");
            return;
        }

        setGenerating(true);

        const normalizedPointsByType = normalizePoints(pointsByType);
        const data = {
            title,
            subject,
            courseNum,
            timeLimit,
            difficulty,
            allowedTypes,
            typeCounts,
            totalQuestions,
            questionOrder,
            pointsByType: normalizedPointsByType,
            questions: [],
            totalPoints: 0,
            userID: user?._id ?? ""
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
                <section className="bg-primary border-primary rounded-2xl p-4 min-h-fit">
                    <h2 className="mb-3 text-lg font-semibold text-primary">General</h2>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-primary">Title</span>
                            <input
                                className="border border-primary text-secondary px-3 py-3"
                                placeholder="ex: Midterm - Algorithms"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-primary">Difficulty</span>
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
                            <span className="text-sm font-medium text-primary">Subject</span>
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
                            <span className="text-sm font-medium text-primary">Course Number</span>
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
                            <span className="text-sm font-medium text-primary">Time Limit (minutes)</span>
                            <input
                                type="number"
                                min={0}
                                className="border border-primary text-secondary px-3 py-3"
                                placeholder="60"
                                value={timeLimit || ""}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                required
                            />
                        </label>
                    </div>

                    <div className="border-t border-primary my-8"></div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Allowed Question Types */}
                        <div>
                            <h2 className="mb-3 text-lg font-semibold text-primary">Allowed Question Types</h2>
                            <p className="mb-3 text-sm text-secondary">
                                Set how many questions of each type you want. Use 0 to exclude a type.
                            </p>
                            <div className="pl-40 pr-40 grid gap-4 sm:grid-cols-1">
                            {TYPES.map((t) => (
                                <label key={t.value} className="flex flex-col">
                                    <span className="text-sm font-medium text-primary">{t.label}</span>
                                    {user && (
                                        <span className="text-base text-secondary">
                                            {availableCounts[t.value] ?? 0} questions available
                                        </span>
                                    )}
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        className="border border-primary text-secondary px-2 "
                                        value={typeCounts[t.value] || ""}
                                        onChange={e => setTypeCounts(prev => ({ ...prev, [t.value]: Number(e.target.value) }))}
                                    />

                                </label>
                            ))}
                            </div>
                        </div>
                        {/* Question Order */}
                        <div>
                            <h2 className="mb-3 text-lg font-semibold text-primary">Question Order</h2>

                            {/* Instructions */}
                            <p className="mb-3 text-sm text-secondary">
                                Drag and drop the question types to set the order they will appear in the exam.
                            </p>

                            <div className="flex justify-center flex-wrap">
                                <div className="pl-40 pr-40 w-full max-w-[1000px]">
                                    <div className="max-w-md mx-auto">
                                        {/* If the user has not selected a question display more instructions */}
                                        {questionOrder.length === 0 ? (
                                            <p className="text-center text-sm text-secondary">
                                                Add a question on the left to see it appear here.
                                            </p>
                                        ) : (
                                            // Start displaying the drag and drop box 
                                            <div className="border border-primary text-secondary px-3 py-3">
                                                <div className="space-y-3">
                                                    { /* Render each question type in the current user order */}
                                                    {questionOrder.map((type) => (
                                                        <div
                                                            key={type}
                                                            draggable
                                                            onDragStart={() => setDraggedType(type)}
                                                            onDragEnd={() => {
                                                                // Reset the drag and hover states if user drops the selected box before swapping
                                                                setHoveredType(null);
                                                                setDraggedType(null);
                                                            }}
                                                            onDragOver={(e) => {
                                                                e.preventDefault();

                                                                // Show the hovered type as a swap option if its different from the dragged type
                                                                if (draggedType && draggedType !== type) {
                                                                    setHoveredType(type);
                                                                }
                                                            }}
                                                            onDragLeave={() => setHoveredType(null)}
                                                            onDrop={() => {
                                                                if (!draggedType || draggedType === type) return;
                                                                
                                                                // Update the question order state
                                                                setQuestionOrder((prev) => {
                                                                    const newOrder = [...prev];

                                                                    // Get the two indices of the swapped types
                                                                    const oldIndex = newOrder.indexOf(draggedType);
                                                                    const newIndex = newOrder.indexOf(type);

                                                                    // Swap the two type positions in the array
                                                                    const temp = newOrder[oldIndex];
                                                                    [newOrder[oldIndex] = newOrder[newIndex]];
                                                                    [newOrder[newIndex] = temp];

                                                                    return newOrder;
                                                                });

                                                                // Reset the drag and hover states
                                                                setDraggedType(null);
                                                                setHoveredType(null);
                                                            }}
                                                            className={
                                                                `relative cursor-move rounded-xl border bg-secondary px-4 py-3 shadow flex items-center justify-center text-sm select-none transition-all hover:shadow-md
                                                                ${draggedType === type ? "opacity-50 scale-105 z-10" : ""}
                                                                ${hoveredType === type && draggedType ? "ring-1 ring-black" : ""}
                                                            `}
                                                        >
                                                            { /* Display the priority on the left of box */ }
                                                            <span className="absolute left-3 font-medium text-primary">
                                                                {questionOrder.indexOf(type) + 1}
                                                            </span>
                                                            
                                                            { /* Display the question type name */ }
                                                            <span className="font-medium text-primary">
                                                                {TYPES.find(t => t.value === type)?.label}
                                                            </span>
                                                            
                                                            { /* Display a swap icon on the right of box when dragging and hovering */}
                                                            {hoveredType === type && draggedType && (
                                                                <div className="absolute right-3 pointer-events-none text-black">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-primary my-8"></div>

                    <h2 className="mb-3 mt-8 text-lg font-semibold text-primary">Point Values</h2>
                    <p className="mb-3 text-sm text-secondary">
                        Default values can be set here and adjusted later in Edit Exam.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {TYPES.map((t) => {
                            return (
                                <label key={t.value} className="flex flex-col gap-2">
                                    <span className="text-sm font-medium text-primary">{t.label}</span>

                                    <input
                                        type="number"
                                        min={0}
                                        placeholder={"0"}
                                        className="border-primary text-secondary px-3 py-3"
                                        value={pointsByType[t.value] ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setPointsByType((prev) => ({
                                                ...prev,
                                                [t.value]: v,
                                            }))
                                        }}
                                    />
                                </label>
                            );
                        })}
                    </div>
                </section>
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
                                setPointsByType({MC: "1",TF: "1",FIB: "1",Essay: "5",Code: "10",});
                                setAllowedTypes(["MC", "TF", "Essay"]);
                                setSections([{ ...DEFAULT_SECTION }]);
                                setTypeCounts({
                                    MC: 0,
                                    TF: 0,
                                    Essay: 0,
                                    FIB: 0,
                                    Code: 0,
                                });
                                setQuestionOrder([]);
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