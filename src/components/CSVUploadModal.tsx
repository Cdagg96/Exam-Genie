import { useState } from "react";

interface CSVUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    isLoading: boolean;
}

export default function CSVUploadModal({ isOpen, onClose, onUpload, isLoading }: CSVUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);

    //Be able to drag and drop file
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0] && files[0].type === "text/csv") {
            setFile(files[0]);
        }
    };

    //Handle if different file is selected
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            setFile(files[0]);
        }
    };

    //Handle upload action
    const handleUpload = () => {
        if (file) {
            onUpload(file);
            setFile(null);
        }
    };

    //Download CSV template
    const downloadTemplate = () => {
        const csvContent = `stem,type,difficulty,topics,subject,courseNum,answer,blankLines,lines,choiceA,choiceB,choiceC,choiceD,choiceE,correctAnswer
"The keyword used to define a function in Python is ________.","FIB",1,"Python Syntax","Computer Science","CS2401","def",1,"","","","","","",""
"Write a Python function that returns the square of a number.","Code",1,"Python Coding","Computer Science","CS2401","def square(num):\\n    return num * num","","1","","","","","","",""
"Explain what version control is and why it is essential in software development.","Essay",1,"software engineering","Computer Science","CS2401","Version control systems like Git track changes in code, enabling collaboration and maintaining history.","","1","","","","","","",""
"Which data structure operates on a First-In, First-Out (FIFO) principle?","MC",3,"data structures","Computer Science","CS101","","","","Stack","Queue","Heap","","","B"
"JavaScript is a statically typed language.","TF",1,"programming","Computer Science","CS101","","","","True","False","","","","B"
`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="card-primary rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] p-6 flex flex-col relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 z-10 text-black hover:text-gray-500 text-3xl"
                    disabled={isLoading}
                >
                    &times;
                </button>
                {/* Scrollable body */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-blue-gradient">Upload Questions from CSV</h2>
                    </div>
                    {/* Instructions */}
                    <div className="mb-6 ">
                        <h3 className="text-lg font-semibold text-primary mt-3">CSV Format Instructions</h3>
                        <div className="rounded-lg p-4 text-sm text-secondary">
                            <p className="mb-2">Your CSV file should include the following row at the top:</p>
                            <p>stem, type, difficulty, topics, subject, courseNum, answer, blankLines, lines, choiceA, choiceB, choiceC, correctAnswer</p>
                            <ul className="list-disc list-inside space-y-1 mb-3">
                                <li><strong>Stem</strong> - The question text (required)</li>
                                <li><strong>Type</strong> - Question type: MC, TF, FIB, Essay, Code (required)</li>
                                <li><strong>Difficulty</strong> - Number from 1-5 (required)</li>
                                <li><strong>Topics</strong> - Comma-separated topics (required)</li>
                                <li><strong>Subject</strong> - Subject area (required)</li>
                                <li><strong>CourseNum</strong> - Course number (required)</li>
                                <li><strong>Choice A, Choice B, Choice C, ect</strong> - Choices for MC/TF questions (max 5 choices)</li>
                                <li><strong>Answer</strong> - Answer text for FIB, Essay, and Code questions</li>
                                <li><strong>BlankLines</strong> - Number of blank lines for FIB questions</li>
                                <li><strong>Lines</strong> - Number of lines for Essay and Code questions</li>
                                <li><strong>Correct Answer</strong> - Correct choice label (A, B, C) for MC/TF</li>
                            </ul>
                            <p><strong>Note:</strong> For Multiple Choice (MC) and True/False (TF) questions, provide choices and correctAnswer. For FIB, Essay, and Code, provide the answer field and appropriate line fields.</p>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="mb-6">
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('csv-file-input')?.click()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            <p className="mt-2 text-sm text-primary">
                                {file ? file.name : "Drag and drop your CSV file here, or click to select"}
                            </p>
                            <p className="text-xs text-secondary mt-1">Only CSV files are accepted</p>
                        </div>
                        <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Selected File Info */}
                    {file && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 font-medium">Selected file: {file.name}</p>
                        </div>
                    )}

                    {/* Bottom Buttons */}
                    <div className="m-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex gap-3">
                            <button
                                onClick={downloadTemplate}
                                className="btn btn-ghost"
                            >
                                Download Template
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn btn-ghost"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || isLoading}
                                className="btn btn-primary-blue"
                            >
                                {isLoading ? "Uploading..." : "Upload Questions"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}