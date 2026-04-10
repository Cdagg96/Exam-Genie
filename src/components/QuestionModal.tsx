"use client";

import { useState } from "react";

interface QuestionModalProps {
    question: any;
    isOpen: boolean;
    onClose: () => void;
    onImport?: (questionId: string) => void;
    isImporting?: boolean;
}

export default function QuestionModal({ question, isOpen, onClose, onImport, isImporting = false }: QuestionModalProps) {
    if (!isOpen) return null;

    const getQuestionTypeDisplay = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'MC': 'Multiple Choice',
            'TF': 'True/False',
            'FIB': 'Fill In The Blank',
            'Essay': 'Essay',
            'Code': 'Coding'
        };
        return typeMap[type] || type;
    };

    //Helper function to get the correct answer for any question type
    const getCorrectAnswer = () => {
        if (question.type === 'MC' && question.choices) {
            const correctChoice = question.choices.find((choice: any) => choice.isCorrect === true);
            if (correctChoice) {
                return typeof correctChoice === 'object' ? correctChoice.text || correctChoice.label : correctChoice;
            }
            return "No correct answer specified";
        }

        if (question.type === 'TF' && question.choices) {
            const correctChoice = question.choices.find((choice: any) => choice.isCorrect === true);
            if (correctChoice) {
                const answer = typeof correctChoice === 'object' ? correctChoice.text || correctChoice.label : correctChoice;
                return answer === 'true' || answer === 'True' ? 'True' : 'False';
            }
            return "No correct answer specified";
        }

        if (question.answer) {
            return String(question.answer);
        }

        return "No answer provided";
    };

    const handleImportAndClose = () => {
        if (onImport) {
            onImport(question._id);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-primary">Question Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Question Type and Difficulty */}
                    <div className="flex gap-2">
                        <span className="px-3 py-1 text-sm font-medium text-primary bg-gray-100 dark:bg-gray-700 rounded-md">
                            {getQuestionTypeDisplay(question.type)}
                        </span>
                        <span className="px-3 py-1 text-sm font-medium text-primary bg-gray-100 dark:bg-gray-700 rounded-md">
                            Difficulty: {question.difficulty}/5
                        </span>
                    </div>

                    {/* Question Text */}
                    <div>
                        <h3 className="text-sm font-semibold text-primary mb-2">Question:</h3>
                        <p className="text-primary text-lg leading-relaxed bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            {question.stem}
                        </p>
                    </div>

                    {/* Subject and Course */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-primary mb-1">Subject:</h3>
                            <p className="text-secondary">{question.subject || "Not specified"}</p>
                        </div>
                        {question.courseNum && (
                            <div>
                                <h3 className="text-sm font-semibold text-primary mb-1">Course Number:</h3>
                                <p className="text-secondary">{question.courseNum}</p>
                            </div>
                        )}
                    </div>

                    {/* Topics */}
                    {question.topics && question.topics.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-primary mb-2">Topics:</h3>
                            <div className="flex flex-wrap gap-2">
                                {question.topics.map((topic: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-secondary rounded-md text-sm">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Choices for Multiple Choice and True/False */}
                    {(question.type === 'MC' || question.type === 'TF') && question.choices && (
                        <div>
                            <h3 className="text-sm font-semibold text-primary mb-2">Options:</h3>
                            <div className="space-y-2">
                                {question.choices.map((choice: any, idx: number) => {
                                    //Extract the text from the choice object
                                    const choiceText = typeof choice === 'object' ? choice.text || choice.label : choice;
                                    const isCorrect = typeof choice === 'object' ? choice.isCorrect : false;

                                    return (
                                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <span className="font-semibold text-primary">{String.fromCharCode(65 + idx)}.</span>
                                            <span className="text-secondary flex-1">{choiceText}</span>
                                            {isCorrect && (
                                                <span className="text-green-600 text-sm font-medium">Correct</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Answer for Fill in the Blank, Essay, and Coding */}
                    {(question.type === 'FIB' || question.type === 'Essay' || question.type === 'Code') && (
                        <div>
                            <h3 className="text-sm font-semibold text-primary mb-2">Answer:</h3>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-primary">{getCorrectAnswer()}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 gap-3">
                    {onImport && (
                        <button
                            onClick={() => handleImportAndClose()}
                            disabled={isImporting}
                            className="px-4 py-2 btn btn-primary-blue rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImporting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importing...
                                </span>
                            ) : (
                                "Import Question"
                            )}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 btn btn-ghost"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}