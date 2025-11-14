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
import { AlertCircle, Loader2, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useAuthModal } from "../auth/AuthModal";
import { useUserData } from "../profile/hooks/useUserData";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { ContributionSteps } from "./ContributionSteps";
import { ContributionSuccess } from "./ContributionSuccess";
import { ContributionSummary } from "./ContributionSummary";
import { useContributionFlow } from "./hooks/useContributionFlow";
import { MIN_CHARS } from "./ThoughtInput";
import { ThoughtInput } from "./ThoughtInput";
import { UserInfo } from "./types";

/**
 * VanaDlpIntegration component for users to contribute thoughts to the Thinker DLP
 */
export function VanaDlpIntegration() {
  const { data: session } = useSession();
  const { userInfo } = useUserData();
  const [thoughtText, setThoughtText] = useState("");

  // Para connection
  const { isConnected, address: walletAddress } = useAccount();
  const { isOpen, openModal, closeModal } = useAuthModal();

  const {
    isSuccess,
    error,
    currentStep,
    completedSteps,
    contributionData,
    shareUrl,
    isLoading,
    handleContributeData,
    resetFlow,
  } = useContributionFlow();

  const isThoughtValid = thoughtText.trim().length >= MIN_CHARS;

  const handleContribute = async () => {
    if (!session?.user) {
      console.log("No session user", session);
      return;
    }

    if (!userInfo) {
      console.log("No userInfo", userInfo);
      return;
    }

    if (!isThoughtValid) {
      console.log("Thought is not valid");
      return;
    }

    // Reset the flow before starting a new contribution
    resetFlow();

    await handleContributeData(userInfo, thoughtText.trim(), isConnected, walletAddress);
  };

  const handleReset = () => {
    resetFlow();
    setThoughtText("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contribute to the Thinker DLP</CardTitle>
        <CardDescription>
          Share your reflective thoughts and earn rewards from the VANA network
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
            onReset={handleReset}
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

            {/* Thought Input */}
            {userInfo && currentStep === 0 && (
              <>
                <ThoughtInput
                  value={thoughtText}
                  onChange={setThoughtText}
                  disabled={isLoading}
                />

                {/* Display contribution summary with thought preview */}
                {thoughtText.trim().length > 0 && (
                  <ContributionSummary
                    userInfo={userInfo as UserInfo}
                    thoughtText={thoughtText.trim()}
                    isEncrypted={false}
                  />
                )}
              </>
            )}

            <Button
              onClick={handleContribute}
              disabled={isLoading || !isConnected || !userInfo || !isThoughtValid}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === 1
                    ? "Encrypting & uploading..."
                    : currentStep === 2
                    ? "Adding to blockchain..."
                    : currentStep === 3
                    ? "Processing with runtime task..."
                    : currentStep === 4
                    ? "Claiming reward..."
                    : "Processing..."}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Contribute Your Thought
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
              <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 p-2 text-xs rounded mt-2">
                Sign in with Google to contribute your thoughts
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Your thoughts are encrypted client-side and securely stored in your Google Drive. 
        You maintain full control over your data.
      </CardFooter>
    </Card>
  );
}
