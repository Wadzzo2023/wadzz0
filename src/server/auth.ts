import { type GetServerSidePropsContext } from "next";
import { verifyMessageSignature } from "@albedo-link/signature-verification";
import axios from "axios";

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
import { truncateString } from "~/utils/string";
import { AuthCredentialType } from "~/types/auth";
import { WalletType } from "package/connect_wallet";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "package/connect_wallet/src/lib/firebase/firebase-auth";
import { verifyIdToken } from "package/connect_wallet/src/lib/firebase/admin/auth";
import { z } from "zod";
import { getPublicKeyAPISchema } from "package/connect_wallet/src/lib/stellar/wallet_clients/type";

import { USER_ACOUNT_URL } from "package/connect_wallet/src/lib/stellar/constant";
import { verifyXDRsSignature } from "package/connect_wallet/src/lib/stellar/trx/deummy";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
type User = DefaultSession["user"] & {
  id: string;
  walletType: WalletType;
  // ...other properties
  // role: UserRole;
};

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: User;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => {
      // console.log("session", session, "token", token);
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          walletType: token.walletType,
        },
      };
    },
    jwt: ({ user, token }) => {
      const u = user as User;
      if (u) {
        token.walletType = u.walletType;
      }
      return token;
    },
  },
  // adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials): Promise<User | null> {
        // console.log("...vong..");
        const cred = credentials as AuthCredentialType;

        // email pass login
        if (cred.walletType == WalletType.emailPass) {
          const { email, password } = cred;
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const user = userCredential.user;
          const data = await getUserPublicKey({ email: email, uid: user.uid });
          const sessionUser = await dbUser(data.publicKey);
          return {
            ...sessionUser,
            walletType: WalletType.emailPass,
            email: email,
          };
        }

        // wallete

        if (cred.walletType == WalletType.albedo) {
          const { pubkey, signature, token } = cred;

          const isValid = verifyMessageSignature(pubkey, token, signature);
          if (isValid) {
            const sessionUser = await dbUser(pubkey);
            return { ...sessionUser, walletType: WalletType.albedo };
          }
          throw new Error("Invalid signature");
        }
        // wallete rabet and frieghter
        if (
          cred.walletType == WalletType.rabet ||
          cred.walletType == WalletType.frieghter ||
          cred.walletType == WalletType.walletConnect
        ) {
          const { pubkey, signedXDR } = cred;
          const isValid = await verifyXDRsSignature({
            publicKey: pubkey,
            xdr: signedXDR,
          });
          if (isValid) {
            const sessionUser = await dbUser(pubkey);
            return { ...sessionUser, walletType: cred.walletType };
          }
          throw new Error("Invalid signature");
        }

        // provider logins
        if (
          cred.walletType == WalletType.google ||
          cred.walletType == WalletType.facebook
        ) {
          const { token, email } = cred;
          const uid = await verifyIdToken(token);
          const data = await getUserPublicKey({ uid, email });
          const sessionUser = await dbUser(data.publicKey);
          return { ...sessionUser, walletType: cred.walletType, email: email };
          // return {}
        }

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

async function dbUser(pubkey: string) {
  const user = await db.user.findUnique({ where: { id: pubkey } });
  // if user is not created create user.
  if (user) {
    return user;
  } else {
    const data = await db.user.create({
      data: { id: pubkey, name: truncateString(pubkey) },
    });
    return data;
  }
}

async function getUserPublicKey({
  uid,
  email,
}: {
  uid: string;
  email: string;
}) {
  const res = await axios.get<z.infer<typeof getPublicKeyAPISchema>>(
    USER_ACOUNT_URL,
    {
      params: {
        uid,
        email,
      },
    },
  );
  return res.data;
}
