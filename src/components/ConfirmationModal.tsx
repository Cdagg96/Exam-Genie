"use client";
import React, {useState} from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    questionText?: string;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    questionText,
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

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

                <h1 className="text-2xl font-bold mb-4 text-center">Delete Question</h1>

                <div className="space-y-4">
                    {/* Message */}
                    <p className="text-gray-700 text-center">
                        Are you sure you want to delete this question? This action cannot be undone.
                    </p>

                    {/* Question Display */}
                    {questionText && (
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 mb-2">Question:</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{questionText}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-4">
                        <button
                            type="button"
                            className={`px-6 py-2 text-white rounded-lg transition-all bg-red-600 hover:bg-red-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Delete Question"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}