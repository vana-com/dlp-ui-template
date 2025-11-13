import { useState } from "react";
import type { Address, Hash } from "viem";
import { useVanaSdk } from "./useVanaSdk";
import { fetchPgePublicKey, derivePgeAddress } from "@/lib/pge/client";
import { ThoughtData, UserInfo } from "../types";

export interface UploadResponse {
  fileId: number;
  url: string;
  transactionHash: Hash;
  thoughtData: ThoughtData;
}

/**
 * Hook for uploading and encrypting data/thoughts using the Vana SDK.
 */
export function useDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const vana = useVanaSdk();

  const uploadThought = async (
    thoughtText: string,
    userInfo: UserInfo,
    walletAddress?: string
  ): Promise<UploadResponse | null> => {
    setIsUploading(true);

    try {
      if (!vana) {
        throw new Error("Vana SDK is not initialized");
      }

      const timestamp = new Date().toISOString();
      const contributorId = walletAddress || userInfo.email;

      const thoughtData: ThoughtData = {
        contributor_id: contributorId,
        thought: thoughtText,
        timestamp,
      };

      const serializedContent = JSON.stringify(thoughtData);

      const pgePublicKey = await fetchPgePublicKey();
      const formattedPublicKey = pgePublicKey.startsWith("0x")
        ? pgePublicKey
        : `0x${pgePublicKey}`;
      
      // Use fixed PGE address from environment (not derived from public key)
      const pgeAddress = process.env.NEXT_PUBLIC_PGE_ADDRESS as Address;
      
      if (!pgeAddress) {
        throw new Error("NEXT_PUBLIC_PGE_ADDRESS not configured");
      }

      const result = await vana.data.upload({
        content: serializedContent,
        filename: `vana_thought_${Date.now()}.json`,
        providerName: "googledrive",
        permissions: [
          {
            account: pgeAddress,
            publicKey: formattedPublicKey,
          },
        ],
      });

      return {
        fileId: result.fileId,
        url: result.url,
        transactionHash: result.transactionHash,
        thoughtData,
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadThought,
    isUploading,
  };
}
