"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/components/AuthContext";

export default function AuthBridge() {
  const { data: session, status } = useSession();
  const { user, login, logout } = useAuth();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      if (user) logout();
      return;
    }

    if (status === "authenticated" && session?.user) {
      const nextUser = {
        _id: (session.user as any).id,
        email: session.user.email ?? "",
        role: (session.user as any).role,
      };

      // Prevent unnecessary re-logins / loops
      if (!user || user._id !== nextUser._id || user.email !== nextUser.email) {
        login(nextUser);
      }
    }
  }, [status, session, user, login, logout]);

  return null;
}
