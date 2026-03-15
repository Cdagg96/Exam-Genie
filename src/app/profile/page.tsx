"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";
import { useAuth } from "@/components/AuthContext";
import { signOut } from "next-auth/react"; 
import useTheme from "@/hooks/useTheme"

interface UserData {
  _id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdOn: string;
  updatedOn?: string;
}


export default function ProfilePage() {
  const { isDark, toggleTheme } = useTheme(); //Select between light/dark mode based on user preference
  const { user } = useAuth(); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }


      try {
        //Get user ID
        const userId = (user as any)?.id || (user as any)?._id;
       
        if (!userId) {
          throw new Error('User ID not found');
        }


        const response = await fetch(`/api/user/profile?userId=${userId}`);
       
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch user data');
        }


        const data = await response.json();
        setUserData(data.user || data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };


    fetchUserData();
  }, [user]);


  const handleSignOut = async () => {
    // This signs out of NextAuth (clears cookies + session)
    await signOut({ callbackUrl: "/" });
    // No need to call logout(); AuthBridge will see unauthenticated and clear AuthContext.
  };

  //Helper function to format the date
  const formatDateJoined = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  //Get full name from firstName and lastName
  const getFullName = () => {
    if (!userData) return "Unknown User";
    
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    } else {
      return "Unknown User";
    }
  };

  //Get initials for avatar
  const getInitials = () => {
    if (!userData) return "U";
    return (userData.firstName?.charAt(0)?.toUpperCase() || '') +
           (userData.lastName?.charAt(0)?.toUpperCase() || '') || "U";
  };

  return (
    <Background>
      <div className="items-center justify-items-center min-h-screen p-4">
        <NavBar />

        <div className="mt-10 w-full max-w-4xl">
          <h1 className="text-5xl text-center text-blue-gradient">
            Profile
          </h1>
          <p className="mt-3 text-center text-secondary">
            View your account info and manage settings.
          </p>

          {/* Main profile card */}
          <div className="mt-10 p-8 card-primary">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Avatar + info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow">
                  {userData ? getInitials() : "U"}
                </div>

                <div>
                  <div className="text-2xl font-semibold text-primary">
                    {userData ? getFullName() : "Unknown User"}
                  </div>
                  <div className="text-sm text-secondary">
                    {userData?.email || "N/A"}
                  </div>

                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/settings"
                  className="btn btn-ghost w-40 h-11"
                >
                  Settings
                </Link>

                {userData ? (
                  <button
                    onClick={handleSignOut}
                    className="btn btn-primary-blue w-40 h-11"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="btn btn-ghost rounded-2xl shadow w-40 h-11 flex items-center justify-center"
                  >
                    Go Home
                  </Link>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 h-px w-full bg-gray-200" />

            {/* Info blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-primary p-4">
                <div className="text-xs uppercase tracking-wide text-primary">
                  Status
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {user ? "Signed in" : "Signed out"}
                </div>
              </div>

              <div className="border-primary p-4">
                <div className="text-xs uppercase tracking-wide text-primary">
                  Role
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "Guest"}
                </div>
              </div>

              <div className="border-primary p-4">
                <div className="text-xs uppercase tracking-wide text-primary">
                  First Name
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {userData?.firstName || "N/A"}
                </div>
              </div>

              <div className="border-primary p-4">
                <div className="text-xs uppercase tracking-wide text-primary">
                  Last Name
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {userData?.lastName || "N/A"}
                </div>
              </div>

              <div className="border-primary p-4">
                <div className="text-xs uppercase tracking-wide text-primary">
                  Phone
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {userData?.phone || "N/A"}
                </div>
              </div>

              <div className="border-primary p-4">
                <div className="text-xs uppercase tracking-wide text-primary">
                  Date Joined
                </div>
                <div className="mt-1 text-sm text-secondary">
                  {formatDateJoined(userData?.createdOn)}
                </div>
              </div>
            </div>
            
            {/* Info alert about updating profile */}
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <span className="font-medium">Need to update your information?</span> Click the{" "}
                <Link href="../settings/" className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2">
                  Settings
                </Link>{" "}
                button above to edit your profile.
              </span>
            </div>

            {!userData && (
              <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                You're not logged in. Please log in to view stats.
              </div>
            )}
          </div>

          {/* Quick links card */}
          <div className="card-primary mt-8 p-6">
            <h2 className="text-xl font-semibold text-primary">
              Quick Links
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="../exam_gen/"
                className="btn btn-ghost w-44 h-11 flex items-center justify-center"
              >
                Create Test
              </Link>
              <Link
                href="../data_view/"
                className="btn btn-ghost w-44 h-11 flex items-center justify-center"
              >
                View Questions
              </Link>
              <Link
                href="../past_exams/"
                className="btn btn-ghost w-44 h-11 flex items-center justify-center"
              >
                Past Exams
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Background>
  );
}
