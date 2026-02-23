import React from "react";

export function Background({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-main"></div>
      <div className="absolute -top-40 left-10 w-[500px] h-[500px] bg-sky-300 dark:bg-blue-400 opacity-30 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-20 w-[450px] h-[450px] bg-indigo-300 dark:bg-cyan-400 opacity-25 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-200 dark:bg-blue-600 opacity-20 blur-3xl rounded-full animate-pulse"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}