"use client";
import React, {useState} from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    text?: string;
    isLoading?: boolean;
    type?: 'question' | 'exam';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    text,
    isLoading = false,
    type = 'question'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    // pick the messages/values based on type of deletion
    const deleteStatement = type === 'question' ? 'Delete Question' : 'Delete Exam';
    const confirmationMessage = type === 'question'
        ? 'Are you sure you want to delete this question? This action cannot be undone.'
        : 'Are you sure you want to delete this exam? This action cannot be undone.';

    const deletionType = type === 'question' ? 'Question' : 'Exam';
    const buttonText = isLoading
        ? type === 'question' ? 'Deleting Question...' : 'Deleting Exam...'
        : type === 'question' ? 'Delete Question' : 'Delete Exam';

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white text-black rounded-2xl shadow-2xl w-[40rem] p-6 relative overflow-hidden">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-500 text-3xl"
                >
                    &times;
                </button>

                <h1 className="text-2xl font-bold mb-4 text-center">{deleteStatement}</h1>

                <div className="space-y-4">
                    {/* Message */}
                    <p className="text-gray-700 text-center">
                        {confirmationMessage}
                    </p>

                    {/* Question Display */}
                    {text && (
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 mb-2">{deletionType}</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
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
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}