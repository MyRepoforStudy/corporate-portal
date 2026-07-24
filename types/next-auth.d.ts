import type { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    ldapUid: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      ldapUid: string;
      role: Role;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    ldapUid: string;
    role: Role;
  }
}
