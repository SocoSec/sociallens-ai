import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getUserByEmail, upsertOAuthUser } from "@/lib/db";

const providers = [
  Credentials({
    name: "Email and password",
    credentials: { email: {}, password: {} },
    authorize: async (creds) => {
      const email = String(creds?.email || "").toLowerCase().trim();
      const password = String(creds?.password || "");
      if (!email || !password) return null;
      const user = await getUserByEmail(email);
      if (!user?.password_hash) return null;
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return null;
      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const dbUser = await upsertOAuthUser({
            email: user.email,
            name: user.name,
            image: user.image,
          });
          user.id = String(dbUser.id);
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) session.user.id = token.uid;
      return session;
    },
  },
});
