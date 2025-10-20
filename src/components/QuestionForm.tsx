"use client";
import React from "react";

export default function BackgroundModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white text-black rounded-2xl shadow-2xl w-[50rem] h-[25rem] flex flex-col relative">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-500 text-3xl"
                >
                    &times;
                </button>

                {/* Title */}
                <div className="flex justify-center mt-10">
                    <h1 className="text-2xl font-semibold text-gray-800 text-center">
                        Add a Question
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6">

                    {/* Topic Dropdown (might need to be a text box eventually) */}
                    <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Topic
                        </label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                            <option value="">Select Question Topic</option>
                            <option value="Topic1">Topic 1</option>
                            <option value="Topic2">Topic 2</option>
                            <option value="Topic3">Topic 3</option>
                            <option value="Topic4">Topic 4</option>
                        </select>
                    </div>

                    {/* Type Dropdown */}
                    <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                        </label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                            <option value="">Select Question Type</option>
                            <option value="Multiple Choice">Multiple Choice</option>
                            <option value="Essay">Essay</option>
                            <option value="FIB">Fill In The Blank</option>
                            <option value="True/False">True/False</option>
                            <option value="Coding">Coding</option>
                        </select>
                    </div>


                    {/* Difficulity dropdown */}
                    <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty
                        </label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                            <option value="">Select Question Difficulty</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>

                </div>
                {/* Question Textbox dropdown */}
                <div className="mt-6 text-left px-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                    </label>
                    <textarea

                        placeholder="Enter your question here..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    ></textarea>
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        type="submit"
                        className="px-8 py-3 rounded-xl font-semibold text-white shadow-md bg-black hover:bg-gradient-to-r hover:from-blue-400 hover:via-cyan-400 hover:to-blue-600 transition-all duration-300 hover:shadow-lg"
                        onClick={() => {
                            // TODO: Add logic to save the form values here
                            console.log("Form submitted!");
                        }}
                    >
                        Submit
                    </button>
                </div>


            </div>
        </div>
    );
}
