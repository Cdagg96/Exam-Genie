"use client";

import React from "react";
import NavBar from "@/components/navbar";
import { useState } from "react";
import Link from "next/link";
import { LightBackground, DarkBackground } from "@/components/BackgroundModal";

export default function Home() {
  // Using react state to manage info display on hover
  const [displayCreateTestInfo, setDisplayCreateTestInfo] = useState(false);
  const [displayViewQuestionsInfo, setDisplayViewQuestionsInfo] = useState(false);
  return (
    // Centers content and applies background gradient
    <LightBackground>
      <div className="items-center justify-items-center min-h-screen p-4">
        <NavBar />

        {/* Home page title */}
        <h1 className="text-7xl text-center pt-40 font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
          Exam Genie
        </h1>
        <p className="mt-3 text-center text-slate-600">
          Build, preview, and print professional exams in minutes.
        </p>

        {/* Position buttons/info icons */}
        <div className="space-y-10 mt-20 w-fit">
          {/* Info icon positioned with Create Test button */}
          <div className="relative">
            <div
              onMouseEnter={() => setDisplayCreateTestInfo(true)}
              onMouseLeave={() => setDisplayCreateTestInfo(false)}
            >
              {/* Info icon from Heroicons */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="absolute size-6 -top-6 -right-2"
                data-testid="create-test-icon"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" 
                />
              </svg>
              {/* Info display for Create Test button */}
              {displayCreateTestInfo && (
                <div className="absolute -top-24 -right-70 w-64 p-4 bg-gradient-to-b from-[#EFF6FF] to-white border border-stone-800 rounded-lg text-sm text-stone-800">
                  Click to create a new test by selecting saved questions.
                </div>
              )}
            </div>
            {/* Button style */}
            <Link href="../exam_gen/" className="btn btn-ghost w-110 h-15 text-xl rounded-2xl flex items-center justify-center">
              Create Test
            </Link>
          </div>

          <div className="relative">
            {/* Info icon positioned with View Your Questions button */}
            <div
              onMouseEnter={() => setDisplayViewQuestionsInfo(true)}
              onMouseLeave={() => setDisplayViewQuestionsInfo(false)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="absolute size-6 -top-6 -right-2"
                data-testid="view-questions-icon"
              >
                <path
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" 
                />
              </svg>
              {/* Info display for View Your Questions button */}
              {displayViewQuestionsInfo && (
                <div className="absolute -top-24 -right-70 w-64 p-4 bg-gradient-to-b from-[#EFF6FF] to-white border border-stone-800 rounded-lg text-sm text-stone-800">
                  Click to view and manage saved questions.
                </div>
              )}
            </div>

            <Link href="../data_view/" className="bt btn-ghost w-110 h-15 text-xl rounded-2xl flex items-center justify-center">
              View Your Questions
            </Link>
          </div>
        </div>
      </div>
    </LightBackground>
  );
}