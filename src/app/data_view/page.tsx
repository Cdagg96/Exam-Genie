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
import { Background } from "@/components/BackgroundModal";
import { Question } from "@/types/question";
import CSVUploadModal from "@/components/CSVUploadModal";
import useTheme from "@/hooks/useTheme"

function SortableHeader({
    label,
    field,
    sortBy,
    sortOrder,
    onSort,
}: {
    label: string;
    field: "difficulty" | "lastUsed";
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort: (field: "difficulty" | "lastUsed") => void;
}) {
    const isActive = sortBy === field;

    return (
        <button
            type="button"
            onClick={() => onSort(field)}
            className="inline-flex items-center justify-center gap-1 w-full"
        >
            <span>{label}</span>
            <span className="text-xs">
                {isActive ? (sortOrder === "asc" ? (
                    <svg className="w-3 h-3 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 5l5 6H5l5-6z" />
                    </svg>
                ) : (
                    <svg className="w-3 h-3 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 15l-5-6h10l-5 6z" />
                    </svg>
                )) :
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5 ml-1 text-primary"
                        >
                        <path d="M10 4l-3 3h6l-3-3z" />
                        <path d="M10 16l3-3H7l3 3z" />
                    </svg> 
                }
            </span>
        </button>
    );
}

export default function DatabaseActionPage() {
    const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
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
    const [lastUsedFilterType, setLastUsedFilterType] = useState<'before' | 'after' | 'range' | 'never'>('before');
    const [lastUsedDateEnd, setLastUsedDateEnd] = useState<Dayjs | null>(null);
    const [dateInputValueEnd, setDateInputValueEnd] = useState('');
    const [calendarEndOpen, setCalendarEndOpen] = useState(false);
    const [calendarEndAnchorEl, setCalendarEndAnchorEl] = useState<HTMLDivElement | null>(null);
    const { user } = useAuth();
    // Filter questions by logged-in user
    // If no user show all. Will proably need to be changed at somepoint 
    const filteredQuestions = questions;

    //Filtering states
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedCourseNum, setselectedCourseNum] = useState<string>('');
    const [filtersApplied, setFiltersApplied] = useState(false);
    const [allFilterQuestions, setAllFilterQuestions] = useState<Question[]>([]);

    //File import states
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvModalOpen, setCSVModalOpen] = useState(false);

    // Pagination variables
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState(page.toString());
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Custom ordering states
    const [sortBy, setSortBy] = useState<"difficulty" | "lastUsed" | "">("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    //Fetch questions with filters
    const fetchQuestionsWithFilters = async () => {
        try {
            setLoading(true);

            //Build query parameters
            const params = new URLSearchParams();

            if (!user?._id) {
                setQuestions([]);
                setFiltersApplied(false);
                return;
            }
            params.append("userID", user._id);
            if (selectedTopic) params.append('topic', selectedTopic);
            if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
            if (selectedType) params.append('type', selectedType);
            if (selectedSubject) params.append('subject', selectedSubject);
            if (selectedCourseNum) params.append('courseNum', selectedCourseNum);
            if (sortBy) params.append("sortBy", sortBy);
            if (sortOrder) params.append("sortOrder", sortOrder);
            
            //Updated last used filter with type and end date
            if (lastUsedDate && lastUsedFilterType !== 'never') {
                params.append('lastUsed', lastUsedDate.format('MM-DD-YYYY'));
                params.append('lastUsedFilterType', lastUsedFilterType);
                
                if (lastUsedFilterType === 'range' && lastUsedDateEnd) {
                    params.append('lastUsedEnd', lastUsedDateEnd.format('MM-DD-YYYY'));
                }
            }
            else if (lastUsedFilterType === 'never') {
                params.append('lastUsedFilterType', 'never');
            }

            //if (user?._id) params.append("userId", user._id)

            params.set('page', String(page))
            params.set('limit', String(limit))
        

            const queryString = params.toString();
            const url = queryString ? `../api/questions?${queryString}` : '../api/questions';
            console.log("TABLE QUESTIONS URL:", url);

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
                !!lastUsedDate ||
                lastUsedFilterType === 'never';

            setFiltersApplied(hasFilters);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterQuestions = async () => {
        try {
            if (!user?._id) {
                setAllFilterQuestions([]);
                return;
            }
            

            const params = new URLSearchParams();
            params.append("userId", user._id);

            // no page / limit, so API returns all matching questions
            const url = `../api/questions?${params.toString()}`;
            console.log("FILTER QUESTIONS URL:", url);
            const response = await fetch(`../api/questions?${params.toString()}`, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch filter questions");
            }

            const data = await response.json();

            console.log("fetchFilterQuestions raw data:", data);
            console.log(
                "fetchFilterQuestions count:",
                Array.isArray(data) ? data.length : "not-array"
            );
            setAllFilterQuestions(Array.isArray(data) ? data : []);
            console.log(
                "setting allFilterQuestions to:",
                Array.isArray(data) ? data.length : 0
            );
        } catch (err) {
            console.error("Error fetching filter questions:", err);
            setAllFilterQuestions([]);
        }
    };

    //Apply filters
    const handleApplyFilters = () => {
        setPage(1);
        if (page === 1) {
            fetchQuestionsWithFilters();
        }
    }

    //Clear filters
    const handleClearFilters = async () => {
        setSelectedTopic('');
        setSelectedDifficulty('');
        setSelectedType('');
        setSelectedSubject('');
        setselectedCourseNum('');
        setLastUsedDate(null);
        setLastUsedDateEnd(null);
        setDateInputValue('');
        setDateInputValueEnd('');
        setLastUsedFilterType('before');
        setFiltersApplied(false);
        setPage(1);

        const params = new URLSearchParams();
        if (user?._id) {
            params.append("userId", user._id);
        }
        params.set("page", "1");
        params.set("limit", String(limit));
        if (sortBy) params.append("sortBy", sortBy);
        if (sortOrder) params.append("sortOrder", sortOrder);

        const response = await fetch(`../api/questions?${params.toString()}`, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        setQuestions(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
    };

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
    }, [page, limit, sortBy, sortOrder, user?._id]);

    useEffect(() => {
        fetchFilterQuestions();
    }, [user?._id]);

    // Set page back to one if user changes
    useEffect(() => {
        setPage(1);
    }, [user?._id]);

    // Loads the current number for pagination
    useEffect(() => {
        setPageInput(page.toString());
    }, [page]);

    // Guarantees the displayed number never exceeds the last page
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
            setPageInput(totalPages.toString());
        }
    }, [totalPages]);

    //Creates a unique list of topics for the filter box
    useEffect(() => {
        if (!user?._id) {
            setTopics([]);
            return;
        }
        const uniqueTopics = Array.from(
            new Set(allFilterQuestions.flatMap(quest => quest.topics || []))
        ).map(topic => ({ value: topic, label: topic }));

        //Store the list of unique topics if any changes occur in questions
        setTopics(uniqueTopics);
    }, [allFilterQuestions, user?._id]);

    //Creates a unique list of subjects for the filter box
    useEffect(() => {
        if (!user?._id) {
            setSubjects([]);
            return;
        }
        const uniqueSubjects = Array.from(
            new Set(
                allFilterQuestions.map(quest => quest.subject?.trim()).filter((s): s is string => !!s))
        ).map(subject => ({ value: subject, label: subject }));

        //Store the list of unique topics if any changes occur in questions
        setSubjects(uniqueSubjects);
    }, [allFilterQuestions, user?._id]);

    //Creates a unique list of course numbers for the filter box
    useEffect(() => {
        if (!user?._id) {
            setCourseNums([]);
            return;
        }
        const uniqueCourseNums = Array.from(
            new Set(allFilterQuestions.map(quest => quest.courseNum?.trim()).filter((s): s is string => !!s))
        ).map(courseNum => ({ value: courseNum, label: courseNum }));

        //Store the list of unique topics if any changes occur in questions
        setCourseNums(uniqueCourseNums);
    }, [allFilterQuestions, user?._id]);

    useEffect(() => {
        console.log("allFilterQuestions length:", allFilterQuestions.length);
        console.log("topics length:", topics.length, topics);
        console.log("subjects length:", subjects.length, subjects);
        console.log("courseNums length:", courseNums.length, courseNums);
        console.log("questions length (current page only):", questions.length);
        console.log("current limit:", limit);
    }, [allFilterQuestions, topics, subjects, courseNums, questions, limit]);

    //Runs when the add question form closes to potentially grab new questions just added
    const handleFormClose = () => {
        setIsQuestionFormOpen(false);
        fetchQuestionsWithFilters();
        fetchFilterQuestions();
    };

    const handleSort = (field: "difficulty" | "lastUsed") => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }

        setPage(1);
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
                await fetchFilterQuestions();
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
        fetchFilterQuestions();
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

    const handleDateInputChangeEnd = (inputValue: string) => {
        setDateInputValueEnd(inputValue);

        //Try to parse it
        const parsedDate = dayjs(inputValue, 'MM/DD/YYYY', true);
        if (parsedDate.isValid()) {
            setLastUsedDateEnd(parsedDate);
        } else {
            setLastUsedDateEnd(null);
        }
    };

    //Update when calendar is used
    const handleCalendarChange = (newValue: Dayjs | null) => {
        setLastUsedDate(newValue);
        setDateInputValue(newValue ? newValue.format('MM/DD/YYYY') : '');
        setCalendarOpen(false);
    };

    //Update when end calendar is used
    const handleCalendarChangeEnd = (newValue: Dayjs | null) => {
        setLastUsedDateEnd(newValue);
        setDateInputValueEnd(newValue ? newValue.format('MM/DD/YYYY') : '');
        setCalendarEndOpen(false);
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
                if (result.importedCount != 0) {
                    toast.success(`Successfully imported ${result.importedCount} questions!`);
                }
                if (result?.ignoredCount && result.ignoredCount > 0) {
                    toast(`${result.ignoredCount} questions ignored missing required fields`);
                }
                fetchQuestionsWithFilters(); //Refresh the questions list
                fetchFilterQuestions();
                setCSVModalOpen(false);
            } else {
                toast.error(result?.error || "Failed to import questions");
                if (result?.ignoredCount && result.ignoredCount > 0) {
                    toast(`${result.ignoredCount} questions ignored missing required fields`);
                }
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

    //Color the questions table even if its not entirely full with data
    let counter;

    return (
        <Background>
            <div className="flex flex-col justify-between min-h-screen p-4 text-center">
                <header>
                    <NavBar />
                </header>
                <main className="flex flex-col items-center justify-center pt-8">
                    <h1 className="text-4xl mb-4 text-blue-gradient">
                        Question Bank
                    </h1>
                    <p className="text-secondary mb-8 text-lg max-w-2xl">
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
                    <div className="card-primary p-6 mb-8 w-full">
                        <h2 className="text-2xl text-primary mb-6 text-left">
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
                                maxLength={50}
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
                                maxLength={50}
                            />

                            {/* Course number Filter Box */}
                            <FilterBox
                                options={courseNums}
                                label="Course Number"
                                placeholder="Search a Course Number"
                                onSelect={setselectedCourseNum}
                                value={selectedCourseNum}
                                page="databaseView"
                                maxLength={50}
                            />

                            <div className="text-left">
                                {/* Filter Type Selector */}
                                <div className="flex items-center gap-2 flex-wrap py-1 -mt-2">
                                    <label className="block text-sm text-primary whitespace-nowrap">
                                        Last Used
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType('before')}
                                        className={`px-3 py-1 text-sm rounded-xl transition-colors ${
                                            lastUsedFilterType === 'before'
                                                ? 'btn-primary-blue'
                                                : 'btn-ghost'
                                        }`}
                                    >
                                        Before
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType('after')}
                                        className={`px-3 py-1 text-sm rounded-xl transition-colors ${
                                            lastUsedFilterType === 'after'
                                                ? 'btn-primary-blue'
                                                : 'btn-ghost'
                                        }`}
                                    >
                                        After
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType('range')}
                                        className={`px-3 py-1 text-sm rounded-xl transition-colors ${
                                            lastUsedFilterType === 'range'
                                                ? 'btn-primary-blue'
                                                : 'btn-ghost'
                                        }`}
                                    >
                                        Range
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLastUsedFilterType('never')}
                                        className={`px-3 py-1 text-sm rounded-xl transition-colors ${
                                            lastUsedFilterType === 'never'
                                                ? 'btn-primary-blue'
                                                : 'btn-ghost'
                                        }`}
                                    >
                                        Never
                                    </button>
                                </div>
                                
                                {lastUsedFilterType !== 'never' && (
                                    <>
                                        {/* Start Date Picker */}
                                        <div className="relative mb-2" ref={setCalendarAnchorEl}>
                                            <input
                                                type="text"
                                                placeholder={lastUsedFilterType === "range" ? "Start date (MM/DD/YYYY)" : "MM/DD/YYYY"}
                                                value={dateInputValue}
                                                onChange={(e) => handleDateInputChange(e.target.value)}
                                                className="w-full border-primary text-secondary px-4 py-3 pr-12"
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

                                        {/* End Date Picker */}
                                        {lastUsedFilterType === 'range' && (
                                            <div className="relative" ref={setCalendarEndAnchorEl}>
                                                <input
                                                    type="text"
                                                    placeholder="End date (MM/DD/YYYY)"
                                                    value={dateInputValueEnd}
                                                    onChange={(e) => handleDateInputChangeEnd(e.target.value)}
                                                    className="w-full border-primary text-secondary px-4 py-3 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                    onClick={() => setCalendarEndOpen(true)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
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
                                    {/* End Date Picker */}
                                    {lastUsedFilterType === 'range' && (
                                        <DatePicker
                                            open={calendarEndOpen}
                                            onClose={() => setCalendarEndOpen(false)}
                                            value={lastUsedDateEnd}
                                            onChange={(newValue) => {
                                                setLastUsedDateEnd(newValue);
                                                setCalendarEndOpen(false);
                                                handleCalendarChangeEnd(newValue);
                                            }}
                                            slotProps={{
                                                popper: {
                                                    anchorEl: calendarEndAnchorEl,
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
                                    )}
                                </LocalizationProvider>
                            </div>
                        </div>


                        {/* Filter Actions */}
                        <div className="flex justify-end space-x-4 mt-8">
                            <button onClick={handleClearFilters} className="px-6 py-3 btn btn-ghost">
                                Clear Filters
                            </button>
                            <button onClick={handleApplyFilters} className="px-6 py-3 btn btn-primary-blue" disabled={!user}>
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

                        <div className="flex items-center gap-2 text-sm text-primary">
                            <span>Page</span>

                            <input
                                value={pageInput}
                                maxLength={4}
                                onChange={(e) => setPageInput(e.target.value)}
                                onKeyDown={(e) => {
                                    // Allow only digits, backspace, arrows, enter
                                    if (!((e.key >= "0" && e.key <= "9") || ["Backspace", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key))) {
                                        e.preventDefault(); 
                                    }

                                    // If the enter key is pressed, the input box is unhighlighted
                                    if (e.key === "Enter") {
                                        (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                onBlur={() => {
                                    const inputNum = Number(pageInput); 

                                    // If the input is blank or not a number than default the page to the beginning
                                    if (!pageInput || Number.isNaN(inputNum)) {
                                        setPage(1);
                                        setPageInput("1");
                                    } else {
                                        const newPageNum = Math.max(1, Math.min(totalPages, inputNum)); // Input can only fall between 1 and highest page
                                        setPage(newPageNum); // Update page number
                                        setPageInput(newPageNum.toString());
                                    }
                                }}
                                className="w-12 rounded-xl border px-2 py-1 text-center"
                            />

                            <span>of {totalPages}</span>
                        </div>

                        <button
                            className="btn btn-ghost"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </button>

                        <select
                            className="border border-primary bg-primary rounded-xl px-2 py-1 text-sm text-primary"
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
                    <div className="bg-primary rounded-2xl shadow-lg overflow-hidden w-full border border-gray-100">
                        <div className="overflow-x-auto w-full max-w-full h-120 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 border-x border-gray-200">
                                <thead className="bg-linear-to-r from-blue-50 to-cyan-50 dark:bg-gradient-to-r dark:from-slate-700 dark:to-slate-800 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            Question
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            <SortableHeader
                                                label="Difficulty"
                                                field="difficulty"
                                                sortBy={sortBy}
                                                sortOrder={sortOrder}
                                                onSort={handleSort}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            Topic
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            Subject
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            Course Number
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200 max-w-72">
                                            Choices
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200 max-w-72">
                                            Answer
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider border-r border-gray-200">
                                            <SortableHeader
                                                label="Last Used"
                                                field="lastUsed"
                                                sortBy={sortBy}
                                                sortOrder={sortOrder}
                                                onSort={handleSort}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && user ? (
                                        //Questions Loading
                                        <tr>
                                            <td colSpan={10} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="flex justify-center items-center space-x-2 py-4">
                                                    {/* Spinning circle loading animation */}
                                                    <svg
                                                        className="animate-spin h-12 w-12 text-secondary"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-50"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        />
                                                        <circle
                                                            className="opacity-75"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeDasharray="50"
                                                            strokeDashoffset="20"
                                                        />
                                                    </svg>
                                                    <span className="text-secondary text-lg">Loading...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        //Error while loading questions
                                        <tr>
                                            <td colSpan={10} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-secondary text-lg">Error Loading questions</div>
                                                <div className="text-red-400 text-sm mt-2">{error}</div>
                                                <button
                                                    onClick={fetchQuestionsWithFilters}
                                                    className="mt-4 px-4 py-2 bg-gray-800 text-secondary rounded-lg hover:bg-gray-900 transition-colors"
                                                >
                                                    Retry
                                                </button>
                                            </td>
                                        </tr>
                                    ) : !user ? (
                                        //Not logged in
                                        <tr>
                                            <td colSpan={10} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-secondary text-lg">Please log in to view your questions</div>
                                            </td>
                                        </tr>
                                    ) : filteredQuestions.length == 0 ? (
                                        //No questions
                                        <tr>
                                            <td colSpan={10} className="px-6 py-24 text-center border-r border-gray-200">
                                                <div className="text-secondary text-lg">No questions found</div>
                                                <div className="text-secondary text-sm mt-2">Add a question to get started</div>
                                            </td>
                                        </tr>
                                    ) : (
                                        //Questions data
                                        <>
                                            {filteredQuestions.map((question, index) => (
                                                <tr
                                                    key={question._id}
                                                    className={index % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}
                                                >
                                                    <td className="px-6 py-4 text-sm text-secondary max-w-xs border-r border-gray-200">
                                                        <div className="truncate" title={question.stem}>
                                                            {question.stem}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200">
                                                        {question.type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200">
                                                        {question.difficulty}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200">
                                                        {formatTopics(question.topics)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200">
                                                        {question.subject || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200">
                                                        {question.courseNum || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-secondary max-w-xs border-r border-gray-200">
                                                        <div className="truncate" title={formatChoices(question.choices)}>{formatChoices(question.choices)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200 max-w-72">
                                                        <div className="truncate" title={formatAnswers(question)}>{formatAnswers(question)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary border-r border-gray-200">
                                                        {question.lastUsed ? (() => {
                                                            const [year, month, day] = new Date(question.lastUsed).toISOString().split('T')[0].split('-');
                                                            return `${month}/${day}/${year}`;
                                                        })() : 'Never'}
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
                                            ))}

                                            {/* Filler rows to maintain alternating colors */}
                                            {Array.from({ length: Math.max(0, 8 - filteredQuestions.length) }).map((_, i) => (
                                                <tr
                                                    key={`filler-${i}`}
                                                    className={(filteredQuestions.length + i) % 2 === 0 ? 'bg-white dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'}
                                                >
                                                    <td colSpan={10} className="py-4">&nbsp;</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* Add Question Button and Import*/}
                    <div className="mt-12 flex justify-center">
                        <div>
                            <button className="px-12 py-5 btn btn-ghost text-xl flex items-center gap-2" onClick={() => setIsQuestionFormOpen(true)} disabled={!user}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Add New Question to Database
                            </button>
                        </div>
                        <div className="pl-6">
                            <button className="px-12 py-5 btn btn-ghost text-xl flex items-center gap-2" onClick={handleImportClick} disabled={!user}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                </svg>
                                Upload Questions from CSV
                            </button>
                        </div>
                    </div>
                </main>
                {isQuestionFormOpen && (
                    <QuestionForm isOpen={isQuestionFormOpen} onClose={handleFormClose} mode="questionBank" />
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
        </Background>

    );
}




