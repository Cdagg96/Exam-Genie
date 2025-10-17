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
  );
}