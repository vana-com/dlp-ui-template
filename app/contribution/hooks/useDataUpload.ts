import { useState } from "react";
import { uploadUserData, uploadThought as uploadThoughtService, UploadResponse } from "@/lib/google/googleService";
import { useSession } from "next-auth/react";
import { DriveInfo, UserInfo } from "../types";

/**
 * Hook for uploading and encrypting data/thoughts
 */
export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();

  /**
   * Upload thought to Google Drive
   */
  const uploadThought = async (
    thoughtText: string,
    userInfo: UserInfo,
    signature: string,
    walletAddress?: string
  ): Promise<UploadResponse | null> => {
    setIsUploading(true);

    try {
      if (!session?.accessToken) {
        throw new Error("No access token available");
      }

      // Use the Google Service to handle the entire upload process
      const result = await uploadThoughtService(
        thoughtText,
        userInfo,
        signature,
        session.accessToken as string,
        walletAddress
      );

      return result;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * @deprecated Use uploadThought instead
   * Upload data to Google Drive (legacy)
   */
  const uploadData = async (
    userInfo: UserInfo,
    signature: string,
    driveInfo?: DriveInfo
  ): Promise<UploadResponse | null> => {
    setIsUploading(true);

    try {
      if (!session?.accessToken) {
        throw new Error("No access token available");
      }

      // Use the Google Service to handle the entire upload process
      const result = await uploadUserData(
        userInfo,
        signature,
        session.accessToken as string,
        driveInfo
      );

      return result;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadThought,
    uploadData, // Keep for backwards compatibility
    isUploading,
  };
}
