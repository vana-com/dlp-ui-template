// This file contains NextAuth.js configuration options
// It's imported by both server components and API routes

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";

/**
 * Extended JWT token with OAuth tokens
 */
interface ExtendedToken extends JWT {
  accessToken?: string;
  accessTokenExpires?: number;
  refreshToken?: string;
  idToken?: string;
  error?: string;
}

/**
 * Refreshes the Google OAuth access token using the refresh token
 */
async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
  try {
    // Ensure refresh token exists
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid profile email https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("Access token expired, refreshing...");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.idToken = token.idToken;
      session.error = token.error;
      return session;
    },
  },
};
