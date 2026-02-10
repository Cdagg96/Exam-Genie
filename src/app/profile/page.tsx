"use client";

import React from "react";
import Link from "next/link";
import NavBar from "@/components/navbar";
import { LightBackground } from "@/components/BackgroundModal";
import { useAuth } from "@/components/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <LightBackground>
      <div className="items-center justify-items-center min-h-screen p-4">
        <NavBar />

        <div className="mt-10 w-full max-w-4xl">
          <h1 className="text-5xl text-center font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="mt-3 text-center text-slate-600">
            View your account info and manage settings.
          </p>

          {/* Main profile card */}
          <div className="mt-10 bg-white rounded-2xl shadow-md p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Avatar + info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow">
                  U
                </div>

                <div>
                  <div className="text-2xl font-semibold text-stone-800">
                    {(user as any)?.name || "Unknown User"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {(user as any)?.email || ""}
                  </div>

                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/settings"
                  className="btn btn-ghost rounded-2xl shadow w-40 h-11 flex items-center justify-center"
                >
                  Settings
                </Link>

                {user ? (
                  <button
                    onClick={logout}
                    className="w-40 h-11 text-white bg-gray-800 hover:bg-gray-900 text-sm rounded-2xl shadow flex items-center justify-center"
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
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </div>
                <div className="mt-1 text-sm text-stone-800">
                  {user ? "Signed in" : "Signed out"}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Role
                </div>
                <div className="mt-1 text-sm text-stone-800">
                  {(user as any)?.role || "User"}
                </div>
              </div>
            </div>

            {!user && (
              <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                You're not logged in. Please log in to view stats.
              </div>
            )}
          </div>

          {/* Quick links card */}
          <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-stone-800">
              Quick Links
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="../exam_gen/"
                className="btn btn-ghost rounded-2xl shadow w-44 h-11 flex items-center justify-center"
              >
                Create Test
              </Link>
              <Link
                href="../data_view/"
                className="btn btn-ghost rounded-2xl shadow w-44 h-11 flex items-center justify-center"
              >
                View Questions
              </Link>
              <Link
                href="../past_exams/"
                className="btn btn-ghost rounded-2xl shadow w-44 h-11 flex items-center justify-center"
              >
                Past Exams
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LightBackground>
  );
}
