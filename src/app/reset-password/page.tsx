"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    //State variables
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isValidToken, setIsValidToken] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [userInfo, setUserInfo] = useState({ email: "", role: "" });
    const router = useRouter();

    useEffect(() => {
        //Get token from URL
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get("token");

        if (!tokenFromUrl) {
            setIsValidToken(false);
            setIsLoading(false);
            toast.error("Invalid reset link. Please request a new one.");
            return;
        }

        setToken(tokenFromUrl);
        verifyToken(tokenFromUrl);
    }, []);

    //Function to verify reset token
    const verifyToken = async (token: string) => {
        try {
            const res = await fetch(`/api/auth/verify-reset-token?token=${token}`);
            const data = await res.json();

            if (data.valid) {
                setIsValidToken(true);
                setUserInfo({ email: data.email, role: data.role });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error verifying reset link.");
        } finally {
            setIsLoading(false);
        }
    };

    //Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        //Fill in all fields
        if (!password || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        //Password match check
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        //Password length check (can chage requirements later)
        if (password.length < 0) {
            toast.error("Password must be at least a characters");
            return;
        }

        setIsResetting(true);

        //Send reset request
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            //Password reset
            if (data.success) {
                setResetSuccess(true);
                toast.success("Password reset successful.");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsResetting(false);
        }
    };

    //Loading state while verifying token
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    //If token is invalid, show error message
    if (!isValidToken && !resetSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
                        <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
                        <p className="text-sm text-gray-500 mb-6">
                            Please request a new password reset link from the login page.
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div >
        );
    }


    if (resetSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
                        {/* Checkmark svg */}
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Complete</h1>
                    <p className="text-gray-600 mb-2">Your password has been successfully updated.</p>
                    <p className="text-gray-500 text-sm mb-6">You can now close this tab.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                        Reset Password
                    </h2>
                    <p className="text-gray-600 mt-2">Create a new password for your account</p>
                    {/* Show masked email and role */}
                    {userInfo.email && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                Resetting password for: <span className="font-semibold">{userInfo.email}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Account type: <span className="font-semibold capitalize">{userInfo.role}</span>
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Password fields */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new password"
                            minLength={8}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-3 top-2/3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? (
                                //Display the open visibility icon
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            ) : (
                                //Display the closed visibility icon
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Confirm password field */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(prev => !prev)}
                            className="absolute right-3 top-2/3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showConfirmPassword ? (
                                //Display the open visibility icon
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            ) : (
                                //Display the closed visibility icon
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isResetting}
                        className={`w-full py-3 rounded-lg text-white font-medium transition ${isResetting ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"}`}
                    >
                        {isResetting ? (
                            <span className="flex items-center justify-center">
                                {/* Loading svg */}
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
                                Resetting Password...
                            </span>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>

                {/* Back to home link */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push("/")}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}