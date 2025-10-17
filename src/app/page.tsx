<<<<<<< HEAD
"use client";

import React, { useState } from "react";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        Log In
      </button>

      
      <div className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"

      ></div>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
=======
import Image from "next/image";
import NavBar from "@/components/navbar";

export default function Home() {
  return (
    <div className="items-center justify-items-center min-h-screen bg-gradient-to-b from-[#EFF6FF] to-white">
      <NavBar />
      <h1 className="text-7xl text-center pt-40">Exam Genie</h1>

      <div className="space-y-10 pt-20">
        <button className="block w-110 h-15 bg-stone-800 text-white text-xl rounded-2xl shadow hover:bg-black">Create Test</button>
        <button className="block w-110 h-15 bg-stone-800 text-white text-xl rounded-2xl shadow hover:bg-black">View Your Questions</button>
      </div>
    </div>
>>>>>>> origin/main
  );
}