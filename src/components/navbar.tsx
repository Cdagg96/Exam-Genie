"use client";

import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [LoggedIn, setLoggedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);


  // load log in stat from local storage
  useEffect(() => {
    const storedLoginState = localStorage.getItem("LoggedIn");
    if (storedLoginState === "true") {
      setLoggedIn(true);
    }
    setLoaded(true); //only render buttons after this
  }, []);

  // Save login state to local storage when it changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("LoggedIn", LoggedIn.toString());
    }
  }, [LoggedIn, loaded]);

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
          <Link href="#" className="text-stone-800 hover:text-black">Help</Link>
          <Link href="../contact/" className="text-stone-800 hover:text-black">Contact</Link>

          {loaded && !LoggedIn &&
            <button
              onClick={() => setIsLoginOpen(true)}
              className="w-20 h-8 bg-stone-800 text-white text-sm rounded-2xl shadow hover:bg-black flex items-center justify-center -mt-1">
              Sign in
            </button>
          }
          {/*Signout Button*/}
          {loaded && LoggedIn &&
            <button
              onClick={() => setLoggedIn(false)}
              className="w-20 h-8 bg-stone-800 text-white text-sm rounded-2xl shadow hover:bg-black flex items-center justify-center -mt-1">
              Sign Out
            </button>
          }


        </div>
      </div>


      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} LoggedIn={LoggedIn} setLoggedIn={setLoggedIn} />
    </>
  );
}
