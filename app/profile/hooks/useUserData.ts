"use client";

import type { GoogleDriveInfo, GoogleUserInfo } from "@/lib/google/googleApi";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface UserDataState {
  userInfo: GoogleUserInfo | null;
  driveInfo: GoogleDriveInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserData(): UserDataState {
  const { data: session, status } = useSession();

  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
  const [driveInfo, setDriveInfo] = useState<GoogleDriveInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track session identity to prevent repeat fetches
  const lastSessionUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const userKey = session.user?.email || session.user?.name || "anonymous";

    // Prevent re-fetch if we already fetched for this user
    if (lastSessionUserRef.current === userKey) return;

    lastSessionUserRef.current = userKey;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userInfoResponse = await fetch("/api/google/user-info");

        if (userInfoResponse.status === 401) {
          console.log("Authentication failed, signing out user");
          signOut({ callbackUrl: "/" });
          return;
        }

        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error("User info error:", errorData);
          setError("Failed to fetch user information. Please try again later.");
          toast.error("Failed to fetch user information");
          return;
        }

        const userInfoData = await userInfoResponse.json();
        // Fallback to browser locale if missing
        let finalUserInfo = userInfoData;

        if (!userInfoData.locale) {
          const browserLocale =
            typeof navigator !== "undefined"
              ? navigator.language || navigator.languages?.[0] || "en-US"
              : "en-US";

          finalUserInfo = {
            ...userInfoData,
            locale: browserLocale,
          };
        }
        setUserInfo(finalUserInfo);
        
        // Drive info is no longer needed for Thinker DLP
        setDriveInfo(null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error fetching user data:", err);
          setError("An unexpected error occurred. Please try again later.");
          toast.error("Failed to fetch user data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, status]);

  return {
    userInfo,
    driveInfo,
    isLoading,
    error,
  };
}
