import { useMemo } from "react";
import { Vana } from "@opendatalabs/vana-sdk/browser";
import type { VanaInstance } from "@opendatalabs/vana-sdk/browser";
import { GoogleDriveStorage } from "@opendatalabs/vana-sdk/browser";
import { useWalletClient } from "wagmi";
import { useSession } from "next-auth/react";

/**
 * Initialize a Vana SDK instance configured for Google Drive storage.
 */
export function useVanaSdk(): VanaInstance | null {
  const { data: walletClient } = useWalletClient();
  const { data: session } = useSession();

  return useMemo(() => {
    if (!walletClient || !session?.accessToken) {
      return null;
    }

    return Vana({
      walletClient,
      storage: {
        providers: {
          googledrive: new GoogleDriveStorage({
            accessToken: session.accessToken,
          }),
        },
        defaultProvider: "googledrive",
      },
    });
  }, [walletClient, session?.accessToken]);
}

