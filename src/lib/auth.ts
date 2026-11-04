import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string" ||
          !credentials.email.trim() ||
          !credentials.password ||
          credentials.email.length > 254 ||
          Buffer.byteLength(credentials.password, "utf8") > 72
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        Object.assign(token, { id: user.id });
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, { id: token.id });
      }

      return session;
    },
  },
};