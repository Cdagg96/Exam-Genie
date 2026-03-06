"use client";
import React, { useState, useEffect } from "react";
import SelectBox from "@/components/SelectBox";
import { Choice } from "@/types/question";

interface EditQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: any;
    onQuestionUpdated: (updatedQuestion: any) => void;
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
    const [choices, setChoices] = useState([
        { label: "A", text: "" },
        { label: "B", text: "" },
    ]);
    const [correctAnswer, setCorrect] = useState("A");
    const [extendedAnswer, setExAnswer] = useState("");
    const [fibAnswer, setFIBAnswer] = useState("");
    const [blankLines, setBlankLines] = useState(1);
    const [loading, setLoading] = useState(false);
    const [editInDb, setEditInDb] = useState(false);

    const getQuestionId = (q: any) => {
        return (q?.questionId || q?.question_id || q?.questionID || q?._id || q?.id || q?.question?._id || q?.question?.id || q?.snapshot?._id || q?.snapshot?.id || null);
    };

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
    const removeChoice = (index: number) => {
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

    // Helper function to get question data from exam snapshot
    const getQuestionData = (q: any) => {
        // Exam questions have data in snapshot
        if (q.snapshot) {
            return {
                stem: q.snapshot.stem || "",
                type: q.type || q.snapshot.type || "MC",
                difficulty: q.snapshot.difficulty || 1,
                topics: q.snapshot.topics || [],
                choices: q.snapshot.choices || [],
                answer: q.snapshot.answer || "",
                blankLines: q.snapshot.blankLines || q.snapshot.lines || 1,
            };
        }
        // Fallback for direct question data
        return {
            stem: q.stem || "",
            type: q.type || "MC",
            difficulty: q.difficulty || 1,
            topics: q.topics || [],
            choices: q.choices || [],
            answer: q.answer || "",
            blankLines: q.blankLines || q.lines || 1,
        };
    };

    //Initialize form with question data when modal opens or question changes
    useEffect(() => {
        if (isOpen) setEditInDb(false);
        if (question) {
            const questionData = getQuestionData(question);
            console.log("Loading question data:", questionData);

            setStem(questionData.stem);
            setType(questionData.type);
            setDifficulty(Number(questionData.difficulty));
            setTopics(questionData.topics?.join(", ") || "");
            setBlankLines(questionData.blankLines || 1);

            //Initialize answers based on question type
            if (questionData.type === "MC" || questionData.type === "TF") {
                const correctChoice = questionData.choices?.find((choice: Choice) => choice.isCorrect);
                if (correctChoice) {
                    setCorrect(correctChoice.label);
                }

                //For MC questions, populate choices
                if (questionData.type === "MC" && questionData.choices) {
                    const relabeled = questionData.choices.map((choice: Choice, i: number) => ({
                        ...choice,
                        // force labels to be A, B, C... so UI doesn't end up with A/C gaps
                        label: String.fromCharCode(65 + i),
                    }));

                    setChoices(relabeled);

                    // If you store correctAnswer as a label ("A"/"B"/"C"...), set it from data:
                    const correct = relabeled.find((c: Choice) => c.isCorrect)?.label ?? "A";
                    setCorrect(correct);
                }
            } else if (questionData.type === "FIB") {
                setFIBAnswer(questionData.answer || "");
            } else {
                setExAnswer(questionData.answer || "");
            }
        }
    }, [question, isOpen]);

    if (!isOpen || !question) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Build the updated question data structure for the exam
        const base_data = {
            stem,
            type,
            difficulty: difficulty,
            topics: topics.split(",").map(t => t.trim()).filter(t => t !== ""), // Filter empty topics
        };

        let data;

        // Build the answer portion based on question type
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
                    blankLines: blankLines,
                };
                break;
            default:
                data = base_data;
        }

        try {
            // For exam editing: just update local state, NO API call
            // question bank edits are queued in edit_exam page
            console.log("Updating question in exam with data:", data);

            onQuestionUpdated({
                ...data,
                alsoUpdateInBank: editInDb,
                bankId: getQuestionId(question),
            });
            onClose();
        } catch (error) {
            console.error(error);
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
                    <h1 className="text-2xl font-bold text-blue-gradient mb-4 text-center">Edit Question in Exam</h1>


                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Question Stem */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                                Question
                            </label>
                            <input
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                                placeholder="Question"
                                value={stem}
                                onChange={(e) => setStem(e.target.value)}
                                required
                                disabled={loading}
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
                                value={difficulty || ""}
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
                                disabled={loading}
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

                                <button
                                    type="button"
                                    onClick={addChoice}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    + Add Choice
                                </button>
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
                                />
                                <label className="block text-sm font-medium text-primary mb-2 mt-4">
                                    Number of blank lines
                                </label>
                                <input
                                    type="number"
                                    className="border-primary bg-primary text-secondary px-4 py-3 w-full rounded-xl"
                                    value={blankLines}
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
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                </select>
                            </div>
                        )}

                        {/* Edit in DB Check Box*/}
                        <div className="flex items-center gap-2">
                            <input
                                id="editInDb"
                                type="checkbox"
                                checked={editInDb}
                                onChange={(e) => setEditInDb(e.target.checked)}
                                disabled={loading}
                                className="h-4 w-4"
                            />
                            <label htmlFor="editInDb" className="text-sm text-secondary">
                                Edit question in question bank
                            </label>
                        </div>
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