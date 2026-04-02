"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";
import { useAuth } from "@/components/AuthContext";
import toast from "react-hot-toast";
import useTheme from "@/hooks/useTheme"
import InstructionEditor from "@/components/InstructionEditor";
import { signOut } from "next-auth/react";

interface UserData {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
    institution: string;
    department: string;
    tSubject: string[];
    createdOn: string;
    updatedOn?: string;
    instructionPrefs?: {
        examGeneration?: {
            editor: "tiptap";
            content: any; // TipTap JSON
            updatedAt?: string;
        };
    };
    isCooperating?: boolean;
}

export default function SettingsPage() {
    const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();

    //Form state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        institution: "",
        department: "",
        tSubject: [],
        newPassword: "",
        confirmPassword: "",
        isCooperating: false
    });

    //States
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState("profile"); //Profile info, Reset password, Delete account
    const [userData, setUserData] = useState<UserData | null>(null);
    const [tSubjectInput, setTSubjectInput] = useState("");

    //for saving users prefered instructions
    const [isSavingInstructions, setIsSavingInstructions] = useState(false);

    //makes sure that the email comes in valid format
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    //makes sure that the phone number comes in valid format
    // 3303278011
    // 330-327-8011
    // (330) 327-8011
    const isValidPhone = (phone: string) => {
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length === 10;
    };

    //makes sure that the name only contains letters and is not empty
    const isValidFirstName = (name: string) => {
        return /^[A-Za-z]+$/.test(name);
    };

    const isValidLastName = (name: string) => {
        return /^[A-Za-z]+$/.test(name);
    };

    //Load user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            try {
                const userId = (user as any)?._id || (user as any)?.id;

                if (!userId) {
                    console.error('User ID not found');
                    return;
                }

                const response = await fetch(`/api/user/profile?userId=${userId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUserData(data.user || data);
                const loadedSubjects = (data.user?.tSubject || data?.tSubject) || [];

                //Set form data from API response
                setFormData(prev => ({
                    ...prev,
                    firstName: (data.user?.firstName || data?.firstName) || "",
                    lastName: (data.user?.lastName || data?.lastName) || "",
                    phone: (data.user?.phone || data?.phone) || "",
                    email: (data.user?.email || data?.email) || "",
                    institution: (data.user?.institution || data?.institution) || "",
                    department: (data.user?.department || data?.department) || "",
                    tSubject: loadedSubjects,
                    isCooperating: (data.user?.isCooperating ?? data?.isCooperating) ?? false,
                }));
                setTSubjectInput(loadedSubjects.join(", "));
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error("Failed to load user data");
            }
        };

        fetchUserData();
    }, [user]);


    //handle saving instructions 
    const handleSaveInstructions = async (content: any) => {
        setIsSavingInstructions(true);
        try {
            const userId = (user as any)?._id || (user as any)?.id;

            const res = await fetch("/api/user/instructions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, content }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Failed");

            toast.success("Instructions saved");
        } catch (e) {
            toast.error("Failed to save instructions");
        } finally {
            setIsSavingInstructions(false);
        }
    };


    //Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    //Handle profile update
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        //Validate email, phone, and name formates
        if (!isValidEmail(formData.email)) {
            toast.error("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        if (!isValidFirstName(formData.firstName)) {
            toast.error("Please enter a valid first name (letters only)");
            setIsLoading(false);
            return;
        }

        if (!isValidLastName(formData.lastName)) {
            toast.error("Please enter a valid last name (letters only)");
            setIsLoading(false);
            return;
        }

        if (!isValidPhone(formData.phone)) {
            toast.error("Please enter a valid 10-digit phone number");
            setIsLoading(false);
            return;
        }

        try {
            // Rebuild the subjects array
            const parsedSubjects = tSubjectInput
                .split(",")
                .map(subject => subject.trim())
                .filter(Boolean);

            const response = await fetch("/api/user/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: (user as any)?._id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    institution: formData.institution,
                    department: formData.department,
                    tSubject: parsedSubjects,
                    isCooperating: formData.isCooperating
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Profile updated successfully");
                //Update auth context with new data
                updateUser({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    institution: formData.institution,
                    department: formData.department,
                    tSubject: parsedSubjects,
                });
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    //Handle password change
    const handlePasswordResetClick = async () => {
        try {
            //Send request to handle forgot password
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: (user as any)?.email }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(data.message, {
                    duration: 5500,
                });
            } else {
                toast.error(data.message || "Failed to send reset email");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error("An error occurred. Please try again.");
        }
    };

    //Handle account deletion
    const handleDeleteAccount = async () => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/user/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: (user as any)?._id
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Account deleted successfully");
                if (data.signOut) {
                    await signOut({ callbackUrl: '/' });
                }
            } else {
                toast.error("Failed to delete account");
                setShowDeleteConfirm(false);
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
            setShowDeleteConfirm(false);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    //Handle the cooperation preference
    const toggleCooperation = async () => {
        const newValue = !formData.isCooperating;

        setFormData(prev => ({
            ...prev,
            isCooperating: newValue
        }));

        try {
            const res = await fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: (user as any)?._id,
                    isCooperating: newValue
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            updateUser({ isCooperating: newValue });
            toast.success("Cooperation updated");

        } catch (err) {
            setFormData(prev => ({
                ...prev,
                isCooperating: !newValue
            }));

            toast.error("Failed to update");
        }
    };

    //If not logged in
    if (!user) {
        return (
            <Background>
                <div className="items-center justify-items-center min-h-screen p-4">
                    <NavBar />
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full mt-10">
                        <h3 className="font-semibold text-yellow-800 mb-2">
                            Login Required
                        </h3>
                        <p className="text-yellow-700">
                            Please log in to access settings
                        </p>
                    </div>
                </div>
            </Background>
        );
    }

    return (
        <Background>
            <div className="items-center justify-items-center min-h-screen p-4">
                <NavBar />

                <div className="mt-10 w-full max-w-4xl">
                    <h1 className="text-5xl text-blue-gradient py-3">
                        Settings
                    </h1>
                    <p className="mt-3 text-center text-secondary">
                        Manage your account settings and preferences
                    </p>

                    <div className="mt-10 card-primary shadow-lg overflow-hidden">
                        <div className="flex bg-secondary border border-slate-200 dark:border-black">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors
                                    ${activeTab === "profile" ? "bg-sky-300 dark:bg-[#111827] text-primary" : "text-secondary hover:bg-secondary"}`}
                            >
                                Profile Information
                            </button>
                            <button
                                onClick={() => setActiveTab("preferences")}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition
                                    ${activeTab === "preferences" ? "bg-sky-300 dark:bg-[#111827] text-primary" : "text-secondary hover:bg-secondary"}`}
                            >
                                Preferences
                            </button>
                            <button
                                onClick={() => setActiveTab("password")}
                                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors
                                    ${activeTab === "password" ? "bg-sky-300 dark:bg-[#111827] text-primary" : "text-secondary hover:bg-secondary"}`}
                            >
                                Reset Password
                            </button>
                            <button
                                onClick={() => setActiveTab("delete")}
                                className={`flex-1 py-4 px-6 text-sm font-medium transition-colors
                                    ${activeTab === "delete" ? "bg-sky-300 dark:bg-[#111827] text-primary" : "text-secondary hover:bg-secondary"}`}
                            >
                                Delete Account
                            </button>
                        </div>

                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            Teaching Subject(s) - Comma Seperated
                                        </label>
                                        <input
                                            type="text"
                                            name="tSubject"
                                            value={tSubjectInput}
                                            onChange={(e) => setTSubjectInput(e.target.value)}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            maxLength={200}
                                            required
                                        />
                                    </div>

                                </div>

                                <div>
                                        <label className="block text-sm text-secondary mb-2">
                                            Institution
                                        </label>
                                        <input
                                            type="text"
                                            name="institution"
                                            value={formData.institution}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border-primary bg-primary text-primary"
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2 btn btn-primary-blue"
                                    >
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="p-6 space-y-6">
                                {/* Instruction editor*/}
                                <InstructionEditor
                                    initialContent={userData?.instructionPrefs?.examGeneration?.content}
                                    onSave={handleSaveInstructions}
                                    isSaving={isSavingInstructions}
                                    showSaveButton={true}
                                />
                                <div className="border-t pt-4">
                                    {/* Dark mode toggle button */}
                                    <div className="text-lg font-medium text-primary mb-3">
                                        Page Theme
                                        <p className="text-sm text-secondary mb-4">
                                            Choose a page theme. If saved, this theme will always be applied. Otherwise, your browser's theme preference will be used.
                                        </p>
                                    </div>
                                    <button onClick={toggleTheme} className="btn btn-ghost rounded-full text-primary card-secondary shadow-lg" >
                                        {isDark ? "Enable light mode" : "Enable dark mode"}
                                    </button>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="text-lg font-medium text-primary mb-3">
                                        Cooperation
                                        <p className="text-sm text-secondary mb-4">
                                            By enabling cooperation, your account becomes visible to other users, giving you full access to the cooperation page. 
                                            Here, you can easily share questions, collaborate on exams, and benefit from a more interactive experience. 
                                            You can disable this feature anytime to return to a private profile.
                                        </p>
                                    </div>
                                    <button onClick={toggleCooperation} className="btn btn-ghost rounded-full text-primary card-secondary shadow-lg">
                                        {formData.isCooperating ? "Disable cooperation" : "Enable cooperation"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Password Tab */}
                        {activeTab === "password" && (
                            <div className="p-6 space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-blue-800 mb-2">Reset Your Password</h3>
                                            <p className="text-sm text-blue-700 mb-4">
                                                Click the button below to receive a password reset link via email.
                                                The link will expire in 1 hour.
                                            </p>
                                            <button
                                                onClick={handlePasswordResetClick}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl shadow transition"
                                            >
                                                Send Reset Link
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Tab */}
                        {activeTab === "delete" && (
                            <div className="p-6 space-y-6">
                                <div className="border border-red-200 rounded-xl p-6 bg-red-50">
                                    <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
                                    <p className="text-sm text-red-700 mb-4">
                                        Once you delete your account, all of your data will be permanently removed.
                                    </p>

                                    {!showDeleteConfirm ? (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl shadow transition"
                                        >
                                            Delete Account
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm font-medium text-red-800">
                                                Are you sure? This action cannot be undone.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={isLoading}
                                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl shadow transition disabled:opacity-50"
                                                >
                                                    {isLoading ? "Deleting..." : "Yes, Delete My Account"}
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-stone-800 text-sm rounded-xl shadow transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Link */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/profile"
                            className="text-sm text-secondary hover:text-blue-600 transition"
                        >
                            &larr; Back to Profile
                        </Link>
                    </div>
                </div>
            </div>
        </Background>
    );
}