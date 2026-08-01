import { useState } from "react";
import { uploadSpotifyData, SpotifyUploadResponse } from "@/lib/spotify/spotifyService";
import { useSession } from "next-auth/react";
import type { UserInfo } from "../types";
import type { SpotifyListeningData } from "@/lib/spotify/spotifyApi";

export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const {} = useSession();

  const uploadData = async (
    userInfo: UserInfo,
    signature: string,
    listeningData: SpotifyListeningData
  ): Promise<SpotifyUploadResponse | null> => {
    setIsUploading(true);

    try {
      const result = await uploadSpotifyData(userInfo, listeningData, signature);
      return result;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadData,
    isUploading,
  };
}
