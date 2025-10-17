"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
          <Link href="../data_view/" className="text-stone-800 hover:text-black">
            Questions
          </Link>
          <Link href="../exam_gen/" className="text-stone-800 hover:text-black">
            Generator
          </Link>
          <Link href="#" className="text-stone-800 hover:text-black">
            Help
          </Link>
          <Link href="../contact/" className="text-stone-800 hover:text-black">
            Contact
          </Link>

          <button
            onClick={() => setIsLoginOpen(true)}
            className="w-20 h-8 bg-stone-800 text-white text-sm rounded-2xl shadow hover:bg-black flex items-center justify-center"
          >
            Sign in
          </button>
        </div>
      </div>

      {/* ✅ Keep modal mounted, control visibility via props */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
