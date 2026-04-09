"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";
import MemberCard from "@/components/MemberCard";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import useTheme from "@/hooks/useTheme"
import QuestionModal from "@/components/QuestionModal";

export default function CollaborateViewPage() {
    const { user, updateUser } = useAuth();
    const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
    const [viewMode, setViewMode] = useState<"connections" | "questions">("connections");
    const [selectedConnection, setSelectedConnection] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [showRequests, setShowRequests] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [connectionQuestions, setConnectionQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [selectedConnectionName, setSelectedConnectionName] = useState("");
    const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUserQuestions = async (userId: string) => {
        try {
            setLoadingQuestions(true);
            const res = await fetch(`/api/questions?userId=${userId}`);
            if (!res.ok) throw new Error("Failed to fetch questions");
            const data = await res.json();

            const questions = Array.isArray(data) ? data : data.items || [];
            setConnectionQuestions(questions);
        } catch (err) {
            console.error("Error fetching user questions:", err);
            setConnectionQuestions([]);
        } finally {
            setLoadingQuestions(false);
        }
    };

    // Fetch the current user's connections
    const fetchConnections = async () => {
        if (!user?._id) return;
        try {
            setLoadingConnections(true);
            const res = await fetch(`/api/user/connections?userId=${user._id}`);
            if (!res.ok) throw new Error("Failed to fetch connections");
            const data = await res.json();

            if (data.connections?.length) {
                const usersRes = await fetch(`/api/user?ids=${data.connections.join(",")}`);
                if (!usersRes.ok) throw new Error("Failed to fetch user details");
                const usersData = await usersRes.json();

                //Filter users by those that are cooperating
                const cooperatingUsers = (usersData.users || []).filter((u: any) => u.isCooperating === true);
                setConnections(cooperatingUsers);
            } else {
                setConnections([]);
            }

            // Map incoming requests to displayable objects
            if (data.incomingRequests?.length) {
                const requestsRes = await fetch(`/api/user?ids=${data.incomingRequests.join(",")}`);
                if (!requestsRes.ok) throw new Error("Failed to fetch incoming request details");
                const requestsData = await requestsRes.json();
                setIncomingRequests((requestsData.users || []).filter((u: any) => u.isCooperating === true));
            } else {
                setIncomingRequests([]);
            }
            //Fetch outgoing requests
            if (data.outgoingRequests?.length) {
                const outgoingRes = await fetch(`/api/user?ids=${data.outgoingRequests.join(",")}`);
                if (!outgoingRes.ok) throw new Error("Failed to fetch outgoing request details");
                const outgoingData = await outgoingRes.json();
                setOutgoingRequests((outgoingData.users || []).filter((u: any) => u.isCooperating === true));
            } else {
                setOutgoingRequests([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingConnections(false);
        }
    };

    useEffect(() => {
        if (user?._id && user?.isCooperating === true) {
            fetchConnections();
        }
    }, [user?._id, user?.isCooperating]);

    const handleViewConnection = (connection: any) => {
        setSelectedConnection(connection);
        setSelectedConnectionName(`${connection.firstName ?? ""} ${connection.lastName ?? ""}`.trim());
        setViewMode("questions");
        setSearchTerm("");
        setSubjectFilter("");
        setShowRequests(false);
        fetchUserQuestions(connection._id);
    };

    const handleBackToConnections = () => {
        setViewMode("connections");
        setSelectedConnection(null);
        setConnectionQuestions([]);
        setSelectedConnectionName("");
    };

    //Accept a friend request and update all the respective user fields
    const handleAcceptRequest = async (targetUserId: string) => {
        if (!user?._id) return;
        try {
            const res = await fetch("/api/user/connections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: String(user._id),
                    targetUserId,
                    action: "accept"
                })
            });
            if (!res.ok) throw new Error("Failed to accept request");
            fetchConnections();
        } catch (err) {
            console.error(err);
        }
    };

    //Reject a friend request and update all the respective user fields
    const handleRejectRequest = async (targetUserId: string) => {
        if (!user?._id) return;
        try {
            const res = await fetch("/api/user/connections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: String(user._id),
                    targetUserId,
                    action: "reject"
                })
            });
            if (!res.ok) throw new Error("Failed to reject request");
            fetchConnections();
        } catch (err) {
            console.error(err);
        }
    };

    //Cancel an outgoing request
    const handleCancelRequest = async (targetUserId: string) => {
        if (!user?._id) return;
        try {
            const res = await fetch("/api/user/connections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: String(user._id),
                    targetUserId,
                    action: "request"
                })
            });
            if (!res.ok) throw new Error("Failed to cancel request");
            fetchConnections();
        } catch (err) {
            console.error(err);
        }
    };

    //Update the user so that the cooperating field can be used to deny people from viewing this page if not set correctly
    useEffect(() => {
        if (!user?._id) return;

        const fetchCoopStatus = async () => {
            try {
                const res = await fetch(`/api/user?ids=${user._id}`);
                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                const currentUser = data.users[0];
                if (currentUser) {
                    updateUser({ isCooperating: currentUser.isCooperating });
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchCoopStatus();
    }, [user?._id]);

    const filteredConnections = connections.filter(conn =>
        `${conn.firstName ?? ""} ${conn.lastName ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conn.institution || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredIncoming = incomingRequests.filter(req =>
        `${req.firstName ?? ""} ${req.lastName ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.institution || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOutgoing = outgoingRequests.filter(req =>
        `${req.firstName ?? ""} ${req.lastName ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.institution || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    let content;

    if (!user) {
        content = (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                <h3 className="font-semibold text-yellow-800 mb-2">Login Required</h3>
                <p className="text-yellow-700">Please log in to view your connections</p>
            </div>
        );
    } else if (user && user.isCooperating === true) {
        if (viewMode === "questions" && selectedConnection) {
            content = (
                <>
                    {/* Back button */}
                    <div className="mb-6 text-center">
                        <button
                            onClick={handleBackToConnections}
                            className="text-secondary hover:text-primary inline-flex items-center font-medium"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 mr-2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                                />
                            </svg>
                            Back to Connections
                        </button>
                    </div>

                    {/* Questions section */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-primary mb-4">
                            {selectedConnectionName}'s Questions ({connectionQuestions.length})
                        </h2>

                        {loadingQuestions ? (
                            <div className="text-center py-8">
                                <p className="text-secondary">Loading questions...</p>
                            </div>
                        ) : connectionQuestions.length > 0 ? (
                            <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {connectionQuestions.map((question: any) => (
                                    <div
                                        key={question._id}
                                        className="card-primary p-6 hover:shadow-lg transition-all group"
                                    >
                                        {/* Question type */}
                                        <div className="mb-4">
                                            <span className="inline-block text-xl text-primary font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                {question.type || "Unknown"}
                                            </span>
                                        </div>

                                        {/* Question Text */}
                                        <div className="mb-4">
                                            <p className="text-primary text-lg leading-relaxed">
                                                {question.stem}
                                            </p>
                                        </div>

                                        {/* Details of question */}
                                        <div className="space-y-2 text-sm">
                                            <p className="text-secondary">
                                                <span className="font-semibold text-primary">Subject:</span> {question.subject || "N/A"}
                                            </p>
                                            <p className="text-secondary">
                                                <span className="font-semibold text-primary">Topic:</span> {question.topics && question.topics.length > 0 ? question.topics.join(", ") : "N/A"}
                                            </p>
                                            <p className="text-secondary">
                                                <span className="font-semibold text-primary">Difficulty:</span> {question.difficulty || "N/A"}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                            <button
                                                className="btn btn-primary-blue text-sm"
                                                onClick={() => {
                                                    setSelectedQuestion(question);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => {}}
                                                className="px-4 py-2 btn btn-ghost rounded-lg transition text-sm"
                                            >
                                                Import
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <p className="text-secondary">No questions found from this connection.</p>
                                <p className="text-sm text-secondary mt-2">
                                    When {selectedConnectionName} adds questions, they will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            );
        } else {
            content = (
                <>
                    <div className="mb-6 text-center">
                        <Link
                            href="../cooperate/"
                            className="text-secondary hover:text-primary inline-flex items-center font-medium"
                        >
                            Go to Cooperate
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 ml-2 rotate-180 transition-transform duration-200 group-hover:-translate-x-1"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </Link>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={() => {
                                setViewMode("connections");
                                setSelectedConnection(null);
                                setSearchTerm("");
                                setShowRequests(false);
                            }}
                            className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 btn btn-ghost"
                        >
                            My Connections ({connections.length})
                        </button>

                        <button
                            onClick={() => setShowRequests(true)}
                            className="relative px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 btn btn-primary-blue"
                        >
                            Friend Requests
                            {(incomingRequests.length + outgoingRequests.length) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    {incomingRequests.length + outgoingRequests.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search Bar */}
                    {(viewMode === "connections" || showRequests) && (
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder={showRequests ? "Search requests" : "Search connections"}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                            />
                        </div>
                    )}

                    {/* Friend request view */}
                    {showRequests ? (
                        <div className="space-y-8">
                            {/* Incoming Requests */}
                            <div>
                                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                                    Incoming Requests
                                    <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        {incomingRequests.length}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredIncoming.length > 0 ? filteredIncoming.map(req => {
                                        const initials = `${req.firstName ?? ""} ${req.lastName ?? ""}`
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase();

                                        return (
                                            <div key={req._id} className="card-primary p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                                                {/* Displays  information of user */}
                                                <div className="flex items-center gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                                                        {initials}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold text-primary">
                                                            {req.firstName} {req.lastName}
                                                        </h3>
                                                        <p className="text-sm text-secondary">
                                                            {req.institution}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 text-sm text-secondary">
                                                    <p>
                                                        <span className="font-medium">Subjects:</span>{" "}
                                                        {Array.isArray(req.tSubject) ? req.tSubject.join(", ") : "None"}
                                                    </p>

                                                    {req.department && (
                                                        <p>
                                                            <span className="font-medium">Department:</span>{" "}
                                                            {req.department}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        className="btn btn-primary-blue w-full"
                                                        onClick={() => handleAcceptRequest(req._id)}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost w-full"
                                                        onClick={() => handleRejectRequest(req._id)}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-secondary col-span-full">
                                            {searchTerm ? "No matching incoming requests" : "No incoming requests"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Outgoing Requests */}
                            <div>
                                <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
                                    Outgoing Requests
                                    <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        {outgoingRequests.length}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredOutgoing.length > 0 ? filteredOutgoing.map(req => {
                                        const initials = `${req.firstName ?? ""} ${req.lastName ?? ""}`
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase();

                                        return (
                                            <div key={req._id} className="card-primary p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                                                {/* Displays information of user */}
                                                <div className="flex items-center gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                                                        {initials}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-semibold text-primary">
                                                            {req.firstName} {req.lastName}
                                                        </h3>
                                                        <p className="text-sm text-secondary">
                                                            {req.institution}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 text-sm text-secondary">
                                                    <p>
                                                        <span className="font-medium">Subjects:</span>{" "}
                                                        {Array.isArray(req.tSubject) ? req.tSubject.join(", ") : "None"}
                                                    </p>

                                                    {req.department && (
                                                        <p>
                                                            <span className="font-medium">Department:</span>{" "}
                                                            {req.department}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        className="btn btn-ghost w-full"
                                                        onClick={() => handleCancelRequest(req._id)}
                                                    >
                                                        Cancel Request
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2 text-center">
                                                    Waiting for response
                                                </p>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-secondary col-span-full">
                                            {searchTerm ? "No matching outgoing requests" : "No outgoing requests"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        //Connections view
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loadingConnections ? <p className="text-secondary">Loading...</p> :
                                filteredConnections.length > 0 ? filteredConnections.map(conn => (
                                    <MemberCard
                                        key={conn._id}
                                        name={`${conn.firstName ?? ""} ${conn.lastName ?? ""}`.trim()}
                                        school={conn.institution}
                                        subjects={Array.isArray(conn.tSubject) ? conn.tSubject : ["None"]}
                                        department={conn.department ?? "None"}
                                        page="connections"
                                        onView={() => handleViewConnection(conn)}
                                    />
                                )) : <p className="text-secondary">No cooperating faculty found</p>
                            }
                        </div>
                    )}
                </>
            );
        }
    } else if (user && user.isCooperating === false) {
        content = (
            <div className="rounded-xl text-center mb-4 mx-auto w-full">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                    <p className="text-yellow-800">
                        Go to the settings page to enable cooperation. You must agree to cooperation before viewing connections.
                    </p>
                    <button className="btn btn-primary-blue mt-4">
                        <Link href="../settings?tab=preferences">
                            Go to settings
                        </Link>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Background>
            <div className="flex flex-col min-h-screen p-4">
                <NavBar />

                <main className="pt-8 mx-auto w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl mb-4 text-blue-gradient">
                            Connections Hub
                        </h1>
                        <p className="text-secondary text-lg max-w-2xl mx-auto">
                            View and import shared questions with your connected faculty members.
                        </p>
                    </div>
                    {content}
                </main>
            </div>
            {/* Add the modal here */}
            <QuestionModal
                question={selectedQuestion}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedQuestion(null);
                }}
            />
        </Background>
    );
}