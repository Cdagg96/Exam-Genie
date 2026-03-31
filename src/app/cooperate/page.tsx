"use client";

import { useState, useEffect, useRef } from "react";
import NavBar from "@/components/navbar";
import FilterBox from "@/components/filterBox";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import { Background } from "@/components/BackgroundModal";
import MemberCard from "@/components/MemberCard";
import ViewProfileModal from "@/components/ViewProfileModal"

export default function CooperatePage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userError, setUserError] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    // Filtering states
    const [searchName, setSearchName] = useState<string>('');
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');

    // Filter dropdown options
    const [nameOptions, setNameOptions] = useState<{ label: string; value: string }[]>([]);
    const [institutionOptions, setInstitutionOptions] = useState<{ label: string; value: string }[]>([]);
    const [subjectOptions, setSubjectOptions] = useState<{ label: string; value: string }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);

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

        // For filter dropdowns
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

    useEffect(() => {
        fetchUsers();
        fetchFilterOptions();
    }, []);

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
    
    const formatOptions = (arr: string[]) =>
        arr
            .filter((item) => typeof item === "string" && item.trim() !== "")
            .map((item) => ({
                label: item,
                value: item,
    }));

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

                    {/* Filters */}
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
                        {/* Filter Actions */}
                        <div className="flex justify-end space-x-4 mt-8">
                            <button onClick={handleClearFilters} className="px-6 py-3 btn btn-ghost">
                                Clear Filters
                            </button>
                            <button onClick={handleApplyFilters} className="px-6 py-3 btn btn-primary-blue">
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Member Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingUsers ? (
                            <p className="text-secondary">Loading faculty...</p>
                        ) : users.length === 0 ? (
                            <p className="text-secondary">No faculty found</p>
                        ) : (
                            users.map((user) => (
                                <MemberCard
                                    key={user._id}
                                    name={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
                                    school={user.institution}
                                    subjects={Array.isArray(user.tSubject) ? user.tSubject : ["None"]}
                                    department={user.department ?? "None"}
                                    onView={() => handleViewMember(user)}
                                />
                            ))
                        )}
                    </div>
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