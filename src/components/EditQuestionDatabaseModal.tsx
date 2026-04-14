"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SelectBox from "@/components/SelectBox";
import { Question } from "@/types/question";
import { Choice } from "@/types/question";

interface EditQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: Question | null;
    onQuestionUpdated: () => void;
}

export default function EditQuestionModal({
    isOpen,
    onClose,
    question,
    onQuestionUpdated,
}: EditQuestionModalProps) {
    //States for each of the form fields
    const [stem, setStem] = useState("");
    const [type, setType] = useState("MC");
    const [difficulty, setDifficulty] = useState(1);
    const [topics, setTopics] = useState("");
    const [subject, setSubject] = useState("");
    const [courseNum, setCourseNum] = useState("");
    const [choices, setChoices] = useState([
        {label: "A", text: ""},
        {label: "B", text: ""},
    ]);
    const [correctAnswer, setCorrect] = useState("A");
    const [extendedAnswer, setExAnswer] = useState("");
    const [fibAnswer, setFIBAnswer] = useState("");
    const [blankLines, setBlankLines] = useState(1);
    const [loading, setLoading] = useState(false);

    // Update an MC choice
    const updateChoice = (index: number, value: string) => {
        const updated = [...choices];
        updated[index].text = value;
        setChoices(updated);
    };

    // Add an MC choice
    const addChoice = () => {
        if (choices.length == 5) return;
        const nextLabel = String.fromCharCode(65 + choices.length);
        setChoices([...choices, { label: nextLabel, text: "" }]);
    };

    // Remove an MC choice
    const removeChoice = (index: number) =>{
        if (choices.length <= 2) return; // keep minimum 2

        // remove the choice
        const filtered = choices.filter((_, i) => i !== index);

        // relabel sequentially: A, B, C, ...
        const relabeled = filtered.map((c, i) => ({
            ...c,
            label: String.fromCharCode(65 + i),
        }));

        // if the currently-correct label no longer exists, default to A
        const validLabels = new Set(relabeled.map(c => c.label));
        if (!validLabels.has(correctAnswer)) {
            setCorrect("A");
        }

        setChoices(relabeled);
    }

    //Initialize form with question data when modal opens or question changes
    useEffect(() => {
        if (question) {
            setStem(question.stem);
            setType(question.type);
            setDifficulty(Number(question.difficulty));
            setTopics(question.topics.join(", "));
            setSubject(question.subject);
            setCourseNum(question.courseNum);

            //Initialize answers based on question type
            if (question.type === "MC" || question.type === "TF") {
                const correctChoice = question.choices.find(choice => choice.isCorrect);

                if (correctChoice) {
                    setCorrect(correctChoice.label);
                }

                //For MC questions, populate choices
                if (question.type === "MC" && question.choices) {
                    const relabeled = question.choices.map((choice: Choice, i: number) => ({
                        ...choice,
                        // force labels to be A, B, C... so UI doesn't end up with A/C gaps
                        label: String.fromCharCode(65 + i),
                    }));

                    setChoices(relabeled);

                    // If you store correctAnswer as a label ("A"/"B"/"C"...), set it from data:
                    const correct = relabeled.find((c:Choice) => c.isCorrect)?.label ?? "A";
                    setCorrect(correct);
                }
            } else if (question.type === "FIB") {
                setFIBAnswer(question.answer || "");
            } else {
                setExAnswer(question.answer || "");
            }
        }
    }, [question]);

    if (!isOpen || !question) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        //Set the base data structure
        const base_data = {
            stem,
            type,
            difficulty: difficulty,
            topics: topics.split(",").map(t => t.trim()),
            subject,
            courseNum,
            lastUsed: question.lastUsed,
            userID: question.userID
        };

        let data;

        //Change the answer portion based on what type of question it is
        switch (type) {
            case "MC":
                data = {
                    ...base_data,
                    choices: choices.map(choice => ({
                        label: choice.label,
                        text: choice.text,
                        isCorrect: choice.label === correctAnswer,
                    })),
                };
                break;
            case "TF":
                data = {
                    ...base_data,
                    choices: [
                        { label: "True", text: "True", isCorrect: correctAnswer === "True" },
                        { label: "False", text: "False", isCorrect: correctAnswer === "False" },
                    ],
                };
                break;
            case "FIB":
                data = {
                    ...base_data,
                    answer: fibAnswer,
                    blankLines: 1,
                };
                break;
            case "Short Answer":
            case "Essay":
            case "Code":
                data = {
                    ...base_data,
                    answer: extendedAnswer || "",
                    lines: blankLines,
                };
                break;
            default:
                data = base_data;
        }

        try {
            const res = await fetch(`/api/questions?id=${question._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                toast.success("Question updated successfully!");
                onQuestionUpdated();
                onClose();
            } else {
                console.error(result);
                toast.error(result.error || "Failed to update question");
            }
        } catch (error) {
            console.error(error);
            toast.error("Network/Server error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="card-primary text-black rounded-2xl shadow-2xl w-160 max-h-[90vh] p-6 flex flex-col relative overflow-hidden">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 text-black hover:text-gray-500 text-3xl"
                    disabled={loading}
                >
                    &times;
                </button>
                {/* Scrollable body */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">
                    <h1 className="text-2xl font-bold text-blue-gradient mb-4 text-center">Edit Question</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Question Stem */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Question Stem
                            </label>
                            <input
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                placeholder="Question"
                                value={stem}
                                onChange={(e) => setStem(e.target.value)}
                                required
                                disabled={loading}
                                maxLength={100}
                            />
                        </div>

                        {/* Question Type */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Question Type
                            </label>
                            <SelectBox
                                label=""
                                placeholder="Select a type"
                                options={[
                                    { value: "MC", label: "Multiple Choice" },
                                    { value: "TF", label: "True/False" },
                                    { value: "FIB", label: "Fill in the Blank" },
                                    { value: "Essay", label: "Essay" },
                                    { value: "Code", label: "Code" },
                                ]}
                                defaultValue={type}
                                onSelect={(value) => setType(value)}
                            />
                        </div>

                        {/* Question difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Difficulty
                            </label>
                            <input
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                type="number"
                                placeholder="Difficulty (1-5)"
                                value={difficulty}
                                min={1}
                                max={5}
                                onChange={(e) => setDifficulty(Number(e.target.value))}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Question topic(s) */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Topics (comma separated)
                            </label>
                            <input
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                placeholder="Topic(s) (comma separated)"
                                value={topics}
                                onChange={(e) => setTopics(e.target.value)}
                                required
                                disabled={loading}
                                maxLength={50}
                            />
                        </div>

                        {/* Question subject */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Subject
                            </label>
                            <input
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                placeholder="Subject"
                                value={subject ?? ""}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                maxLength={50}
                            />
                        </div>

                        {/* Question Course Number */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Course Number
                            </label>
                            <input
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                placeholder="Course Number"
                                value={courseNum ?? ""}
                                onChange={(e) => setCourseNum(e.target.value)}
                                required
                                maxLength={50}
                            />
                        </div>

                        {/* MC options */}
                        {type === "MC" && (
                            <div className="space-y-2">
                                {choices.map((choice, index) => (
                                <div key={choice.label} className="flex gap-2">
                                    <input
                                    className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                    placeholder={`Choice ${choice.label}`}
                                    value={choice.text}
                                    onChange={(e) => updateChoice(index, e.target.value)}
                                    required
                                    maxLength={100}
                                    />

                                    <button
                                    type="button"
                                    onClick={() => removeChoice(index)}
                                    className="px-3 text-red-500 hover:text-red-700"
                                    >
                                    ✕
                                    </button>
                                </div>
                                ))}

                                {/*Add Choice button disappears after 5 choices and shows a message when maximum is reached */}
                                {choices.length < 5 && (
                                    <div className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={addChoice}
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1 hover:text-blue-800 transition-colors"
                                        >
                                            + Add Choice ({choices.length}/5)
                                        </button> 
                                    </div>
                                )}
                                {choices.length >= 5 && (
                                    <div className="flex justify-center">
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                            </svg>
                                            Maximum of 5 choices reached
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* True/False options */}
                        {type === "TF" && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Correct answer
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCorrect("True")}
                                        disabled={loading}
                                        className={`border px-4 py-3 flex-1 rounded-xl text-center transition-all
                                        ${correctAnswer === "True" ? "btn btn-primary-blue" : "btn btn-ghost"} 
                                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        True
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCorrect("False")}
                                        disabled={loading}
                                        className={`border px-4 py-3 flex-1 rounded-xl text-center transition-all
                                        ${correctAnswer === "False" ? "btn btn-primary-blue" : "btn btn-ghost"} 
                                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        False
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Essay/Code only have one "option" box */}
                        {(type === "Essay" || type === "Code") && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Correct answer
                                </label>
                                <textarea
                                    className="border-primary bg-primary text-primary px-4 py-3 w-full rounded-xl"
                                    value={extendedAnswer}
                                    onChange={(e) => setExAnswer(e.target.value)}
                                    required
                                    disabled={loading}
                                    rows={4}
                                    maxLength={1000}
                                />
                                <label className="block text-sm font-medium text-primary mb-2 mt-4">
                                    Number of blank lines
                                </label>
                                <input
                                    type="number"
                                    className="border-primary bg-primary text-secondary px-4 py-3 w-full rounded-xl"
                                    min={1}
                                    max={30}
                                    value={blankLines || ""}
                                    placeholder="1"
                                    onChange={(e) => setBlankLines(Number(e.target.value))}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {/* FIB only have one "option" box and one blank line*/}
                        {(type == "FIB") && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Correct answer
                                </label>
                                <input
                                    className="border-primary bg-primary text-primary px-4 py-3 w-full rounded-xl"
                                    value={fibAnswer}
                                    onChange={(e) => setFIBAnswer(e.target.value)}
                                    required
                                    disabled={loading}
                                    maxLength={100}
                                />
                            </div>
                        )}

                        {/* MC correct answer*/}
                        {type === "MC" && (
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    Correct answer:
                                </label>
                                <select
                                    className="border-primary bg-primary text-primary px-4 py-3 w-full rounded-xl"
                                    value={correctAnswer}
                                    onChange={(e) => setCorrect(e.target.value)}
                                    required
                                    disabled={loading}
                                >
                                {choices.map(choice => (
                                    <option key={choice.label} value={choice.label}>
                                    {choice.label}
                                    </option>
                                    ))} 
                                </select>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary-blue"
                            >
                                {loading ? "Updating..." : "Update Question"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}