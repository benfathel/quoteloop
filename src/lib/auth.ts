import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user || !user.otpCode || !user.otpExpiresAt) return null;

        // Check if OTP has expired
        if (new Date() > user.otpExpiresAt) return null;

        // Check if OTP matches
        if (user.otpCode !== credentials.otp) return null;

        // Clear OTP after successful verification
        await prisma.user.update({
          where: { id: user.id },
          data: { otpCode: null, otpExpiresAt: null },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email || undefined,
          businessName: user.businessName,
          phone: user.phone,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 year
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60, // 1 year — persists across browser restarts
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.businessName = user.businessName;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.businessName = token.businessName;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
};
