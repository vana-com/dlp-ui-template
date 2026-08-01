"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { useAuthModal } from "../auth/AuthModal";
import { useUserData } from "../profile/hooks/useUserData";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { ContributionSteps } from "./ContributionSteps";
import { ContributionSuccess } from "./ContributionSuccess";
import { ContributionSummary } from "./ContributionSummary";
import { useContributionFlow } from "./hooks/useContributionFlow";
import { UserInfo } from "./types";
import type { SpotifyListeningData } from "@/lib/spotify/spotifyApi";

/**
 * VanaDlpIntegration component for users to contribute data to VANA's Data Liquidity Pools
 */
export function VanaDlpIntegration() {
  const { data: session } = useSession();
  const { userInfo, listeningData } = useUserData();

  // Para connection
  const { isConnected } = useAccount();
  const { isOpen, openModal, closeModal } = useAuthModal();

  const {
    isSuccess,
    error,
    currentStep,
    completedSteps,
    contributionData,
    shareUrl,
    isLoading,
    isSigningMessage,
    handleContributeData,
    resetFlow,
  } = useContributionFlow();

  const handleContribute = async () => {
    if (!session?.user) {
      console.log("No session user", session);
      return;
    }

    if (!userInfo || !listeningData) {
      console.log("No userInfo or listeningData", userInfo, listeningData);
      return;
    }

    // Reset the flow before starting a new contribution
    resetFlow();

    await handleContributeData(userInfo, listeningData, isConnected);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contribute to Data Liquidity Pools</CardTitle>
        <CardDescription>
          Share your Spotify account data to earn rewards from VANA Data
          Liquidity Pools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess && contributionData ? (
          <ContributionSuccess
            contributionData={contributionData}
            completedSteps={completedSteps}
            shareUrl={shareUrl}
            userInfo={userInfo as UserInfo}
            listeningData={listeningData as SpotifyListeningData}
          />
        ) : (
          <div className="space-y-4">
            {currentStep > 0 && (
              <ContributionSteps
                currentStep={currentStep}
                completedSteps={completedSteps}
                hasError={!!error}
              />
            )}

            {/* Display user data summary */}
            {userInfo && (
              <ContributionSummary
                userInfo={userInfo as UserInfo}
                listeningData={listeningData as SpotifyListeningData}
                isEncrypted={false}
              />
            )}

            <Button
              onClick={handleContribute}
              disabled={isLoading || !isConnected || !userInfo}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === 1
                    ? "Uploading to Spotify..."
                    : currentStep === 2
                    ? isSigningMessage
                      ? "Signing message..."
                      : "Adding to blockchain..."
                    : currentStep === 3
                    ? "Requesting TEE proof..."
                    : currentStep === 4
                    ? "Processing proof..."
                    : currentStep === 5
                    ? "Claiming reward..."
                    : "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Contribute Spotify Data
                </>
              )}
            </Button>

            {!isConnected && (
              <ConnectWalletButton
                isOpen={isOpen}
                openModal={openModal}
                closeModal={closeModal}
              />
            )}

            {!userInfo && (
              <div className="bg-yellow-50 text-yellow-800 p-2 text-xs rounded mt-2">
                Sign in with Spotify to contribute your data
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Your data is encrypted and securely stored in your Spotify. You
        maintain control over who can access it.
      </CardFooter>
    </Card>
  );
}
