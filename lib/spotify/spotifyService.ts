import { clientSideEncrypt } from "@/lib/crypto/utils";
import type { SpotifyListeningData, SpotifyUserInfo } from "@/lib/spotify/spotifyApi";

export interface SpotifyUploadResponse {
  downloadUrl: string;
  fileId: string;
  vanaFileId: string;
  encryptedData: string;
  dataPackage: {
    userId: string;
    email: string;
    timestamp: number;
    profile: {
      name: string;
      locale?: string;
    };
    listening: SpotifyListeningData;
  };
}

export const uploadSpotifyData = async (
  userInfo: SpotifyUserInfo,
  listeningData: SpotifyListeningData,
  signature: string
): Promise<SpotifyUploadResponse> => {
  const timestamp = Date.now();
  const dataPackage = {
    userId: userInfo.id,
    email: userInfo.email,
    timestamp,
    profile: {
      name: userInfo.name,
      locale: userInfo.locale,
    },
    listening: listeningData,
  };

  const fileString = JSON.stringify(dataPackage);
  const fileBlob = new Blob([fileString], { type: "application/json" });
  const encryptedBlob = await clientSideEncrypt(fileBlob, signature);
  const encryptedData = await blobToBase64(encryptedBlob);

  const fakeFileId = `spotify-${timestamp}`;
  const vanaFileId = `sp-${userInfo.id}-${timestamp}`;

  return {
    downloadUrl: `data:application/octet-stream;base64,${encryptedData}`,
    fileId: fakeFileId,
    vanaFileId,
    encryptedData,
    dataPackage,
  };
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
