"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/components/AuthContext";
import { stat } from "fs";

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
        firstName: (session.user as any).firstName ?? "",
        lastName: (session.user as any).lastName ?? "",
        phone: (session.user as any).phone ?? "",
        institution: (session.user as any).institution ?? "",
        department: (session.user as any).department ?? "",
        tSubject: (session.user as any).tSubject ?? [],
        isAdmin: (session.user as any).isAdmin ?? false,
        status: (session.user as any).status ?? "",
        isCooperating: (session.user as any).isCooperating ?? false,
        profileImage: (session.user as any).profileImage ?? "",
      };

      // Prevent unnecessary re-logins / loops
      if (!user || user._id !== nextUser._id || user.email !== nextUser.email) {
        login(nextUser);
      }
    }
  }, [status, session, user, login, logout]);

  return null;
}
