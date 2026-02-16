"use client";

import { useState, useEffect, useRef } from "react";
import NavBar from "@/components/navbar";
import QuestionForm from "@/components/QuestionForm";
import FilterBox from "@/components/filterBox";
import SelectBox from "@/components/SelectBox";
import ConfirmationModal from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import EditQuestionDatabaseModal from "@/components/EditQuestionDatabaseModal";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from "@/components/AuthContext";
import { LightBackground } from "@/components/BackgroundModal";
import { Question } from "@/types/question";
import CSVUploadModal from "@/components/CSVUploadModal";

export default function DatabaseActionPage() {
    const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);
    const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
    const [courseNums, setCourseNums] = useState<{ value: string; label: string }[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
    const [questionTextToDelete, setQuestionTextToDelete] = useState<string>("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
    const [lastUsedDate, setLastUsedDate] = useState<Dayjs | null>(null);
    const [dateInputValue, setDateInputValue] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLDivElement | null>(null);
    const { user } = useAuth();
    // Filter questions by logged-in user
    // If no user show all. Will proably need to be changed at somepoint 
    const filteredQuestions = user ? questions.filter(q => q.userID === user._id) : questions;

    //Filtering states
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedCourseNum, setselectedCourseNum] = useState<string>('');
    const [filtersApplied, setFiltersApplied] = useState(false);

    //File import states
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvModalOpen, setCSVModalOpen] = useState(false);

    // Pagination variables
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    //Fetch questions with filters
    const fetchQuestionsWithFilters = async () => {
        try {
            setLoading(true);

            //Build query parameters
            const params = new URLSearchParams();

            if (selectedTopic) params.append('topic', selectedTopic);
            if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
            if (selectedType) params.append('type', selectedType);
            if (selectedSubject) params.append('subject', selectedSubject);
            if (selectedCourseNum) params.append('courseNum', selectedCourseNum);
            if (lastUsedDate) params.append('lastUsed', lastUsedDate.format('MM-DD-YYYY'));
            if (user?._id) params.append("userId", user._id)
        
            params.set('page', String(page))
            params.set('limit', String(limit))

            const queryString = params.toString();
            const url = queryString ? `../api/questions?${queryString}` : '../api/questions';

            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            const data = await response.json();
            setQuestions(data.items ?? []);
            setTotalPages(data.totalPages ?? 1);
            setTotal(data.total ?? 0);
            

            // Only mark filtersApplied if real filters are on (ignore page/limit)
            const hasFilters =
            !!selectedTopic ||
            !!selectedDifficulty ||
            !!selectedType ||
            !!selectedSubject ||
            !!selectedCourseNum ||
            !!lastUsedDate;

            setFiltersApplied(hasFilters);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    //Apply filters
    const handleApplyFilters = () => {
        setPage(1);
        fetchQuestionsWithFilters();
    }

    //Clear filters
    const handleClearFilters = () => {
        setSelectedTopic('');
        setSelectedDifficulty('');
        setSelectedType('');
        setSelectedSubject('');
        setselectedCourseNum('');
        setLastUsedDate(null);
        setDateInputValue('');
        setFiltersApplied(false);
        setPage(1)
        fetchQuestionsWithFilters();
    }

    // //Fetch questions from MongoDB
    // const fetchQuestions = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await fetch("../api/questions", {
    //             method: 'GET',
    //         });

    //         if (!response.ok) {
    //             throw new Error('Failed to fetch questions');
    //         }

    //         const data = await response.json();
    //         setQuestions(data);
    //         setFiltersApplied(false);
    //     } catch (err) {
    //         setError(err instanceof Error ? err.message : 'An error occurred');
    //         console.error('Error fetching questions:', err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // //Runs when page opens to get questions
    // useEffect(() => {
    //     fetchQuestionsWithFilters();
    // }, []);

    //Runs when page or limit changes to get questions
    useEffect(() => {
        if (!user?._id) { // Only fetch questions if user is signed in
            setQuestions([]);
            setTotalPages(1);
            setTotal(0);
            setLoading(false);
            return;
        }
        fetchQuestionsWithFilters();
    }, [page, limit, user?._id]);

    // Set page back to one if user changes
    useEffect(() => {
        setPage(1);
        }, [user?._id]);

    //Creates a unique list of topics for the filter box
    useEffect(() => {
        const uniqueTopics = Array.from(
            new Set(questions.flatMap(quest => quest.topics))
        ).map(topic => ({ value: topic, label: topic }));

        //Store the list of unique topics if any changes occur in questions
        setTopics(uniqueTopics);
    }, [questions]);

    //Creates a unique list of subjects for the filter box
    useEffect(() => {
        const uniqueSubjects = Array.from(
            new Set(questions.map(quest => quest.subject?.trim()).filter((s): s is string => !!s))
        ).map(subject => ({ value: subject, label: subject }));

        //Store the list of unique topics if any changes occur in questions
        setSubjects(uniqueSubjects);
    }, [questions]);

    //Creates a unique list of course numbers for the filter box
    useEffect(() => {
        const uniqueCourseNums = Array.from(
            new Set(questions.map(quest => quest.courseNum?.trim()).filter((s): s is string => !!s))
        ).map(courseNum => ({ value: courseNum, label: courseNum }));

        //Store the list of unique topics if any changes occur in questions
        setCourseNums(uniqueCourseNums);
    }, [questions]);

    //Runs when the add question form closes to potentially grab new questions just added
    const handleFormClose = () => {
        setIsQuestionFormOpen(false);
        fetchQuestionsWithFilters();
    };

    //Helper function to format choices (label then text plus can have multiple choices)
    const formatChoices = (choices: any[] | undefined): string => {
        if (!choices || !Array.isArray(choices)) return 'N/A';

        return choices.map(choice => {
            if (choice.label && choice.text) {
                if (choice.label == "True" || choice.label == "False") {
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

    //Helper function to format topics (can have multiple topics)
    const formatTopics = (topics: string[] | undefined): string => {
        if (!topics || !Array.isArray(topics)) return 'No topic';
        return topics.join(', ');
    };

    //Delete question handler
    const handleDeleteClick = (questionId: string, questionStem: string) => {
        setQuestionToDelete(questionId);
        setQuestionTextToDelete(questionStem);
        setDeleteModalOpen(true);
    };

    //Confirm delete question
    const handleConfirmDelete = async () => {
        if (!questionToDelete) return;

        try {
            setDeleteLoading(true);
            const response = await fetch(`/api/questions?id=${questionToDelete}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Question deleted successfully!");
                await fetchQuestionsWithFilters();
            } else {
                throw new Error(result.error || 'Failed to delete question');
            }

        } catch (err) {
            console.error('Error deleting question:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to delete question');
        }
        //Always runs to stop loading and close modal
        finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
            setQuestionToDelete(null);
            setQuestionTextToDelete("");
        }
    };

    //Cancel delete question
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setQuestionToDelete(null);
        setQuestionTextToDelete("");
    };

    //Edit question handler
    const handleEditClick = (question: Question) => {
        setQuestionToEdit(question);
        setEditModalOpen(true);
    };

    //Handle when edit is complete
    const handleEditComplete = () => {
        setEditModalOpen(false);
        setQuestionToEdit(null);
        fetchQuestionsWithFilters();
    };

    const handleDateInputChange = (inputValue: string) => {
        setDateInputValue(inputValue);

        //Try to parse it, but don't worry if it's invalid
        const parsedDate = dayjs(inputValue, 'MM/DD/YYYY', true);
        if (parsedDate.isValid()) {
            setLastUsedDate(parsedDate);
        } else {
            setLastUsedDate(null);
        }
    };

    //Update when calendar is used
    const handleCalendarChange = (newValue: Dayjs | null) => {
        setLastUsedDate(newValue);
        setDateInputValue(newValue ? newValue.format('MM/DD/YYYY') : '');
        setCalendarOpen(false);
    };

    //CSV import handler
    const handleImportCSV = async (file: File) => {
        try {
            setImportLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            if (user?._id) {
                formData.append('userID', user._id);
            }

            const response = await fetch('/api/questions/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Successfully imported ${result.importedCount} questions!`);
                fetchQuestionsWithFilters(); //Refresh the questions list
                setCSVModalOpen(false);
            } else {
                throw new Error(result.error || 'Failed to import questions');
            }
        } catch (err) {
            console.error('Error importing CSV:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to import questions');
        } finally {
            setImportLoading(false);
        }
    };

    //Trigger file input click for CSV import
    const handleImportClick = () => {
        setCSVModalOpen(true);
    };

    return (
        <LightBackground>
            <div className="flex flex-col justify-between min-h-screen p-4 text-center">
                <header>
                    <NavBar />
                </header>
                <main className="flex flex-col items-center justify-center pt-8">
                    <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                        Question Bank
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                        Manage and view all questions in the database. Filter by topic, difficulty, or type to find specific questions.
                    </p>

                    {/* Not logged in message */}
                    {!user && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                            <h3 className="font-semibold text-yellow-800 mb-2">
                                Login Required
                            </h3>
                            <p className="text-yellow-700">
                                Please log in to access your questions
                            </p>
                        </div>
                    )}

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
                                onSelect={setSelectedTopic}
                                value={selectedTopic}
                                page="databaseView"
                            />

                            {/* Difficulty Filter */}
                            <SelectBox
                                label="Difficulty"
                                placeholder="All Difficulties"
                                options={[
                                    { value: '', label: 'All Difficulties' },
                                    { value: '1', label: '1' },
                                    { value: '2', label: '2' },
                                    { value: '3', label: '3' },
                                    { value: '4', label: '4' },
                                    { value: '5', label: '5' },
                                ]}
                                onSelect={setSelectedDifficulty}
                                value={selectedDifficulty}
                            />

                            {/* Type Filter */}
                            <SelectBox
                                label="Type"
                                placeholder="All Types"
                                options={[
                                    { value: '', label: 'All Types' },
                                    { value: 'Multiple Choice', label: 'Multiple Choice' },
                                    { value: 'Essay', label: 'Essay' },
                                    { value: 'FIB', label: 'Fill In The Blank' },
                                    { value: 'True/False', label: 'True/False' },
                                    { value: 'Code', label: 'Code' },
                                ]}
                                onSelect={setSelectedType}
                                value={selectedType}
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
                                page="databaseView"
                            />

                            {/* Course number Filter Box */}
                            <FilterBox
                                options={courseNums}
                                label="Course Number"
                                placeholder="Search a Course Number"
                                onSelect={setselectedCourseNum}
                                value={selectedCourseNum}
                                page="databaseView"
                            />

                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Used
                                </label>
                                <div className="relative" ref={setCalendarAnchorEl}>
                                    <input
                                        type="text"
                                        placeholder="Ex: 01/01/2025"
                                        value={dateInputValue}
                                        onChange={(e) => handleDateInputChange(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
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
                                        value={lastUsedDate}
                                        onChange={(newValue) => {
                                            setLastUsedDate(newValue);
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
                            <button onClick={handleClearFilters} className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                                Clear Filters
                            </button>
                            <button onClick={handleApplyFilters} className="px-6 py-3 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5" disabled={!user}>
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Pages */}                  
                    <div className="flex items-center gap-3 mb-5">
                        <button
                            className="btn btn-ghost"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Prev
                        </button>

                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            className="btn btn-ghost"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </button>

                        <select
                            className="border rounded-xl px-2 py-1 text-sm"
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        </div>



                    {/* Questions Table */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100">
                        <div className="overflow-x-auto w-full max-w-full max-h-120 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 border-x border-gray-200">
                                <thead className="bg-linear-to-r from-blue-50 to-cyan-50 sticky top-0">
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
                                            Subject
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200">
                                            Course Number
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200 max-w-72">
                                            Choices
                                        </th>
                                        <th className="px-6 py-4text-center text-xs font-semibold text-blue-900 uppercase tracking-wider border-r border-gray-200 max-w-72">
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
                                    {loading && user ? (
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
                                                    onClick={fetchQuestionsWithFilters}
                                                    className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                                                    Retry
                                                </button>
                                            </td>
                                        </tr>
                                    ) : !user ? (
                                        //Not logged in
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">Please log in to view your questions</div>
                                            </td>
                                        </tr>
                                    ): filteredQuestions.length == 0 ? (
                                        //No questions
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-gray-400 text-lg">No questions found</div>
                                                <div className="text-gray-400 text-sm mt-2">Add a question to get started</div>
                                            </td>
                                        </tr>
                                    )  : (
                                        //Questions data
                                        filteredQuestions.map((question, index) => (
                                            <tr key={question._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                    <div className="truncate" title={question.stem}>
                                                        {question.stem}
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {question.subject || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {question.courseNum || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs border-r border-gray-200">
                                                    <div className="truncate" title={formatChoices(question.choices)}>
                                                        {formatChoices(question.choices)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 max-w-72">
                                                    <div className="truncate" title={formatAnswers(question)}>
                                                        {formatAnswers(question)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                                    {question.lastUsed || 'Never'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button className="text-blue-600 hover:text-blue-900 mr-3" onClick={() => handleEditClick(question)}>
                                                        Edit
                                                    </button>
                                                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteClick(question._id, question.stem)}>
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


                    {/* Add Question Button and Import*/}
                    <div className="mt-12 flex justify-center">
                        <div>
                            <button className="px-12 py-5 bg-gray-800 text-white text-xl font-bold rounded-2xl hover:bg-gray-900 transition-all duration-300 shadow-2xl transform hover:-translate-y-1 hover:shadow-3xl flex items-center gap-2" onClick={() => setIsQuestionFormOpen(true)} disabled={!user}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Add New Question to Database
                            </button>
                        </div>
                        <div className="pl-6">
                            <button
                                className="px-12 py-5 bg-gray-800 text-white text-xl font-bold rounded-2xl hover:bg-gray-900 transition-all duration-300 shadow-2xl transform hover:-translate-y-1 hover:shadow-3xl flex items-center gap-2"
                                onClick={handleImportClick}
                                disabled={!user}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                </svg>
                                Upload Questions from CSV
                            </button>
                        </div>
                    </div>
                </main>
                {isQuestionFormOpen && (
                    <QuestionForm isOpen={isQuestionFormOpen} onClose={handleFormClose} />
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    text={questionTextToDelete}
                    isLoading={deleteLoading}
                    type="question"
                />

                {/* Edit Question Modal */}
                <EditQuestionDatabaseModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    question={questionToEdit}
                    onQuestionUpdated={handleEditComplete}
                />

                {/* CSV Upload Modal */}
                <CSVUploadModal
                    isOpen={csvModalOpen}
                    onClose={() => setCSVModalOpen(false)}
                    onUpload={handleImportCSV}
                    isLoading={importLoading}
                />
            </div>
        </LightBackground>

    );
}




