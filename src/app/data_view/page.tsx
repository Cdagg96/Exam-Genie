"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/navbar";
import QuestionForm from "@/components/QuestionForm";
import FilterBox from "@/components/filterBox";

interface Question {
    _id: string;
    stem: string;
    type: string;
    difficulty: string;
    topics: string[];
    choices: {
        label: string;
        text: string;
        isCorrect: boolean;
    }[];
    answer: string;
    lastUsed: string | null;
    userID: string;
}

export default function DatabaseActionPage() {
    const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);

    //Fetch questions from MongoDB
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/question_table');

            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            const data = await response.json();
            setQuestions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    //Runs when page opens to get questions
    useEffect(() => {
        fetchQuestions();
    }, []);

    //Creates a unique list of topics for the filter box
    useEffect(() => {
    const uniqueTopics = Array.from(
        new Set(questions.flatMap(quest => quest.topics))
    ).map(topic => ({ value: topic, label: topic }));

    //Store the list of unique topics if any changes occur in questions
    setTopics(uniqueTopics);
    }, [questions]);

    //Runs when the add question form closes to potentially grab new questions just added
    const handleFormClose = () => {
        setIsQuestionFormOpen(false);
        fetchQuestions();
    };

    //Helper function to format choices (label then text plus can have multiple choices)
    const formatChoices = (choices: any[] | undefined): string => {
        if (!choices || !Array.isArray(choices)) return 'N/A';

        return choices.map(choice => {
            if (choice.label && choice.text) {
                if(choice.label == "True" || choice.label == "False"){
                    return `${choice.label}`;
                }
                return `${choice.label}: ${choice.text}`;
            }
            
            return JSON.stringify(choice);
        }).join(' ');
    };

    // Helper function to format answers
    const formatAnswers = (question: Question): string => {
        const { type, choices, answer } = question;

        // MC / TF: answer lives in choices
        if ((type === "MC" || type === "TF") && Array.isArray(choices)) {
            const correct = choices.find(choice => choice.isCorrect);
            return correct?.label || "N/A";
        }

        // Everything else (FIB, Essay): answer is on the question
        if (answer && answer.trim().length > 0) {
            return answer;
        }

        return "N/A";
    };

    // Helper function that adds blank line after question stem if it is FIB
    const formatQuestion = (question: Question): string => {
        const { stem, type } = question;
        if(type == "FIB"){
            return stem + " __";
        }
        return stem;
    }

    //Helper function to format topics (can have multiple topics)
    const formatTopics = (topics: string[] | undefined): string => {
        if (!topics || !Array.isArray(topics)) return 'No topic';
        return topics.join(', ');
    };

    return (
        <div className="flex flex-col justify-between min-h-screen p-8 text-center bg-gradient-to-b from-[#EFF6FF] to-white">
            <header>
                <NavBar />
            </header>
            <main className="flex flex-col items-center justify-center pt-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Question Bank
                </h1>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                    Manage and view all questions in the database. Filter by topic, difficulty, or type to find specific questions.
                </p>


                {/* Filtering Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 w-full border border-gray-100">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-left">
                        Filter Questions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Topic Filter Box */}
                        <FilterBox
                            options={topics}
                            label="Topic"
                            placeholder="Search a topic"
                        />

                        {/* Difficulty Filter */}
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">All Difficulties</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                        </div>


                        {/* Type Filter */}
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">All Types</option>
                                <option value="Multiple Choice">Multiple Choice</option>
                                <option value="Essay">Essay</option>
                                <option value="FIB">Fill In The Blank</option>
                                <option value="True/False">True/False</option>
                                <option value="Coding">Coding</option>
                            </select>
                        </div>
                    </div>


                    {/* Last Used Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-md">
                        <div className="text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Used
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ex: 01/01/2025"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Filter Actions */}
                    <div className="flex justify-end space-x-4 mt-8">
                        <button className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                            Clear Filters
                        </button>
                        <button className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                            Apply Filters
                        </button>
                    </div>
                </div>


                {/* Questions Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100">
                    <div className="overflow-x-auto w-full max-w-full">
                        <table className="min-w-full divide-y divide-gray-200 border-x border-gray-200">
                            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                <tr>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Question
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Difficulty
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Topic
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Choices
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Answer
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                        Last Used
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    //Questions Loading
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center border-r border-gray-200">
                                            <div className="text-gray-400 text-lg">Loading questions</div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    //Error while loading questions
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center border-r border-gray-200">
                                            <div className="text-gray-400 text-lg">Error Loading questions</div>
                                            <div className="text-red-400 text-sm mt-2">{error}</div>
                                            <button
                                                onClick={fetchQuestions}
                                                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                                                Retry
                                            </button>
                                        </td>
                                    </tr>
                                ) : questions.length == 0 ? (
                                    //No questions
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center border-r border-gray-200">
                                            <div className="text-gray-400 text-lg">No questions found</div>
                                            <div className="text-gray-400 text-sm mt-2">Add a question to get started</div>
                                        </td>
                                    </tr>
                                ) : (
                                    //Questions data
                                    questions.map((question, index) => (
                                        <tr key={question._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                <div className="truncate" title={formatQuestion(question)}>
                                                    {formatQuestion(question)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {question.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {question.difficulty}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {formatTopics(question.topics)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                <div className="truncate" title={formatChoices(question.choices)}>
                                                    {formatChoices(question.choices)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                <div className="truncate" title={formatAnswers(question)}>
                                                    {formatAnswers(question)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                {question.lastUsed || 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button className="text-blue-600 hover:text-blue-900 mr-3">
                                                    Edit
                                                </button>
                                                <button className="text-red-600 hover:text-red-900">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Add Question Button */}
                <div className="mt-12 flex justify-center">
                    <button className="px-12 py-5 bg-gray-800 text-white text-xl font-bold rounded-2xl hover:bg-gray-900 transition-all duration-300 shadow-2xl transform hover:-translate-y-1 hover:shadow-3xl flex items-center gap-2" onClick={() => setIsQuestionFormOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Add New Question to Database
                    </button>
                </div>
            </main>
            <QuestionForm isOpen={isQuestionFormOpen} onClose={handleFormClose} />
        </div>

    );
}




