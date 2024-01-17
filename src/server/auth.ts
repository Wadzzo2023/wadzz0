import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "~/env";
import { db } from "~/server/db";
import { comparePassword } from "~/utils/hash";
import GitHubProvider from "next-auth/providers/github";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      // ...other properties
      // role: UserRole;
    };
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
  // adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },

  providers: [
    GitHubProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),

    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials) {
        const { pubkey, password } = credentials as {
          pubkey: string;
          password: string;
        };

        const passwordCorrect = await comparePassword("test", password);

        if (passwordCorrect) {
          console.log("password correct");
          const user = await db.user.findFirst({ where: { id: pubkey } });

          // if user is not created create user.
          if (user) {
            return user;
          } else {
            const data = await db.user.create({
              data: { id: pubkey, name: "Unknown" },
            });
            // const account = await db.account.create({
            //   data: {
            //     userId: data.id,
            //     type: "credentials",
            //     provider: "credentials",
            //     providerAccountId: data.id,
            //   },
            // });

            return data;
          }
        }

        // const user = { id: "1", name: "J Smith", email: "jsmith@example.com" };
        // if (user) {
        //   return user;
        // }

        return null;
      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
