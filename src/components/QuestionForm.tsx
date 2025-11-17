"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import SelectBox from "@/components/SelectBox";

export default function BackgroundModal({
    isOpen,
    onClose,
    onQuestionAdded,
}: {
    isOpen: boolean;
    onClose: () => void;
    onQuestionAdded?: (newQuestion: any) => void;
}) {
    if (!isOpen) return null;

    // States for each of the form fields
    const [stem, setStem] = useState("");
    const [type, setType] = useState("MC");
    const [difficulty, setDifficulty] = useState(1);
    const [topics, setTopics] = useState("");
    const [subject, setSubject] = useState("");
    const [choiceA, setChoiceA] = useState("");
    const [choiceB, setChoiceB] = useState("");
    const [choiceC, setChoiceC] = useState("");
    const [correctAnswer, setCorrect] = useState("A");
    const [extendedAnswer, setExAnswer] = useState("");
    const [fibAnswer, setFIBAnswer] = useState("");
    const [blankLines, setBlankLines] = useState(1);
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Set the base data structure
        const base_data = {
            stem, type, difficulty,
            topics: topics.split(",").map(t => t.trim()),
            subject,
            lastUsed: null,
            userID: user?._id ?? "", //if user not logged in set id to ""
            points: 1,
        };

        let data: any = { ...base_data };

        // Change the answer portion based on what type of question it is
        switch (type) {
            case "MC":
                data = {
                    ...base_data,
                    choices: [
                        { label: "A", text: choiceA, isCorrect: correctAnswer === "A" },
                        { label: "B", text: choiceB, isCorrect: correctAnswer === "B" },
                        { label: "C", text: choiceC, isCorrect: correctAnswer === "C" }
                    ],
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
        }

        try {
            const res = await fetch("../api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                toast.success("Question Created!") // Notification that question was created
                const newQuestionForExam = {
                    questionId: result._id || result.id || `temp-${Date.now()}`,
                    type: type,
                    points: data.points || 1,
                    snapshot: {
                        stem: stem, // Use local state, not API response
                        choices: data.choices || [],
                        blankLines: data.blankLines || blankLines || 4,
                    },
                };
                onQuestionAdded?.(newQuestionForExam);
                onClose(); // Close the popup
            }
            else if (res.status === 401) {
                // temporary notification until other types are implemented
                toast.error("Please choose multiple choice type")
            }
            else {
                console.error(result);
                toast.error("Failed to create question");
            }
        } catch (error) {
            console.error(error);
            alert("Network/Server error");
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white text-black rounded-2xl shadow-2xl w-[40rem] p-6 relative overflow-hidden">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-500 text-3xl"
                >
                    &times;
                </button>

                <h1 className="text-2xl font-bold mb-4 text-center">Add a Question</h1>


                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Question Stem */}
                    <input
                        className="border px-4 py-3 w-full rounded-xl"
                        placeholder="Question"
                        value={stem}
                        onChange={(e) => setStem(e.target.value)}
                        required
                    />

                    {/* Question Type */}
                    <SelectBox
                        label=""
                        placeholder="Select Question Type"
                        options={[
                            { value: "MC", label: "Multiple Choice" },
                            { value: "TF", label: "True/False" },
                            { value: "FIB", label: "Fill in the Blank" },
                            { value: "Essay", label: "Essay" },
                            { value: "Code", label: "Code" },
                        ]}
                        value={type}
                        onSelect={(value) => setType(value)}
                    />

                    {/* Question difficulty */}
                    <input
                        className="border px-4 py-3 w-full rounded-xl"
                        type="number"
                        placeholder="Difficulty (1-5)"
                        value={difficulty || ""}
                        min={1}
                        max={5}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        required
                    />

                    {/* Question topic(s) */}
                    <input
                        className="border px-4 py-3 w-full rounded-xl"
                        placeholder="Topic(s) (comma separated)"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        required
                    />

                    {/* Question subject */}
                    <input
                        className="border px-4 py-3 w-full rounded-xl"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                    />

                    {/* MC options */}
                    {type === "MC" && (
                        <div className="flex gap-2">
                            <input
                                className="border px-4 py-3 w-full rounded-xl"
                                placeholder="Choice A"
                                value={choiceA}
                                onChange={(e) => setChoiceA(e.target.value)}
                                required />

                            <input
                                className="border px-4 py-3 w-full rounded-xl"
                                placeholder="Choice B"
                                value={choiceB}
                                onChange={(e) => setChoiceB(e.target.value)}
                                required />

                            <input
                                className="border px-4 py-3 w-full rounded-xl"
                                placeholder="Choice C"
                                value={choiceC}
                                onChange={(e) => setChoiceC(e.target.value)}
                                required />

                        </div>
                    )}

                    {/* True/False options */}
                    {type === "TF" && (
                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correct answer
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCorrect("True")}
                                    className={`border px-4 py-3 flex-1 rounded-xl text-center transition-all
                                    ${correctAnswer === "True" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"}`}
                                >
                                    True
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCorrect("False")}
                                    className={`border px-4 py-3 flex-1 rounded-xl text-center transition-all
                                    ${correctAnswer === "False" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"}`}
                                >
                                    False
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Essay/Code only have one "option" box */}
                    {(type === "Essay" || type === "Code") && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correct answer
                            </label>
                            <textarea
                                className="border h-50 px-4 py-3 w-full rounded-xl"
                                placeholder="Type your answer here..."
                                value={extendedAnswer}
                                onChange={(e) => setExAnswer(e.target.value)}
                                required
                            />
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of blank lines
                            </label>
                            <input
                                type="number"
                                className="border px-4 py-3 w-full rounded-xl"
                                value={blankLines}
                                onChange={(e) => setBlankLines(Number(e.target.value))}
                                required
                            />
                        </div>
                    )}

                    {/* FIB only have one "option" box and one blank line*/}
                    {(type == "FIB") && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correct answer
                            </label>
                            <input
                                className="border px-4 py-3 w-full rounded-xl"
                                value={fibAnswer}
                                onChange={(e) => setFIBAnswer(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* MC correct answer*/}
                    {type === "MC" && (
                        <label className="block">
                            Correct answer:
                            <select
                                className="border p-2 ml-2 rounded"
                                value={correctAnswer}
                                onChange={(e) => setCorrect(e.target.value)}
                                required
                            >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </label>
                    )}


                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="px-6 py-3 text-sm font-medium btn btn-primary-dark-blue"
                        >
                            Add Question
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
