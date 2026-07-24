import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authenticateWithDevMock, authenticateWithLdap } from "@/lib/ldap";

const isDevMode =
  process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_MODE === "true";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "LDAP",
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        let ldapUser;
        try {
          ldapUser = isDevMode
            ? await authenticateWithDevMock(credentials.username, credentials.password)
            : await authenticateWithLdap(credentials.username, credentials.password);
        } catch (err) {
          console.error("[auth] LDAP authentication failed with an error:", err);
          return null;
        }

        if (!ldapUser) return null;

        const user = await prisma.user.upsert({
          where: { ldapUid: ldapUser.ldapUid },
          update: {
            email: ldapUser.email,
            displayName: ldapUser.displayName,
            lastLoginAt: new Date(),
          },
          create: {
            ldapUid: ldapUser.ldapUid,
            email: ldapUser.email,
            displayName: ldapUser.displayName,
            lastLoginAt: new Date(),
          },
        });

        // The org-directory Employee record and the LDAP-backed User account
        // are separate tables (Employee predates login-based accounts). Link
        // them by email on first login so /api/profile has something to
        // resolve - only when unlinked, so it never overrides an existing link.
        if (!user.employeeId) {
          const matchingEmployee = await prisma.employee.findFirst({
            where: { email: { equals: ldapUser.email, mode: "insensitive" } },
          });
          if (matchingEmployee) {
            await prisma.user.update({
              where: { id: user.id },
              data: { employeeId: matchingEmployee.id },
            });
          }
        }

        return {
          id: user.id,
          ldapUid: user.ldapUid,
          email: user.email,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.ldapUid = user.ldapUid;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.ldapUid = token.ldapUid;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
