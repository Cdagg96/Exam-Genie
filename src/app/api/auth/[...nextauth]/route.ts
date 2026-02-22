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

        if (!user) return null;

        // Block disabled accounts (adjust value if you use Active/Enabled/etc.)
        // if (user.status && user.status !== "Active") {
        //   return null;
        // }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // IMPORTANT: return a "safe" user object (no password)
        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          role: user.role,
          status: user.status,
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
      }
      return token;
    },
    async session({ session, token }) {
      // make these available client-side
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session.user as any).status = token.status;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
