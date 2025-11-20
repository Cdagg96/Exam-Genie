"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
    const [choiceA, setChoiceA] = useState("");
    const [choiceB, setChoiceB] = useState("");
    const [choiceC, setChoiceC] = useState("");
    const [correctAnswer, setCorrect] = useState("A");
    const [extendedAnswer, setExAnswer] = useState("");
    const [fibAnswer, setFIBAnswer] = useState("");
    const [blankLines, setBlankLines] = useState(1);
    const [loading, setLoading] = useState(false);

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
                    questionData.choices.forEach((choice: Choice) => {
                        if (choice.label === "A") setChoiceA(choice.text);
                        if (choice.label === "B") setChoiceB(choice.text);
                        if (choice.label === "C") setChoiceC(choice.text);
                    });
                }
            } else if (questionData.type === "FIB") {
                setFIBAnswer(questionData.answer || "");
            } else {
                setExAnswer(questionData.answer || "");
            }
        }
    }, [question]);

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
        switch(type){
            case "MC":
                data = {
                    ...base_data,
                    choices: [
                        {label:"A", text:choiceA, isCorrect: correctAnswer === "A"},
                        {label:"B", text:choiceB, isCorrect: correctAnswer === "B"},
                        {label:"C", text:choiceC, isCorrect: correctAnswer === "C"}
                    ],
                };
                break;
            case "TF":
                data = {
                    ...base_data,
                    choices: [
                        {label:"True", text:"True", isCorrect: correctAnswer === "True"},
                        {label:"False", text:"False", isCorrect: correctAnswer === "False"},
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
            console.log("Updating question in exam with data:", data);
            onQuestionUpdated(data);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white text-black rounded-2xl shadow-2xl w-160 p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-500 text-3xl"
                    disabled={loading}
                >
                    &times;
                </button>

                <h1 className="text-2xl font-bold mb-4 text-center">Edit Question in Exam</h1>

                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Question Stem */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question
                        </label>
                        <input
                            className="border px-4 py-3 w-full rounded-xl"
                            placeholder="Question"
                            value={stem}
                            onChange={(e) => setStem(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Question Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty
                        </label>
                        <input
                            className="border px-4 py-3 w-full rounded-xl"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Topics (comma separated)
                        </label>
                        <input
                            className="border px-4 py-3 w-full rounded-xl"
                            placeholder="Topic(s) (comma separated)"
                            value={topics}
                            onChange={(e) => setTopics(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* MC options */}
                    {type === "MC" && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Choices
                        </label>
                        <div className="flex gap-2">
                            <input 
                                className="border px-4 py-3 w-full rounded-xl" 
                                placeholder="Choice A" 
                                value={choiceA} 
                                onChange={(e) => setChoiceA(e.target.value)}
                                required 
                                disabled={loading}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input 
                                className="border px-4 py-3 w-full rounded-xl" 
                                placeholder="Choice B"
                                value={choiceB}
                                onChange={(e) => setChoiceB(e.target.value)}
                                required 
                                disabled={loading}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input 
                                className="border px-4 py-3 w-full rounded-xl" 
                                placeholder="Choice C" 
                                value={choiceC} 
                                onChange={(e) => setChoiceC(e.target.value)}
                                required 
                                disabled={loading}
                            />
                        </div>
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
                                    disabled={loading}
                                    className={`border px-4 py-3 flex-1 rounded-xl text-center transition-all
                                    ${correctAnswer === "True" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"} 
                                    ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                True
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setCorrect("False")}
                                    disabled={loading}
                                    className={`border px-4 py-3 flex-1 rounded-xl text-center transition-all
                                    ${correctAnswer === "False" ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"} 
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correct answer
                            </label>
                            <textarea
                                className="border px-4 py-3 w-full rounded-xl"
                                value={extendedAnswer}
                                onChange={(e) => setExAnswer(e.target.value)}
                                required
                                disabled={loading}
                                rows={4}
                            />
                            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                                Number of blank lines
                            </label>
                            <input
                                type="number"
                                className="border px-4 py-3 w-full rounded-xl"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correct answer
                            </label>
                            <input
                                className="border px-4 py-3 w-full rounded-xl"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct answer:
                        </label>
                        <select
                            className="border px-4 py-3 w-full rounded-xl"
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

                    <div className="flex justify-center gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-6 py-2 rounded hover:bg-linear-to-r from-blue-400 via-cyan-400 to-blue-600 transition-all disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update Question"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}