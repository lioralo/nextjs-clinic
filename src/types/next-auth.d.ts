import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: string;
    patientId?: string | null;
    forcePasswordChange?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      role: string;
      patientId?: string | null;
      forcePasswordChange?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
    patientId?: string | null;
    forcePasswordChange?: boolean;
  }
}

export {};
