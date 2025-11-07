"use client";

import React from "react";
import NavBar from "@/components/navbar";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { LightBackground } from "@/components/BackgroundModal";

// Follow the exam structure in the database
interface Exam {
    _id: string;
    title: string;
    timeLimitMins: number;
    difficulty: string;
    totalPoints: number;
    questions: {
        questionId: string;
        typle: string;
        points: number;
    }[];
    lastUsed: string;
    createdAt: string;
    updatedAt: string;
}

export default function PastExams() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);
    const [examTitleToDelete, setExamTitleToDelete] = useState<string>("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch exams from MongoDB
    const fetchExams = async () => {
        try {
            setLoading(true);
            const response = await fetch("../api/exams", {
                method: 'GET' 
            });

            if(!response.ok) {
                throw new Error('Failed to fetch exams');
            }

            const data = await response.json();
            setExams(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching exams:', err);
        } finally {
            setLoading(false);
        }
    };

    // Runs when page opens to get exams
    useEffect(() => {
        fetchExams();
    }, []);

    // Delete exam handler
    const handleDeleteClick = (examId: string, examTitle: string) => {
        setExamToDelete(examId);
        setExamTitleToDelete(examTitle);
        setDeleteModalOpen(true);
    }

    // Confirm delete exam
    const handleConfirmDelete = async () => {
        if(!examToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await fetch(`/api/exams?id=${examToDelete}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if(response.ok) {
                toast.success("Exam deleted successfully!");
                await fetchExams();
            } else {
                throw new Error(result.error || 'Failed to delete exam');
            }
        } catch (err) {
            console.error('Error deleting exam:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to delete exam');
        }

        // Always close modal and reset the states
        finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
            setExamToDelete(null);
            setExamTitleToDelete("");
        }
    };

    // Cancel delete exam
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setExamToDelete(null);
        setExamTitleToDelete("");
    };

    return (
        <LightBackground>
            <div className="flex flex-col justify-between min-h-screen p-8 text-center">
                <header>
                    <NavBar />
                </header>

                <main className="flex flex-col items-center justify-center pt-8 pb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4">
                        Generated Exams
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                        Manage and view all your previously generated exams.
                    </p>

                    {/* Exams Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100">
                        <div className="overflow-x-auto w-full max-w-full max-h-90 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 border-x border-gray-200 min-h-[400px]">
                                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Exam Title
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Difficulty
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Total Points
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Date Created
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Last Used
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        // Exams loading
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">Loading exams</div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        // Error while loading exams
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">Error loading exams</div>
                                                <div className="text-red-400 text-sm mt-2">{error}</div>
                                                <button 
                                                    onClick={fetchExams}
                                                    className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                                                    Retry
                                                </button>
                                            </td>
                                        </tr>
                                    ) : exams.length === 0 ? (
                                        // No exams
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">No exams found</div>
                                                <div className="text-gray-400 text-sm mt-2">Generate exams to see them listed here.</div>
                                            </td>
                                        </tr>
                                    ) : (
                                        // Exams data
                                        exams.map((exam, index) => (
                                            <tr key={exam._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                    <div className="truncate" title={exam.title}>
                                                        {exam.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {exam.difficulty
                                                        ? exam.difficulty
                                                        : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {exam.totalPoints
                                                        ? exam.totalPoints
                                                        : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {exam.createdAt
                                                        ? new Date(exam.createdAt).toLocaleDateString() // Format date based on user's locale
                                                        : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {exam.lastUsed
                                                        ? new Date(exam.lastUsed).toLocaleDateString()
                                                        : "Never"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button className="text-blue-600 hover:text-blue-900">
                                                            Edit
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteClick(exam._id, exam.title)}>
                                                            Delete
                                                        </button>
                                                        <button>
                                                            <svg
                                                            xmlns="http://www.w3.org/2000/svg" 
                                                            fill="none" 
                                                            viewBox="0 0 24 24" 
                                                            strokeWidth={1.5} 
                                                            stroke="currentColor" 
                                                            className="w-5 h-5">
                                                                <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    text={examTitleToDelete} // Question text is actually exam title here (kept it for component reuse)
                    isLoading={deleteLoading}
                    type="exam"
                />
            </div>
        </LightBackground>
    );
}