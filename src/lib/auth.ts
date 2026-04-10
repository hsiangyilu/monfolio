import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/allowed-emails";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn({ profile }) {
      return isEmailAllowed(profile?.email);
    },
  },
});
