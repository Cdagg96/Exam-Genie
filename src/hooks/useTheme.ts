"use client";

import { useState, useEffect } from "react";

export default function useTheme() {
  const [isDark, setIsDark] = useState(false);

  //Initialize theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    //If preference has been selected, it has priority
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } 
    //If no preference has been selected, go based on the user browser colors
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  //Swap the theme colors if toggled
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return { isDark, toggleTheme };
}