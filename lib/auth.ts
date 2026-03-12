import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { sendEmail, ADMIN_EMAIL } from "./email";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      isPro: boolean;
      isMax: boolean;
      isLocked: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    isAdmin?: boolean;
    isPro?: boolean;
    isMax?: boolean;
    isLocked?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "admin-credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          const adminEmail = process.env.ADMIN_EMAIL ?? "admin@bittsquiz.internal";
          let user = await prisma.user.findUnique({ where: { email: adminEmail } });
          if (!user) {
            user = await prisma.user.create({
              data: { email: adminEmail, name: "Admin", emailVerified: new Date(), isAdmin: true },
            });
          } else if (!user.isAdmin) {
            await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
          }
          return { id: user.id, email: user.email, name: user.name ?? "Admin", isAdmin: true, isPro: false, isMax: false, isLocked: false };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token["id"] = user.id;
        token["isAdmin"] = user.isAdmin ?? false;
        token["isPro"] = user.isPro ?? false;
        token["isMax"] = user.isMax ?? false;
        token["isLocked"] = user.isLocked ?? false;
      }
      // Refresh user flags on session update or when token lacks flags
      if (trigger === "update" || token["isPro"] === undefined) {
        if (token["id"]) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token["id"] as string },
            select: { isAdmin: true, isPro: true, isMax: true, isLocked: true, proExpiresAt: true, maxExpiresAt: true },
          });
          if (dbUser) {
            token["isAdmin"] = dbUser.isAdmin;
            // Auto-expire pro if past proExpiresAt
            token["isPro"] = dbUser.isPro && (!dbUser.proExpiresAt || dbUser.proExpiresAt > new Date());
            token["isMax"] = dbUser.isMax && (!dbUser.maxExpiresAt || dbUser.maxExpiresAt > new Date());
            token["isLocked"] = dbUser.isLocked;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      const u = session.user as { id: string; isAdmin: boolean; isPro: boolean; isMax: boolean; isLocked: boolean };
      u.id = token.id as string;
      u.isAdmin = Boolean(token["isAdmin"]);
      u.isPro = Boolean(token["isPro"]);
      u.isMax = Boolean(token["isMax"]);
      u.isLocked = Boolean(token["isLocked"]);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      // Notify admin when a brand-new user registers
      await sendEmail({
        to: ADMIN_EMAIL(),
        subject: `[BittsQuiz] New player joined: ${user.name ?? user.email}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#7c3aed">New Player Joined — BittsQuiz</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;color:#666;width:100px">Name</td><td style="padding:8px;font-weight:600">${user.name ?? "—"}</td></tr>
              <tr><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${user.email ?? "—"}</td></tr>
              <tr><td style="padding:8px;color:#666">Joined</td><td style="padding:8px">${new Date().toLocaleString()}</td></tr>
            </table>
            <p style="color:#999;font-size:12px;margin-top:16px">BittsQuiz ${new Date().getFullYear()}</p>
          </div>
        `,
      }).catch((err: unknown) => console.error("[auth] Failed to send new user email:", err instanceof Error ? err.message : err));
    },
  },
});
