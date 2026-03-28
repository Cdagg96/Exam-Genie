import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/libs/mongo";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const user = await db.collection("users").findOne({ email });

        if (!user) {
          throw new Error("Email not found");
        }

        //Check user status
        if (user.status === "Pending") {
          throw new Error("Your account is pending approval.");
        }
        
        if (user.status === "Denied") {
          throw new Error("Your registration has been denied.");
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          throw new Error("Incorrect password");
        }

        // IMPORTANT: return a "safe" user object (no password)
        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          role: user.role,
          status: user.status,
          institution: user.institution,
          department: user.department,
          tSubject: user.tSubject || [],
          isAdmin: user.isAdmin || false
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // runs on sign in
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.institution = (user as any).institution;
        token.department = (user as any).department;
        token.tSubject = (user as any).tSubject;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      // make these available client-side
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session.user as any).status = token.status;
      (session.user as any).institution = token.institution;
      (session.user as any).department = token.department;
      (session.user as any).tSubject = token.tSubject;
      (session.user as any).isAdmin = token.isAdmin;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
