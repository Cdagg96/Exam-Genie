"use client";

import { useState } from "react";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";
import MemberCard from "@/components/MemberCard";

//Mock data
const mockConnections = [
    {
        id: "1",
        name: "Connor Daggett SR",
        institution: "Stanford University",
        department: "Computer Science",
        subjects: ["Web Development", "Database Design", "Algorithms"],
        connectedSince: "2024-01-15"
    },
    {
        id: "2",
        name: "Connor Daggett JR",
        institution: "MIT",
        department: "Mathematics",
        subjects: ["Calculus", "Linear Algebra", "Statistics"],
        connectedSince: "2024-02-01"
    },
    {
        id: "3",
        name: "Connor Daggett III",
        institution: "UC Berkeley",
        department: "Physics",
        subjects: ["Quantum Mechanics", "Thermodynamics", "Electromagnetism"],
        connectedSince: "2024-01-20"
    },
    {
        id: "4",
        name: "Connor Daggett IV",
        institution: "Harvard University",
        department: "History",
        subjects: ["World History", "American History", "Political Science"],
        connectedSince: "2024-02-10"
    },
    {
        id: "5",
        name: "Connor Daggett V",
        institution: "Princeton University",
        department: "Chemistry",
        subjects: ["Organic Chemistry", "Inorganic Chemistry", "Biochemistry"],
        connectedSince: "2024-01-25"
    }
];

const mockPendingRequests = [
    {
        id: "p1",
        name: "Connor Daggett VI",
        institution: "Columbia University",
        department: "Economics",
        subjects: ["Microeconomics", "Macroeconomics", "Econometrics"],
        status: "received",
        requestedAt: "2024-02-14"
    },
    {
        id: "p2",
        name: "Connor Daggett VII",
        institution: "University of Chicago",
        department: "Psychology",
        subjects: ["Cognitive Psychology", "Developmental Psychology", "Neuroscience"],
        status: "received",
        requestedAt: "2024-02-13"
    },
    {
        id: "p3",
        name: "Connor Daggett VIII",
        institution: "Northwestern University",
        department: "Engineering",
        subjects: ["Mechanical Engineering", "Thermodynamics", "Fluid Mechanics"],
        status: "sent",
        requestedAt: "2024-02-10"
    }
];

const mockQuestions = {
    "1": [
        {
            id: "q1",
            text: "Explain the difference between REST and GraphQL APIs with practical examples.",
            subject: "Web Development",
            topic: "API Design",
            difficulty: "medium",
            createdAt: "2024-02-15"
        },
        {
            id: "q2",
            text: "Design a database schema for an e-commerce platform with product categories, user reviews, and order tracking.",
            subject: "Database Design",
            topic: "Schema Design",
            difficulty: "hard",
            createdAt: "2024-02-10"
        }
    ],
    "2": [
        {
            id: "q3",
            text: "Prove the Fundamental Theorem of Calculus and explain its applications.",
            subject: "Calculus",
            topic: "Integration",
            difficulty: "hard",
            createdAt: "2024-02-12"
        },
        {
            id: "q4",
            text: "Solve the system of linear equations using matrix methods: 2x + 3y = 8, 4x - y = 6",
            subject: "Linear Algebra",
            topic: "Matrices",
            difficulty: "easy",
            createdAt: "2024-02-08"
        }
    ],
    "3": [
        {
            id: "q5",
            text: "Derive the Schrödinger equation and explain its significance in quantum mechanics.",
            subject: "Quantum Mechanics",
            topic: "Wave Functions",
            difficulty: "hard",
            createdAt: "2024-02-14"
        }
    ],
    "4": [
        {
            id: "q6",
            text: "Analyze the causes and consequences of the American Civil War.",
            subject: "American History",
            topic: "Civil War Era",
            difficulty: "medium",
            createdAt: "2024-02-09"
        },
        {
            id: "q7",
            text: "Compare and contrast democracy in ancient Athens with modern representative democracy.",
            subject: "Political Science",
            topic: "Political Systems",
            difficulty: "medium",
            createdAt: "2024-02-05"
        }
    ],
    "5": [
        {
            id: "q8",
            text: "Explain the mechanism of nucleophilic substitution reactions (SN1 and SN2).",
            subject: "Organic Chemistry",
            topic: "Reaction Mechanisms",
            difficulty: "hard",
            createdAt: "2024-02-11"
        },
        {
            id: "q9",
            text: "Calculate the pH of a 0.1M solution of acetic acid (Ka = 1.8 × 10⁻⁵).",
            subject: "Biochemistry",
            topic: "Acids and Bases",
            difficulty: "medium",
            createdAt: "2024-02-07"
        }
    ]
};

export default function CollaborateViewPage() {
    const [viewMode, setViewMode] = useState<"connections" | "questions" | "requests">("connections");
    const [selectedConnection, setSelectedConnection] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [showRequests, setShowRequests] = useState(false);

    //Filter connections based on search
    const filteredConnections = mockConnections.filter(conn =>
        conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.institution.toLowerCase().includes(searchTerm.toLowerCase())
    );

    //Filter questions
    const filteredQuestions = selectedConnection
        ? (mockQuestions[selectedConnection.id as keyof typeof mockQuestions] || []).filter((q: any) =>
            (subjectFilter === "" || q.subject === subjectFilter) &&
            (searchTerm === "" || q.text.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : [];

    //Filter pending requests
    const filteredRequests = mockPendingRequests.filter(req =>
        req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.institution.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const receivedRequests = mockPendingRequests.filter(req => req.status === "received");

    const handleViewConnection = (connection: any) => {
        setSelectedConnection(connection);
        setViewMode("questions");
        setSearchTerm("");
        setSubjectFilter("");
        setShowRequests(false);
    };

    return (
        <Background>
            <div className="flex flex-col min-h-screen p-4">
                <NavBar />

                <main className="pt-8 max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl mb-4 text-blue-gradient">
                            Connections Hub
                        </h1>
                        <p className="text-secondary text-lg max-w-2xl mx-auto">
                            View and import shared questions with your connected faculty members.
                        </p>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="flex justify-between items-center mb-8">
                        {/* View Toggle Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setViewMode("connections");
                                    setSelectedConnection(null);
                                    setSearchTerm("");
                                    setShowRequests(false);
                                }}
                                className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 btn btn-ghost"
                            >
                                My Connections ({mockConnections.length})
                            </button>
                        </div>

                        {/* Friend Requests Button */}
                        <button
                            onClick={() => {
                                setShowRequests(true);
                                setViewMode("connections");
                                setSelectedConnection(null);
                                setSearchTerm("");
                            }}
                            className="relative px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 btn btn-primary-blue"
                        >
                            Friend Requests
                            {mockPendingRequests.filter(r => r.status === "received").length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    {mockPendingRequests.filter(r => r.status === "received").length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search Bar for Connections and Requests */}
                    {(viewMode === "connections" || showRequests) && (
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder={showRequests ? "Search requests by name or institution" : "Search connections by name or institution"}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-primary text-secondary px-4 py-3 w-full rounded-xl"
                            />
                        </div>
                    )}

                    {/* Friend Requests Section */}
                    {showRequests && (
                        <div className="mb-8">
                            <div className="space-y-6">
                                {/* Received Requests */}
                                {receivedRequests.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                            Received Requests ({receivedRequests.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredRequests.filter(r => r.status === "received").map((request) => (
                                                <div key={request.id} className="card-primary p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                                                            {request.name
                                                                .split(" ")
                                                                .map((n: string) => n[0])
                                                                .join("")
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-semibold text-primary">
                                                                {request.name}
                                                            </h3>
                                                            <p className="text-sm text-secondary">
                                                                {request.institution}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 text-sm text-secondary">
                                                        <p>
                                                            <span className="font-medium">Subjects:</span>{" "}
                                                            {request.subjects.join(", ")}
                                                        </p>
                                                        {request.department && (
                                                            <p>
                                                                <span className="font-medium">Department:</span>{" "}
                                                                {request.department}
                                                            </p>
                                                        )}
                                                        <p className="text-gray-500 text-xs mt-2">
                                                            Requested {new Date(request.requestedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            className="btn btn-primary-blue w-full"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost w-full"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {filteredRequests.length === 0 && (
                                    <div className="card-primary p-12 text-center">
                                        <h3 className="text-xl font-semibold text-primary mb-2">No friend requests found</h3>
                                        <p className="text-secondary">
                                            {searchTerm ? "Try a different search term" : "You have no pending friend requests"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!showRequests && viewMode === "connections" && (
                        <div className="space-y-6">
                            {/* Connections Grid */}
                            {filteredConnections.length === 0 ? (
                                <div className="card-primary p-12 text-center">
                                    <div className="text-6xl mb-4">👥</div>
                                    <h3 className="text-xl font-semibold text-primary mb-2">No connections found</h3>
                                    <p className="text-secondary">
                                        {searchTerm ? "Try a different search term" : "Connect with other faculty members to start collaborating"}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredConnections.map((connection) => (
                                        <MemberCard
                                            key={connection.id}
                                            name={connection.name}
                                            school={connection.institution}
                                            subjects={connection.subjects}
                                            page="connections"
                                            department={connection.department}
                                            onView={() => handleViewConnection(connection)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!showRequests && viewMode === "questions" && selectedConnection && (
                        <div className="space-y-6">
                            {/* Selected Connection Header */}
                            <div className="card-primary p-6">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-lg">
                                            {selectedConnection.name
                                                .split(" ")
                                                .map((n: string) => n[0])
                                                .join("")
                                                .toUpperCase()}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-primary">
                                                {selectedConnection.name}
                                            </h3>
                                            <p className="text-sm text-secondary">
                                                {selectedConnection.institution}
                                            </p>
                                            <div className="mt-2 text-sm text-secondary">
                                                <p>
                                                    <span className="font-medium">Subjects:</span>{" "}
                                                    {selectedConnection.subjects.join(", ")}
                                                </p>
                                                {selectedConnection.department && (
                                                    <p>
                                                        <span className="font-medium">Department:</span>{" "}
                                                        {selectedConnection.department}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-xs mt-2">
                                                Connected since {new Date(selectedConnection.connectedSince).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setViewMode("connections");
                                            setSelectedConnection(null);
                                        }}
                                        className="px-4 py-2 btn btn-ghost rounded-lg transition-colors"
                                    >
                                        Back to Connections
                                    </button>
                                </div>
                            </div>

                            {/* Questions Count */}
                            <div className="flex justify-between items-center">
                                <p className="text-secondary text-sm">
                                    Showing {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            {/* Questions Grid */}
                            {filteredQuestions.length === 0 ? (
                                <div className="card-primary p-12 text-center">
                                    <h3 className="text-xl font-semibold text-primary mb-2">No questions found</h3>
                                    <p className="text-secondary">
                                        {searchTerm || subjectFilter
                                            ? "Try adjusting your search or filter criteria"
                                            : "No questions have been shared by this faculty member yet"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredQuestions.map((question: any) => (
                                        <div
                                            key={question.id}
                                            className="card-primary p-6 hover:shadow-lg transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="text-primary text-lg leading-relaxed">
                                                        {question.text}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        <span className="px-2 py-1 text-xs font-medium text-secondary">
                                                            {question.subject}
                                                        </span>
                                                        {question.topic && (
                                                            <span className="px-2 py-1 text-xs font-medium text-secondary">
                                                                {question.topic}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 rounded-md text-xs font-medium text-secondary">
                                                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center text-xs">
                                                <button
                                                    className="btn btn-primary-blue text-sm"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </Background>
    );
}
