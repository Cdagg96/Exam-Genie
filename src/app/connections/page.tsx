"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";
import MemberCard from "@/components/MemberCard";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import useTheme from "@/hooks/useTheme"

export default function CollaborateViewPage() {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
    const [viewMode, setViewMode] = useState<"connections" | "questions">("connections");
    const [selectedConnection, setSelectedConnection] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [showRequests, setShowRequests] = useState(false);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);

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
                if (!requestsRes.ok) throw new Error("Failed to fetch request details");
                const requestsData = await requestsRes.json();
                setFriendRequests((requestsData.users || []).filter((u: any) => u.isCooperating === true));
            } else {
                setFriendRequests([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingConnections(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [user?._id]);

    const handleViewConnection = (connection: any) => {
        setSelectedConnection(connection);
        setViewMode("questions");
        setSearchTerm("");
        setSubjectFilter("");
        setShowRequests(false);
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

    const filteredConnections = connections.filter(conn =>
        `${conn.firstName ?? ""} ${conn.lastName ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conn.institution || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            {friendRequests.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    {friendRequests.length}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {friendRequests.length > 0 ? friendRequests.map(req => (
                                <div key={req._id} className="card-primary p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                                    <h3 className="text-lg font-semibold text-primary">
                                        {req.firstName} {req.lastName}
                                    </h3>
                                    <p className="text-secondary">{req.institution}</p>
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
                            )) : <p className="text-secondary">No friend requests</p>}
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
                                    />
                                )) : <p className="text-secondary">No cooperating faculty found</p>
                            }
                        </div>
                    )}
                </main>
            </div>
        </Background>
    );
}