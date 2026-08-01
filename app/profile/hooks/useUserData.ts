"use client";

import type { SpotifyListeningData, SpotifyUserInfo } from "@/lib/spotify/spotifyApi";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface UserDataState {
  userInfo: SpotifyUserInfo | null;
  listeningData: SpotifyListeningData | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserData(): UserDataState {
  const session = useSession();
  const [userInfo, setUserInfo] = useState<SpotifyUserInfo | null>(null);
  const [listeningData, setListeningData] = useState<SpotifyListeningData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSessionUserRef = useRef<string | null>(null);

  useEffect(() => {
    const currentSession = session.data;
    if (!currentSession) return;

    const userKey = currentSession.user?.email || currentSession.user?.name || "anonymous";

    if (lastSessionUserRef.current === userKey) return;

    lastSessionUserRef.current = userKey;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [userInfoResponse, listeningResponse] = await Promise.all([
          fetch("/api/spotify/profile"),
          fetch("/api/spotify/listening"),
        ]);

        if (
          userInfoResponse.status === 401 ||
          listeningResponse.status === 401
        ) {
          console.log("Authentication failed, signing out user");
          signOut({ callbackUrl: "/" });
          return;
        }

        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse.json().catch(() => ({ error: "Unknown error" }));
          console.error("User info error:", errorData);
          setError("Failed to fetch Spotify profile. Please try again later.");
          toast.error("Failed to fetch Spotify profile");
          return;
        }

        if (!listeningResponse.ok) {
          const errorData = await listeningResponse.json().catch(() => ({ error: "Unknown error" }));
          console.error("Listening data error:", errorData);
          setError("Failed to fetch Spotify listening data. Please try again later.");
          toast.error("Failed to fetch listening data");
          return;
        }

        const userInfoData = await userInfoResponse.json();
        const finalUserInfo = userInfoData;

        if (!finalUserInfo.locale) {
          finalUserInfo.locale = typeof navigator !== "undefined" ? navigator.language || "en" : "en";
        }

        setUserInfo(finalUserInfo);
        setListeningData(await listeningResponse.json());
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to fetch user data. Please try again later.");
        toast.error("Failed to fetch user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  return {
    userInfo,
    listeningData,
    isLoading,
    error,
  };
}
