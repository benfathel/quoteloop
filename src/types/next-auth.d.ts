import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessName: string;
      phone: string;
    } & DefaultSession["user"];
  }

  interface User {
    businessName: string;
    phone: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    businessName: string;
    phone: string;
  }
}
