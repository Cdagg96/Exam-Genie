"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPasswordModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    //Use states
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    //If its not open, don't render anything
    if (!isOpen) return null;

    //Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        //Email validation
        if (!email) {
            toast.error("Please enter your email address.");
            return;
        }

        //Possible email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        //Set loading state
        setIsLoading(true);

        try {
            //Send request to handle forgot password
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            //Handle response
            if (data.success) {
                setEmailSent(true);
                toast.success(data.message);
                //Auto close
                setTimeout(() => {
                    onClose();
                    setEmailSent(false);
                    setEmail("");
                }, 5000);
            } else {
                toast.error(data.message || "Failed to send reset email.");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    //Runs when modal is closed
    const handleClose = () => {
        setEmail("");
        setEmailSent(false);
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white text-black rounded-2xl shadow-2xl w-[30rem] max-w-[90vw] h-auto p-8 relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-500 text-2xl"
                    disabled={isLoading}
                >
                    &times;
                </button>

                <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-semibold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                        Reset Password
                    </h2>

                    {/* Email Sent Confirmation */}
                    {emailSent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                                {/* Checkmark Icon */}
                                <svg
                                    className="w-8 h-8 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <p className="text-lg font-medium">
                                Reset email sent
                            </p>
                            <p className="text-gray-600">
                                Check your inbox for password reset instructions.
                                The link will expire in 1 hour.
                            </p>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        //Forgot Password Form
                        <>
                            <p className="text-gray-600 mb-6 text-center">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="w-full space-y-4">
                                {/* Email Input */}
                                <div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 rounded-xl text-lg font-medium transition ${isLoading ? "bg-gray-400 cursor-not-allowed" : "btn btn-primary-dark-blue hover:opacity-90"}`}
                                >
                                    {/* Loading state */}
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg
                                                className="animate-spin h-5 w-5 mr-2 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </button>
                            </form>

                            {/* Link to go back to login */}
                            <p className="mt-4 text-sm text-gray-500 text-center">
                                Remember your password?{" "}
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Back to login
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}