"use client";

import React from "react";
import NavBar from "@/components/navbar";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Link from "next/link";
import { LightBackground } from "@/components/BackgroundModal";
import SelectBox from "@/components/SelectBox";
import FilterBox from "@/components/filterBox";
import { DownloadExamTXT, DownloadExamPDF, DownloadExamCSV, DownloadExamDOCX, DownloadAnswerKeyPDF, DownloadAnswerKeyTXT, DownloadAnswerKeyDOCX, DownloadAnswerKeyCSV, downloadExamPackage } from "@/components/ExamDownload"
import type { ExamWithMeta } from "@/types/exam";
import { useAuth } from "@/components/AuthContext";

export default function PastExams() {
    const [exams, setExams] = useState<ExamWithMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);
    const [examTitleToDelete, setExamTitleToDelete] = useState<string>("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
    const [courseNums, setCourseNums] = useState<{ value: string; label: string }[]>([]);
    const [names, setNames] = useState<{ value: string; label: string }[]>([]);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLElement | null>(null);
    const [dateInputValue, setDateInputValue] = useState<string>("");
    type DownloadFormat = "pdf" | "txt" | "csv" | "docx";
    const [openDownloadMenuId, setOpenDownloadMenuId] = useState<string | null>(null);

    // Filtering states
    const [selectedName, setSelectedName] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const [selectedTotalPoints, setSelectedTotalPoints] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedCourseNum, setSelectedCourseNum] = useState<string>('');
    const [selectedLastUsed, setSelectedLastUsed] = useState<Dayjs | null>(null);
    const [filtersApplied, setFiltersApplied] = useState<boolean>(false);

    //Get user from auth context
    const { user } = useAuth();
    const filteredExams = exams;

    // Fetch exams from MongoDB
    const fetchExamsWithFilters = async () => {
        try {
            setLoading(true);

            // Build query parameters based on selected filters
            const queryParams = new URLSearchParams();
            if (!user?._id) {
                setExams([]);
                setFiltersApplied(false);
                return;
            }
            queryParams.append("userID", user._id);
            if (selectedName) queryParams.append('name', selectedName);
            if (selectedDifficulty) queryParams.append('difficulty', selectedDifficulty);
            if (selectedTotalPoints) queryParams.append('totalPoints', selectedTotalPoints);
            if (selectedSubject) queryParams.append('subject', selectedSubject);
            if (selectedCourseNum) queryParams.append('courseNum', selectedCourseNum);
            if (selectedLastUsed) queryParams.append('lastUsed', selectedLastUsed.format('MM-DD-YYYY'));

            const queryString = queryParams.toString();
            const url = queryString ? `/api/exams?${queryString}` : '/api/exams';

            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch exams`);
            }

            const data = await response.json();
            setExams(data);
            setFiltersApplied(queryString.length > 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching exams:', err);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    const handleApplyFilters = async () => {
        fetchExamsWithFilters();
    }

    // Clear filters
    const handleClearFilters = async () => {
        setSelectedName('');
        setSelectedDifficulty('');
        setSelectedTotalPoints('');
        setSelectedSubject('');
        setSelectedCourseNum('');
        setSelectedLastUsed(null);
        setDateInputValue('');
        setFiltersApplied(false);
        fetchExams();
    }

    // Fetch exams from MongoDB without filters
    const fetchExams = async () => {
        try {
            setLoading(true);

            if (!user?._id) {
                setExams([]);
                setFiltersApplied(false);
                return;
            }
            
            const response = await fetch(`/api/exams?userID=${user._id}`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch exams`);
            }

            const data = await response.json();
            setExams(data);
            setFiltersApplied(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching exams:', err);
        } finally {
            setLoading(false);
        }
    };

    // Runs when page opens to get exams
    useEffect(() => {
        if (!user?._id) {
            setExams([]);
            setFiltersApplied(false);
            setLoading(false);
            return;
        }
        fetchExams();
    }, [user]);

    //Creates a unique list of subjects and course numbers for the filter box
    useEffect(() => {
        if (!user) {
            setSubjects([]);
            setCourseNums([]);
            setNames([]);
            return;
        }
        const uniqueSubjects = Array.from(
            new Set(exams.map(e => e.subject?.trim()).filter((s): s is string => !!s))
        ).map(subject => ({ value: subject, label: subject }));

        const uniqueCourseNums = Array.from(
            new Set(exams.map(e => e.courseNum?.trim()).filter((s): s is string => !!s))
        ).map(courseNum => ({ value: courseNum, label: courseNum }));

        const uniqueNames = Array.from(
            new Set(exams.map(e => e.title?.trim()).filter((s): s is string => !!s))
        ).map(name => ({ value: name, label: name }));

        //Store the list of unique topics if any changes occur in questions
        setCourseNums(uniqueCourseNums);

        //Store the list of unique topics if any changes occur in questions
        setSubjects(uniqueSubjects);

        //Store the list of unique names if any changes occur in questions
        setNames(uniqueNames);
    }, [exams, user]);

    // Delete exam handler
    const handleDeleteClick = (examId: string, examTitle: string) => {
        setExamToDelete(examId);
        setExamTitleToDelete(examTitle);
        setDeleteModalOpen(true);
    }

    // Confirm delete exam
    const handleConfirmDelete = async () => {
        if (!examToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await fetch(`/api/exams?id=${examToDelete}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
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

    const handleDownloadExam = async (exam: ExamWithMeta, format: DownloadFormat) => {
        try {
            toast.loading('Creating download package...', { id: 'download' });
            await downloadExamPackage(exam, format);
            toast.success('Download package created!', { id: 'download' });
        }
        catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to create download package', { id: 'download' });
            toast.loading('Downloading individual files...', { id: 'download' });

            if (format === "txt") {
                DownloadExamTXT(exam);        // or exam as any / ExamDoc if needed
                DownloadAnswerKeyTXT(exam);
            } else if (format === "pdf") {
                DownloadExamPDF(exam);
                DownloadAnswerKeyPDF(exam);
            } else if (format === "csv") {
                DownloadExamCSV(exam);
                DownloadAnswerKeyCSV(exam);
            } else if (format === "docx") {
                DownloadExamDOCX(exam);
                DownloadAnswerKeyDOCX(exam);
            }

            toast.success('Individual files downloaded', { id: 'download-fallback' });
        }
    };

    const handleDateInputChange = (inputValue: string) => {
        setDateInputValue(inputValue);

        //Try to parse it, but don't worry if it's invalid
        const parsedDate = dayjs(inputValue, 'MM/DD/YYYY', true);
        if (parsedDate.isValid()) {
            setSelectedLastUsed(parsedDate);
        } else {
            setSelectedLastUsed(null);
        }
    };

    //Update when calendar is used
    const handleCalendarChange = (newValue: Dayjs | null) => {
        setSelectedLastUsed(newValue);
        setDateInputValue(newValue ? newValue.format('MM/DD/YYYY') : '');
        setCalendarOpen(false);
    };

    return (
        <LightBackground>
            <div className="flex flex-col justify-between min-h-screen p-4 text-center">
                <header>
                    <NavBar />
                </header>

                <main className="flex flex-col items-center justify-center pt-8">
                    <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4">
                        Generated Exams
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                        Manage and view all your previously generated exams.
                    </p>
                    {/* Not logged in message */}
                    {!user && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                            <h3 className="font-semibold text-yellow-800 mb-2">
                                Login Required
                            </h3>
                            <p className="text-yellow-700">
                                Please log in to view past exams
                            </p>
                        </div>
                    )}
                    {/* Filtering Section */}
                    <div className="relative z-30 bg-white rounded-2xl shadow-lg p-6 mb-8 w-full border border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-left">
                            Filter Exams
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Exam Name Filter */}
                            <FilterBox
                                label="Exam Name"
                                placeholder="Search by exam name"
                                options={names}
                                onSelect={setSelectedName}
                                value={selectedName}
                            />

                            {/* Difficulty Filter */}
                            <SelectBox
                                label="Difficulty"
                                placeholder="All Difficulties"
                                options={[
                                    { value: '', label: 'All Difficulties' },
                                    { value: 'easy', label: 'Easy' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'hard', label: 'Hard' },
                                    { value: 'mixed', label: 'Mixed' },
                                ]}
                                onSelect={setSelectedDifficulty}
                                value={selectedDifficulty}
                            />

                            {/* Total Points Filter */}
                            <SelectBox
                                label="Total Points"
                                placeholder="Total Points"
                                options={[
                                    { value: '', label: 'All Points' },
                                    { value: '1-5', label: '1-5' },
                                    { value: '6-10', label: '6-10' },
                                    { value: '11-15', label: '11-15' },
                                    { value: '16-20', label: '16-20' },
                                    { value: '25+', label: '25+' },
                                ]}
                                onSelect={setSelectedTotalPoints}
                                value={selectedTotalPoints}
                            />
                        </div>


                        {/* Last Used Filter */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            {/* Subject Filter Box */}
                            <FilterBox
                                options={subjects}
                                label="Subject"
                                placeholder="Search a subject"
                                onSelect={setSelectedSubject}
                                value={selectedSubject}
                            />

                            {/* Course number Filter Box */}
                            <FilterBox
                                options={courseNums}
                                label="Course Number"
                                placeholder="Search a Course Number"
                                onSelect={setSelectedCourseNum}
                                value={selectedCourseNum}
                            />

                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Used
                                </label>
                                <div className="relative" ref={setCalendarAnchorEl}>
                                    <input
                                        type="text"
                                        placeholder="Ex: 01/01/2025"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                        value={dateInputValue}
                                        onChange={(e) => handleDateInputChange(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setCalendarOpen(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
                                        </svg>
                                    </button>
                                </div>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        open={calendarOpen}
                                        onClose={() => setCalendarOpen(false)}
                                        value={selectedLastUsed}
                                        onChange={(newValue) => {
                                            setSelectedLastUsed(newValue);
                                            setCalendarOpen(false);
                                            handleCalendarChange(newValue);
                                        }}
                                        slotProps={{
                                            popper: {
                                                anchorEl: calendarAnchorEl,
                                                placement: 'bottom-start',
                                                modifiers: [
                                                    {
                                                        name: 'flip',
                                                        enabled: false,
                                                    },
                                                    {
                                                        name: 'preventOverflow',
                                                        enabled: true,
                                                        options: {
                                                            boundary: 'viewport',
                                                            altBoundary: true,
                                                        },
                                                    },
                                                ],
                                            },
                                        }}
                                        slots={{
                                            field: () => null,
                                        }}
                                    />
                                </LocalizationProvider>
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-end space-x-4 mt-8">
                            <button
                                onClick={handleClearFilters}
                                className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                                disabled={!user}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Exams Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100">
                        <div className="overflow-x-auto w-full max-w-full max-h-120 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 border-x border-gray-200">
                                <thead className="bg-linear-to-r from-blue-50 to-cyan-50 sticky top-0 z-20">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Exam Title
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Subject
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Course Number
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
                                    {loading && user ? (
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
                                    ) : !user ? (
                                        // Not logged in
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">Please log in to view your past exams</div>
                                            </td>
                                        </tr>
                                    ) : filteredExams.length === 0 ? (
                                        // No exams
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">No exams found</div>
                                                <div className="text-gray-400 text-sm mt-2">Generate exams to see them listed here.</div>
                                            </td>
                                        </tr>
                                    ) : (
                                        // Exams data
                                        filteredExams.map((exam, index) => (
                                            <tr key={exam._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                    <div className="truncate" title={exam.title}>
                                                        {exam.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                    <div className="truncate" title={exam.title}>
                                                        {exam.subject ? exam.subject : "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                    <div className="truncate" title={exam.title}>
                                                        {exam.courseNum ? exam.courseNum : "N/A"}
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
                                                        <Link href={`/edit_exam/${exam._id}`} className="text-blue-600 hover:text-blue-900">
                                                            Edit
                                                        </Link>
                                                        <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteClick(exam._id, exam.title)}>
                                                            Delete
                                                        </button>
                                                        {/* Download menu */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={() =>
                                                                    setOpenDownloadMenuId(
                                                                        openDownloadMenuId === exam._id ? null : exam._id
                                                                    )
                                                                }
                                                                className="p-1 rounded hover:bg-gray-100"
                                                                aria-label="Download exam"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.5}
                                                                    stroke="currentColor"
                                                                    className="w-5 h-5 hover:-translate-y-0.5"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                                                    />
                                                                </svg>
                                                            </button>

                                                            {openDownloadMenuId === exam._id && (
                                                                <div className="absolute right-0 top-full mt-2 w-35 rounded-lg border bg-white shadow-lg text-sm z-10 overflow-hidden">
                                                                    <button
                                                                        className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                                                        onClick={() => handleDownloadExam(exam, "pdf")}
                                                                    >
                                                                        Download PDF
                                                                    </button>
                                                                    <button
                                                                        className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                                                        onClick={() => handleDownloadExam(exam, "txt")}
                                                                    >
                                                                        Download TXT
                                                                    </button>
                                                                    <button
                                                                        className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                                                        onClick={() => handleDownloadExam(exam, "docx")}
                                                                    >
                                                                        Download DOCX
                                                                    </button>
                                                                    <button
                                                                        className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                                                                        onClick={() => handleDownloadExam(exam, "csv")}
                                                                    >
                                                                        Download CSV
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
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