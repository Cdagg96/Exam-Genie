"use client";
import React from "react";

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Don’t render anything if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white text-black rounded-2xl shadow-2xl w-[70rem] h-[30rem] flex relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-500 text-2xl"
        >
        {/*means the x*/}
          &times;
        </button>

        {/* Login Section */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-4 px-10">
          <h2 className="text-3xl font-semibold mb-2">Login</h2>
          <input
            type="text"
            placeholder="Email"
            className="w-3/4 p-3 rounded-lg bg-stone-900 text-white placeholder-stone-400 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-3/4 p-3 rounded-lg bg-stone-900 text-white placeholder-stone-400 focus:outline-none"
          />
          <button className="w-3/4 p-3 bg-stone-600 text-white rounded-lg hover:bg-stone-900 transition">
            Sign In
          </button>
        </div>

        {/* Divider */}
        <div className="w-[2px] bg-stone-900 my-16"></div>

        {/* Register Section */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-4 px-10">
          <h2 className="text-3xl font-semibold mb-2">Register</h2>
          <input
            type="text"
            placeholder="Username"
            className="w-3/4 p-3 rounded-lg bg-stone-900 text-white placeholder-stone-400 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-3/4 p-3 rounded-lg bg-stone-900 text-white placeholder-stone-400 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-3/4 p-3 rounded-lg bg-stone-900 text-white placeholder-stone-400 focus:outline-none"
          />
          <button className="w-3/4 p-3 bg-stone-600 text-white rounded-lg hover:bg-stone-900 transition">
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
