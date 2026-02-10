"use client";

import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "./LoginModal";
import { useAuth } from "@/components/AuthContext";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user, logout } = useAuth(); 

  return (
    <>
      <div className="w-full h-20 bg-white flex items-center justify-between px-10 rounded-2xl shadow-md">
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
          <Link href="../data_view/" className="text-stone-800 hover:text-black">Questions</Link>
          <Link href="../exam_gen/" className="text-stone-800 hover:text-black">Generator</Link>
          <Link href="../past_exams/" className="text-stone-800 hover:text-black">Exams</Link>
          <Link href="../contact/" className="text-stone-800 hover:text-black">Contact</Link>

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
                w-48 rounded-2xl bg-white shadow-md border border-gray-100 p-2

                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                transition-opacity duration-150
              "
            >


              {!user ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 text-stone-800"
                >
                  Sign in
                </button>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 rounded-xl hover:bg-gray-100 text-stone-800"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className="block px-4 py-2 rounded-xl hover:bg-gray-100 text-stone-800"
                  >
                    Settings
                  </Link>

                  <div className="my-1 h-px bg-gray-200" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 text-red-600"
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
