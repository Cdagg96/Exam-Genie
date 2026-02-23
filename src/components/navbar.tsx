"use client";

import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "./LoginModal";
import { useAuth } from "@/components/AuthContext";
import { signOut } from "next-auth/react"; 

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useAuth(); 

  const handleSignOut = async () => {
    // This signs out of NextAuth (clears cookies + session)
    await signOut({ callbackUrl: "/" });
    // No need to call logout(); AuthBridge will see unauthenticated and clear AuthContext.
  };

  return (
    <>
      <div className="w-full h-20 card-primary flex items-center justify-between px-10 rounded-2xl shadow-md">
        <Link href="/">
          <Image
            className="rounded-full"
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
          />
        </Link>
        <div className="flex items-center space-x-8">
          <Link href="../data_view/" className="text-secondary hover:text-primary">Questions</Link>
          <Link href="../exam_gen/" className="text-secondary hover:text-primary">Generator</Link>
          <Link href="../past_exams/" className="text-secondary hover:text-primary">Exams</Link>
          <Link href="../contact/" className="text-secondary hover:text-primary">Contact</Link>

          {/* Profile Icon */}
          <div className="relative group py-1">
            <div className="flex items-center cursor-pointer">
              <Image
                className="rounded-full"
                src="/profileIcon.png"
                alt="Profile"
                width={36}
                height={36}
              />
            </div>

            {/* Dropdown */}
            <div
              className="
                absolute right-0 top-10 z-50
                w-48 rounded-2xl card-primary p-2

                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                transition-opacity duration-150
              "
            >
              {!user ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full text-left px-4 py-2 rounded-xl hover:bg-secondary text-primary"
                >
                  Sign in
                </button>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 rounded-xl hover:bg-secondary text-primary"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className="block px-4 py-2 rounded-xl hover:bg-secondary text-primary"
                  >
                    Settings
                  </Link>

                  <div className="my-1 h-px border-primary" />

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 rounded-xl hover:bg-secondary text-red-600"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
    {/* Login Modal */}
    <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}