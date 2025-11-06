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
            width={75}
            height={75}
          />
        </Link>
        <div className="flex space-x-8">
          <Link href="../data_view/" className="text-stone-800 hover:text-black">Questions</Link>
          <Link href="../exam_gen/" className="text-stone-800 hover:text-black">Generator</Link>
          <Link href="../past_exams/" className="text-stone-800 hover:text-black">Exams</Link>
          <Link href="../contact/" className="text-stone-800 hover:text-black">Contact</Link>

          {!user ? (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="w-20 h-8 bg-stone-800 text-white text-sm rounded-2xl shadow hover:bg-black flex items-center justify-center -mt-1">
              Sign in
            </button>
           ) : (
            <button
              onClick={logout}
              className="w-20 h-8 bg-stone-800 text-white text-sm rounded-2xl shadow hover:bg-black flex items-center justify-center -mt-1">
              Sign Out
            </button>
          )}


        </div>
      </div>
      
    {/* Login Modal */}
    <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
