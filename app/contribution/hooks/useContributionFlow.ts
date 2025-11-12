import { useState } from "react";
import { ContributionData, UserInfo } from "../types";
import { useDataUpload } from "./useDataUpload";
import { useRewardClaim } from "./useRewardClaim";
import { useRuntimeTask } from "./useRuntimeTask";

// Steps aligned with ContributionSteps component (1-based indexing)
const STEPS = {
  UPLOAD_DATA: 1,
  BLOCKCHAIN_REGISTRATION: 2,
  PROCESS_RUNTIME_TASK: 3,
  CLAIM_REWARD: 4,
};

export function useContributionFlow() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0); // Start at 0 (not yet started)
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [contributionData, setContributionData] =
    useState<ContributionData | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  const { uploadThought, isUploading } = useDataUpload();
  const { submitContribution, isProcessing } = useRuntimeTask();
  const { requestReward, isClaiming } = useRewardClaim();

  const isLoading =
    isUploading ||
    isProcessing ||
    isClaiming;

  const resetFlow = () => {
    setIsSuccess(false);
    setError(null);
    setCurrentStep(0); // Reset to not started
    setCompletedSteps([]);
    setContributionData(null);
    setShareUrl("");
  };

  const handleContributeData = async (
    userInfo: UserInfo,
    thoughtText: string,
    isConnected: boolean,
    walletAddress?: string
  ) => {
    console.log("🚀 handleContributeData called with:", {
      userInfo: userInfo ? "present" : "missing",
      thoughtLength: thoughtText?.length || 0,
      isConnected,
      walletAddress: walletAddress ? "present" : "missing",
    });

    if (!userInfo) {
      console.error("❌ No user info provided");
      setError("Unable to access user information. Please try again.");
      return;
    }

    if (!thoughtText || thoughtText.trim().length < 10) {
      console.error("❌ Invalid thought text");
      setError("Please enter a valid thought (at least 10 characters).");
      return;
    }

    try {
      console.log("🔄 Starting contribution flow...");
      setError(null);

      // Execute steps in sequence
      console.log("☁️ Step 1: Executing upload thought step...");
      const uploadResult = await executeUploadThoughtStep(
        thoughtText,
        userInfo,
        walletAddress
      );
      if (!uploadResult) {
        console.error("❌ Upload thought step failed");
        return;
      }
      console.log("✅ Upload thought step completed:", uploadResult);

      // Process with runtime task and claim reward
      console.log("🔐 Starting runtime task processing and reward...");
      await executeRuntimeTaskAndRewardSteps(uploadResult.fileId);

      console.log("🎉 Contribution flow completed successfully!");
      setIsSuccess(true);
    } catch (error) {
      console.error("💥 Error contributing data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process your contribution. Please try again."
      );
    }
  };

  // Step 1: Upload thought to Google Drive
  const executeUploadThoughtStep = async (
    thoughtText: string,
    userInfo: UserInfo,
    walletAddress?: string
  ) => {
    console.log("☁️ Setting current step to UPLOAD_DATA");
    setCurrentStep(STEPS.UPLOAD_DATA);

    console.log("☁️ Calling uploadThought with:", {
      thoughtLength: thoughtText.length,
      userInfo: userInfo ? "present" : "missing",
      walletAddress: walletAddress ? "present" : "missing",
    });

    const uploadResult = await uploadThought(thoughtText, userInfo, walletAddress);
    
    console.log("☁️ Upload result:", uploadResult);
    
    if (!uploadResult) {
      console.error("❌ Upload failed - no result returned");
      setError("Failed to upload thought to Google Drive");
      return null;
    }

    console.log("☁️ Setting share URL:", uploadResult.url);
    setShareUrl(uploadResult.url);

    // Update contribution data with upload + blockchain results from SDK
    console.log("📊 Updating contribution data with upload info...");
    updateContributionData({
      contributionId: uploadResult.fileId.toString(),
      encryptedUrl: uploadResult.url,
      transactionReceipt: {
        hash: uploadResult.transactionHash,
      },
      fileId: uploadResult.fileId,
      thoughtData: uploadResult.thoughtData,
    });

    markStepComplete(STEPS.UPLOAD_DATA);
    setCurrentStep(STEPS.BLOCKCHAIN_REGISTRATION);
    markStepComplete(STEPS.BLOCKCHAIN_REGISTRATION);

    return uploadResult;
  };

  // Steps 3-4: Runtime Task Processing and Reward
  const executeRuntimeTaskAndRewardSteps = async (
    fileId: number
  ) => {
    try {
      console.log("🔐 Starting runtime task and reward steps...", {
        fileId,
      });

      // Step 3: Submit to Runtime Task
      console.log("🔐 Step 3: Submitting to runtime task...");
      await executeRuntimeTaskStep(fileId);
      console.log("✅ Runtime task step completed");

      // Step 4: Claim Reward
      console.log("💰 Step 4: Claiming reward...");
      await executeClaimRewardStep(fileId);
      console.log("✅ Claim reward step completed");
    } catch (err) {
      console.error("💥 Error in runtime task/reward process:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process with runtime task or claim reward"
      );
    }
  };

  // Step 3: Submit to Runtime Task
  const executeRuntimeTaskStep = async (fileId: number) => {
    console.log("🔐 Setting current step to PROCESS_RUNTIME_TASK");
    setCurrentStep(STEPS.PROCESS_RUNTIME_TASK);
    
    console.log("🔐 Submitting contribution to runtime task...", {
      fileId,
    });
    
    const taskResult = await submitContribution(fileId);

    console.log("🔐 Runtime task result received:", taskResult);

    console.log("📊 Updating contribution data with task result...");
    updateContributionData({
      teeProofData: taskResult.result,
    });

    markStepComplete(STEPS.PROCESS_RUNTIME_TASK);
    return taskResult;
  };

  // Step 4: Claim Reward
  const executeClaimRewardStep = async (fileId: number) => {
    console.log("💰 Setting current step to CLAIM_REWARD");
    setCurrentStep(STEPS.CLAIM_REWARD);
    
    console.log("💰 Requesting reward for file ID:", fileId);
    const rewardResult = await requestReward(fileId);

    console.log("💰 Reward result:", rewardResult);

    console.log("📊 Updating contribution data with reward transaction hash...");
    updateContributionData({
      rewardTxHash: rewardResult?.transactionHash,
    });

    markStepComplete(STEPS.CLAIM_REWARD);
    return rewardResult;
  };

  // Helper functions
  const markStepComplete = (step: number) => {
    console.log(`✅ Marking step ${step} as complete`);
    setCompletedSteps((prev) => [...prev, step]);
  };

  const updateContributionData = (newData: Partial<ContributionData>) => {
    console.log("📊 Updating contribution data:", newData);
    setContributionData((prev) => {
      if (!prev) return newData as ContributionData;
      return { ...prev, ...newData };
    });
  };

  return {
    isSuccess,
    error,
    currentStep,
    completedSteps,
    contributionData,
    shareUrl,
    isLoading,
    handleContributeData,
    resetFlow,
  };
}
