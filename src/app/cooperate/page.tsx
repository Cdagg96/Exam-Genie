"use client";

import { useState, useEffect, useRef } from "react";
import NavBar from "@/components/navbar";
import FilterBox from "@/components/filterBox";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import { Background } from "@/components/BackgroundModal";
import MemberCard from "@/components/MemberCard";
import ViewProfileModal from "@/components/ViewProfileModal"
import Link from "next/link";
import useTheme from "@/hooks/useTheme"

export default function CooperatePage() {
    const { user, updateUser } = useAuth();
    const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userError, setUserError] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    //Filtering states
    const [searchName, setSearchName] = useState<string>('');
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');

    //Filter dropdown options
    const [nameOptions, setNameOptions] = useState<{ label: string; value: string }[]>([]);
    const [institutionOptions, setInstitutionOptions] = useState<{ label: string; value: string }[]>([]);
    const [subjectOptions, setSubjectOptions] = useState<{ label: string; value: string }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);

    const [connectionsData, setConnectionsData] = useState<{
        connections: string[];
        outgoingRequests: string[];
        incomingRequests: string[];
    }>({ connections: [], outgoingRequests: [], incomingRequests: [] });

    //Fetch Users
    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);

            const params = new URLSearchParams();

            if (searchName) params.append("name", searchName);
            if (selectedInstitution) params.append("institution", selectedInstitution);
            if (selectedSubject) params.append("tSubject", selectedSubject);
            if (selectedDepartment) params.append("department", selectedDepartment);

            const response = await fetch(`/api/user?${params.toString()}`, {method: "GET"});

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(data.users ?? []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setUserError(err instanceof Error ? err.message : "Failed to fetch users");
        } finally {
            setLoadingUsers(false);
        }
    };

    //For filter dropdowns
    const fetchFilterOptions = async () => {
        try {
            const res = await fetch("/api/user/filter-options");
            const data = await res.json();

        setNameOptions(formatOptions(data.names ?? []));
        setInstitutionOptions(formatOptions(data.institutions ?? []));
        setSubjectOptions(formatOptions(data.subjects ?? []));
        setDepartmentOptions(formatOptions(data.departments ?? []));
        } catch (err) {
            console.error("Error fetching filter options", err);
        }
    };

    //Get all the connections of a user
    const fetchConnections = async () => {
        if (!user?._id) return;
        try {
            const res = await fetch(`/api/user/connections?userId=${user._id}`);
            if (!res.ok) throw new Error("Failed to fetch connections");

            const data = await res.json();
            setConnectionsData({
                connections: data.connections ?? [],
                outgoingRequests: data.outgoingRequests ?? [],
                incomingRequests: data.incomingRequests ?? []
            });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [user?._id]);

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

    //Apply filters
    const handleApplyFilters = () => {
        fetchUsers();
    }

    //Clear filters
    const handleClearFilters = async () => {
        setSearchName('');
        setSelectedInstitution('');
        setSelectedSubject('');
        setSelectedDepartment('');


        const response = await fetch(`/api/user`, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        setUsers(data.users ?? []);
    };

    const handleViewMember = (member: any) => {
        setSelectedMember(member);
        setViewModalOpen(true);
    };

    //Handle the connection between two users and resulting changes in their requests
    const handleConnect = async (targetUserId: string) => {
        if (!user?._id) return;
        const userIdStr = String(user._id);

        const isRequestSent = connectionsData.outgoingRequests.includes(targetUserId);

        try {
            const res = await fetch("/api/user/connections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userIdStr,
                    targetUserId,
                    action: "request"
                }),
            });

            const data = await res.json();
            if (data.ok) {
                toast.success(isRequestSent ? "Request cancelled" : "Request sent");
                await fetchConnections();
                await fetchUsers();
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        }
    };
    
    const formatOptions = (arr: string[]) =>
        arr
            .filter((item) => typeof item === "string" && item.trim() !== "")
            .map((item) => ({
                label: item,
                value: item,
    }));

    let content; //Variable to hold different formats for the page (Not logged in, cooperation not enabled, and finally the actual page functionality)

    if (loadingUsers) {
        content = (
            <div className="flex justify-center items-center space-x-2 py-4">
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
        );
    //Not logged in
    } else if (!user) {
        content = (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                <h3 className="font-semibold text-yellow-800 mb-2">Login Required</h3>
                <p className="text-yellow-700">Please log in to cooperate</p>
            </div>
        );
    //Logged in and cooperation enabled
    } else if (user && user.isCooperating === true) {
        content = (
            <>
                <div className="mb-6 text-center">
                    <Link
                        href="../connections/"
                        className="text-secondary hover:text-primary inline-flex items-center font-medium ml-6"
                    >
                        Go to Connections
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                            />
                        </svg>
                    </Link>
                </div>


                <div className="card-primary p-6 mb-8">
                    <h2 className="text-2xl text-primary mb-6">
                        Find Faculty
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <FilterBox
                            options={nameOptions}
                            label="Name"
                            placeholder="Search by name"
                            onSelect={setSearchName}
                            value={searchName}
                            maxLength={50}
                        />

                        <FilterBox
                            options={institutionOptions}
                            label="Institution"
                            placeholder="Search by institution"
                            onSelect={setSelectedInstitution}
                            value={selectedInstitution}
                            maxLength={50}
                        />

                        <FilterBox
                            options={subjectOptions}
                            label="Subject"
                            placeholder="Search by subject"
                            onSelect={setSelectedSubject}
                            value={selectedSubject}
                            maxLength={50}
                        />

                        <FilterBox
                            options={departmentOptions}
                            label="Department"
                            placeholder="Search by department"
                            onSelect={setSelectedDepartment}
                            value={selectedDepartment}
                            maxLength={50}
                        />

                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <button onClick={handleClearFilters} className="px-6 py-3 btn btn-ghost">
                            Clear Filters
                        </button>
                        <button onClick={handleApplyFilters} className="px-6 py-3 btn btn-primary-blue">
                            Apply Filters
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingUsers ? (
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
                            <span className="text-secondary text-lg">Loading faculty...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-secondary">No faculty found</p>
                    ) : (
                        users
                            .filter(u => u._id !== user?._id) //Do not display the user to themself
                            .filter(u => u.isCooperating === true) //Display users that are opted in to cooperating
                            .filter(u => !["Denied", "Pending"].includes(u.status)) //Do not display users that are denied or pending from admin approval process
                            .map((user) => (
                                <MemberCard
                                    key={user._id}
                                    user={user}
                                    name={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
                                    school={user.institution}
                                    subjects={Array.isArray(user.tSubject) ? user.tSubject : ["None"]}
                                    department={user.department ?? "None"}
                                    onView={() => handleViewMember(user)}
                                    onConnect={() => handleConnect(user._id)}
                                    connectionState={
                                        connectionsData.connections.includes(user._id)
                                            ? "connected"
                                            : connectionsData.outgoingRequests.includes(user._id)
                                                ? "request-sent"
                                                : connectionsData.incomingRequests.includes(user._id)
                                                    ? "request-received"
                                                    : "none"
                                    }
                                />
                            ))
                    )}
                </div>
            </>
        );
    //Logged in and cooperation disabled
    } else {
        content = (
            <div className="rounded-xl text-center mb-4 mx-auto w-full">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                    <p className="text-yellow-800">
                        Go to the settings page to learn about cooperation. You must agree to cooperation before continuing.
                    </p>

                    <button className="btn btn-primary-blue mt-4">
                        <Link href="../settings?tab=preferences" className="">
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

                <main className="pt-8">
                    <h1 className="text-4xl mb-4 text-blue-gradient">
                        Cooperate With Faculty
                    </h1>
                    <p className="text-secondary mb-8 text-lg max-w-2xl mx-auto text-center">
                        Connect with other instructors to share questions, collaborate on exams,
                        and build shared resources.
                    </p>

                    {content}
                </main>

                <ViewProfileModal
                    isOpen={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    member={selectedMember}
                />
            </div>
        </Background>
    );
}