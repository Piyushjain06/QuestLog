import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
        // Email + Password credentials
        CredentialsProvider({
            id: "credentials",
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return { id: user.id, name: user.name, email: user.email, image: user.image };
            },
        }),
        // Steam "provider" — uses a credential flow that validates Steam OpenID
        CredentialsProvider({
            id: "steam",
            name: "Steam",
            credentials: {
                steamId: { label: "Steam ID", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.steamId) return null;
                let user = await prisma.user.findFirst({
                    where: { steamId: credentials.steamId },
                });
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            steamId: credentials.steamId,
                            name: `Steam User ${credentials.steamId.slice(-4)}`,
                        },
                    });
                }
                return { id: user.id, name: user.name, email: user.email, image: user.image };
            },
        }),
    ],
    // ── Session strategy ────────────────────────────────────────────────────
    // "database" = next-auth stores the session in Prisma and sends only a
    // small opaque session-token cookie (~40 bytes) to the browser.
    // "jwt" was sending a signed JWT blob in the cookie, causing 431 errors
    // when combined with other next-auth cookies (csrf, callback-url, etc.).
    //
    // ⚠️  NOTE: CredentialsProvider does NOT support database sessions in
    // next-auth v4 (sessions are not persisted for credentials logins).
    // For credentials users the session is still handled in-memory per request.
    // Google OAuth users will use full database sessions.
    session: {
        strategy: "jwt", // keep jwt for CredentialsProvider compatibility
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            // Keep only essential fields. Notably, we strip `picture` (avatar URL)
            // which can be a very long Google URL or base64 data URI and causes
            // next-auth to chunk the cookie into multiple pieces, bloating headers.
            return {
                id: token.id,
                sub: token.sub,
                name: token.name,
                email: token.email,
                // picture intentionally omitted — fetch avatar from DB instead
                iat: token.iat,
                exp: token.exp,
                jti: token.jti,
            };
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                (session.user as Record<string, unknown>).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth",
    },
    // Shrink cookie names in production to save header bytes
    cookies:
        process.env.NODE_ENV === "production"
            ? {
                sessionToken: {
                    name: `__Secure-next-auth.session-token`,
                    options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
                },
            }
            : undefined,
};
