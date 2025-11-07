import React from "react";

export function DarkBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1020] via-[#0f172a] to-[#111827]">
        <div className="pointer-events-none absolute -top-40 left-10 h-[520px] w-[520px] rounded-full bg-cyan-400/25 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute top-1/3 right-16 h-[460px] w-[460px] rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute bottom-[-6rem] left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(transparent,transparent,rgba(0,0,0,0.35))]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function LightBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 🌌 Animated Aurora Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#dbeafe] via-[#e0f2fe] to-white">
        {/* Floating orbs */}
        <div className="absolute -top-40 left-10 w-[500px] h-[500px] bg-sky-300 opacity-30 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-[450px] h-[450px] bg-indigo-300 opacity-25 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-200 opacity-20 blur-3xl rounded-full animate-pulse"></div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}