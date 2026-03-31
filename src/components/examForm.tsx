"use client";
import jsPDF from "jspdf";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ExamPreviewModel from "@/components/examPreview";
import SelectBox from "@/components/SelectBox";
import { useAuth } from "@/components/AuthContext";
import { ExamDoc, ExamQuestionItem, QuestionType } from "@/types/exam";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

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

const DEFAULT_DIFFICULTY_BY_TYPE: Record<QuestionType, string> = {
    MC: "",
    TF: "",
    Essay: "",
    FIB: "",
    Code: "",
};


export default function ExamForm() {
    // Core fields (minimal state)
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [courseNum, setCourseNum] = useState("");
    const [totalQuestions, setTotalQuestions] = useState(25);
    //const [difficulty, setDifficulty] = useState("mixed");
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
    const [difficultyByType, setDifficultyByType] =
        useState<Record<QuestionType, string>>(DEFAULT_DIFFICULTY_BY_TYPE);

    // For select dropdown
    const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
    const [courseNums, setCourseNums] = useState<{ value: string; label: string }[]>([]);


    const [sections, setSections] = useState([{ ...DEFAULT_SECTION }]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewExam, setPreviewExam] = useState<ExamDoc | null>(null);
    const [generating, setGenerating] = useState(false);

    //for the calander and last use date 
    const [lastUsedDate, setLastUsedDate] = useState<Dayjs | null>(null);
    const [dateInputValue, setDateInputValue] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLDivElement | null>(null);
    const [lastUsedFilterType, setLastUsedFilterType] = useState<'before' | 'after' | 'range' | 'never'>('before');
    const [lastUsedDateEnd, setLastUsedDateEnd] = useState<Dayjs | null>(null);
    const [dateInputValueEnd, setDateInputValueEnd] = useState('');
    const [calendarEndOpen, setCalendarEndOpen] = useState(false);
    const [calendarEndAnchorEl, setCalendarEndAnchorEl] = useState<HTMLDivElement | null>(null);

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
            if (difficultyByType.MC) params.set("mcDifficulty", difficultyByType.MC);
            if (difficultyByType.TF) params.set("tfDifficulty", difficultyByType.TF);
            if (difficultyByType.Essay) params.set("essayDifficulty", difficultyByType.Essay);
            if (difficultyByType.FIB) params.set("fibDifficulty", difficultyByType.FIB);
            if (difficultyByType.Code) params.set("codeDifficulty", difficultyByType.Code);
            if (subject) params.set("subject", subject);
            if (courseNum) params.set("courseNum", courseNum);
            if (lastUsedFilterType === "never") {
                params.set("lastUsedFilterType", "never");
            } 
            else if (lastUsedDate) {
                params.set("lastUsed", lastUsedDate.format("MM-DD-YYYY"));
                params.set("lastUsedFilterType", lastUsedFilterType);

                if (lastUsedFilterType === "range" && lastUsedDateEnd) {
                    params.set("lastUsedEnd", lastUsedDateEnd.format("MM-DD-YYYY"));
                }
            }

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
    }, [user?._id, difficultyByType, subject, courseNum, lastUsedDate, lastUsedFilterType, lastUsedDateEnd,]);

    // States for ordering question by type
    const [questionOrder, setQuestionOrder] = useState<QuestionType[]>([]);
    const [draggedType, setDraggedType] = useState<QuestionType | null>(null);
    const [hoveredType, setHoveredType] = useState<QuestionType | null>(null);
    const [dropType, setDropType] = useState<number | null>(null);

    //last use date handlers
    const handleDateInputChange = (inputValue: string) => {
        setDateInputValue(inputValue);

        const parsedDate = dayjs(inputValue, 'MM/DD/YYYY', true);
        if (parsedDate.isValid()) {
            setLastUsedDate(parsedDate);
        } else {
            setLastUsedDate(null);
        }
    };

    const handleDateInputChangeEnd = (inputValue: string) => {
        setDateInputValueEnd(inputValue);

        const parsedDate = dayjs(inputValue, 'MM/DD/YYYY', true);
        if (parsedDate.isValid()) {
            setLastUsedDateEnd(parsedDate);
        } else {
            setLastUsedDateEnd(null);
        }
    };

    const handleCalendarChange = (newValue: Dayjs | null) => {
        setLastUsedDate(newValue);
        setDateInputValue(newValue ? newValue.format('MM/DD/YYYY') : '');
        setCalendarOpen(false);
    };

    const handleCalendarChangeEnd = (newValue: Dayjs | null) => {
        setLastUsedDateEnd(newValue);
        setDateInputValueEnd(newValue ? newValue.format('MM/DD/YYYY') : '');
        setCalendarEndOpen(false);
    };

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
            difficultyByType,
            allowedTypes,
            typeCounts,
            totalQuestions,
            questionOrder,
            pointsByType: normalizedPointsByType,
            questions: [],
            totalPoints: 0,
            userID: user?._id ?? "",
            lastUsedFilterType,
            lastUsed:
            lastUsedFilterType !== "never" && lastUsedDate
            ? lastUsedDate.format("MM-DD-YYYY")
            : "",
            lastUsedEnd: lastUsedFilterType === 'range' && lastUsedDateEnd
                ? lastUsedDateEnd.format('MM-DD-YYYY')
                : '',
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
    }

    return (
        <div className="mx-auto w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-primary border-primary rounded-2xl p-4 min-h-fit">
                    <h2 className="mb-3 text-lg font-semibold text-primary">General</h2>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-primary">
                                Title <span className="text-red-500">*</span>
                            </span>
                            <input
                                className="border border-primary text-secondary px-3 py-3"
                                placeholder="ex: Midterm - Algorithms"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                maxLength={50}
                            />
                        </label>
                        
                        <label className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-primary">
                                Subject <span className="text-red-500">*</span>
                            </span>
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
                            <span className="text-sm font-medium text-primary">
                                Course Number <span className="text-red-500">*</span>
                            </span>
                            <SelectBox
                                label=""
                                options={courseNums}
                                placeholder="All Course Numbers"
                                onSelect={setCourseNum}
                                defaultValue=""
                                value={courseNum}
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-primary">
                                Time Limit (minutes) <span className="text-red-500">*</span>
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={180}
                                className="border border-primary text-secondary px-3 py-3"
                                placeholder="60"
                                value={timeLimit || ""}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                required
                            />
                        </label>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                               <div className="flex items-center justify-between gap-3 flex-wrap">
                                <span className="text-sm font-medium text-primary">Last Used</span>
                                <div className="flex flex-wrap gap-1">
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType("before")}
                                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${lastUsedFilterType === "before" ? "btn-primary-blue" : "btn btn-ghost"
                                            }`}
                                    >
                                        Before
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType("after")}
                                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${lastUsedFilterType === "after" ? "btn-primary-blue" : "btn btn-ghost"
                                            }`}
                                    >
                                        After
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType("range")}
                                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${lastUsedFilterType === "range" ? "btn-primary-blue" : "btn btn-ghost"
                                            }`}
                                    >
                                        Range
                                    </button>
                                    <button
                                    type="button"
                                    onClick={() => setLastUsedFilterType("never")}
                                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                        lastUsedFilterType === "never" ? "btn-primary-blue" : "btn btn-ghost"
                                    }`}
                                    >
                                    Never Used
                                    </button>
                                </div>
                            </div>
                            </div>
                            </div>

                            {lastUsedFilterType !== "never" && (
                            <div className="relative" ref={setCalendarAnchorEl}>
                                <input
                                    type="text"
                                    placeholder={lastUsedFilterType === "range" ? "Start date (MM/DD/YYYY)" : "MM/DD/YYYY"}
                                    value={dateInputValue}
                                    onChange={(e) => handleDateInputChange(e.target.value)}
                                    className="w-full border border-primary text-secondary px-3 py-3 pr-12"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    onClick={() => setCalendarOpen(true)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        className="size-5 text-gray-400"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
                                        />
                                    </svg>
                                </button>
                            </div>
                            )}

                            {lastUsedFilterType === "range" && (
                                <div className="relative mt-2" ref={setCalendarEndAnchorEl}>
                                    <input
                                        type="text"
                                        placeholder="End date (MM/DD/YYYY)"
                                        value={dateInputValueEnd}
                                        onChange={(e) => handleDateInputChangeEnd(e.target.value)}
                                        className="w-full border border-primary text-secondary px-3 py-3 pr-12"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setCalendarEndOpen(true)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="1.5"
                                            stroke="currentColor"
                                            className="size-5 text-gray-400"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {lastUsedFilterType !== "never" && (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    open={calendarOpen}
                                    onClose={() => setCalendarOpen(false)}
                                    value={lastUsedDate}
                                    onChange={(newValue) => {
                                        setLastUsedDate(newValue);
                                        setCalendarOpen(false);
                                        handleCalendarChange(newValue);
                                    }}
                                    slotProps={{
                                        popper: {
                                            anchorEl: calendarAnchorEl,
                                            placement: "bottom-start",
                                        },
                                    }}
                                    slots={{
                                        field: () => null,
                                    }}
                                />

                                {lastUsedFilterType === "range" && (
                                    <DatePicker
                                        open={calendarEndOpen}
                                        onClose={() => setCalendarEndOpen(false)}
                                        value={lastUsedDateEnd}
                                        onChange={(newValue) => {
                                            setLastUsedDateEnd(newValue);
                                            setCalendarEndOpen(false);
                                            handleCalendarChangeEnd(newValue);
                                        }}
                                        slotProps={{
                                            popper: {
                                                anchorEl: calendarEndAnchorEl,
                                                placement: "bottom-start",
                                            },
                                        }}
                                        slots={{
                                            field: () => null,
                                        }}
                                    />
                                )}
                            </LocalizationProvider>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-primary my-8"></div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                        {/* Allowed Question Types */}
                        <div>
                            <h2 className="mb-3 text-lg font-semibold text-primary">Allowed Question Types</h2>
                            <p className="mb-3 text-sm text-secondary">
                                Specify the number of questions and difficulty for each type. Use 0 to exclude a type.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-1">
                                {TYPES.map((t) => (
                                    <div key={t.value} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-center gap-2 text-center">
                                        <span className="text-sm font-medium text-primary">{t.label}</span>
                                        {user && (
                                        <span className="text-sm text-primary">
                                            ({availableCounts[t.value] ?? 0} questions available)
                                        </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                        type="number"
                                        min={0}
                                        placeholder="Count"
                                        className="border border-primary text-secondary px-2 py-2 w-full"
                                        value={typeCounts[t.value] || ""}
                                        onChange={(e) =>
                                            setTypeCounts((prev) => ({
                                            ...prev,
                                            [t.value]: Number(e.target.value),
                                            }))
                                        }
                                        />

                                        <select
                                        className="border border-primary text-secondary px-2 py-2 w-full bg-white"
                                        value={difficultyByType[t.value] ?? ""}
                                        onChange={(e) =>
                                            setDifficultyByType((prev) => ({
                                            ...prev,
                                            [t.value]: e.target.value,
                                            }))
                                        }
                                        >
                                        <option value="">Any</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        </select>
                                    </div>
                                    </div>
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
                                <div className="w-full max-w-[1000px]">
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
                        {/* Point Values */ }
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Point Values</h2>
                            <p className="mb-3 text-sm text-secondary">
                                Default values can be set here and adjusted later in Edit Exam.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-1">
                                {TYPES.map((t) => {
                                    return (
                                        <label key={t.value} className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-primary">{t.label}</span>

                                            <input
                                                type="number"
                                                min={0}
                                                max={50}
                                                placeholder={"0"}
                                                className="border-primary text-secondary px-2"
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
                        </div>
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
                                setDifficultyByType({ ...DEFAULT_DIFFICULTY_BY_TYPE });
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
                                setLastUsedDate(null);
                                setDateInputValue('');
                                setLastUsedFilterType('before');
                                setLastUsedDateEnd(null);
                                setDateInputValueEnd('');
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