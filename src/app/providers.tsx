"use client";

import { AuthProvider } from "@/components/AuthContext";
import { SessionProvider } from "next-auth/react";
import AuthBridge from "@/components/AuthBridge";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <AuthBridge />
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}