import { encryptWithWalletPublicKey } from "@/lib/crypto/utils";
import { UploadResponse } from "@/lib/google/googleService";
import { useState } from "react";
import { useSignMessage } from "wagmi";
import { ContributionData, DriveInfo, UserInfo } from "../types";
import { extractFileIdFromReceipt } from "../utils/fileUtils";
import { useAddFile } from "./useAddFile";
import { useDataRefinement } from "./useDataRefinement";
import { useDataUpload } from "./useDataUpload";
import { useRewardClaim } from "./useRewardClaim";
import {
  getDlpPublicKey,
  ProofResult,
  SIGN_MESSAGE,
  useTeeProof,
} from "./useTeeProof";

// Steps aligned with ContributionSteps component (1-based indexing)
const STEPS = {
  UPLOAD_DATA: 1,
  BLOCKCHAIN_REGISTRATION: 2,
  REQUEST_TEE_PROOF: 3,
  PROCESS_PROOF: 4,
  CLAIM_REWARD: 5,
};

export function useContributionFlow() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0); // Start at 0 (not yet started)
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [contributionData, setContributionData] =
    useState<ContributionData | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();
  const { uploadData, isUploading } = useDataUpload();
  const { addFile, isAdding, contractError } = useAddFile();
  const { requestContributionProof, isProcessing } = useTeeProof();
  const { requestReward, isClaiming } = useRewardClaim();
  const { refine, isLoading: isRefining } = useDataRefinement();

  const isLoading =
    isUploading ||
    isAdding ||
    isProcessing ||
    isClaiming ||
    isSigningMessage ||
    isRefining;

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
    driveInfo: DriveInfo,
    isConnected: boolean
  ) => {
    console.log("🚀 handleContributeData called with:", {
      userInfo: userInfo ? "present" : "missing",
      driveInfo: driveInfo ? "present" : "missing",
      isConnected,
    });

    if (!userInfo) {
      console.error("❌ No user info provided");
      setError("Unable to access user information. Please try again.");
      return;
    }

    try {
      console.log("🔄 Starting contribution flow...");
      setError(null);

      // Execute steps in sequence
      console.log("📝 Step 0: Executing sign message step...");
      const signature = await executeSignMessageStep();
      if (!signature) {
        console.error("❌ Sign message step failed");
        return;
      }
      console.log("✅ Sign message step completed");

      console.log("☁️ Step 1: Executing upload data step...");
      const uploadResult = await executeUploadDataStep(
        userInfo,
        signature,
        driveInfo
      );
      if (!uploadResult) {
        console.error("❌ Upload data step failed");
        return;
      }
      console.log("✅ Upload data step completed:", uploadResult);

      if (!isConnected) {
        console.error("❌ Wallet not connected for blockchain registration");
        setError("Wallet connection required to register on blockchain");
        return;
      }

      console.log("⛓️ Step 2: Executing blockchain registration step...");
      const { fileId, txReceipt, encryptedKey } =
        await executeBlockchainRegistrationStep(uploadResult, signature);
      if (!fileId) {
        console.error("❌ Blockchain registration step failed");
        return;
      }
      console.log("✅ Blockchain registration step completed:", { fileId, txReceipt });

      // Update contribution data with blockchain information
      console.log("📊 Updating contribution data with blockchain info...");
      updateContributionData({
        contributionId: uploadResult.vanaFileId,
        encryptedUrl: uploadResult.downloadUrl,
        transactionReceipt: {
          hash: txReceipt.transactionHash,
          blockNumber: txReceipt.blockNumber
            ? Number(txReceipt.blockNumber)
            : undefined,
        },
        fileId,
      });

      // Process proof and reward in sequence
      console.log("🔐 Starting proof and reward steps...");
      await executeProofAndRewardSteps(fileId, encryptedKey, signature);

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

  // Step 0: Sign message (pre-step before the visible flow begins)
  const executeSignMessageStep = async (): Promise<string | undefined> => {
    try {
      console.log("📝 Requesting message signature...", { message: SIGN_MESSAGE });
      // We don't update currentStep here since signing happens before the visible flow
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      console.log("✅ Message signed successfully:", signature ? "signature received" : "no signature");
      return signature;
    } catch (signError) {
      console.error("❌ Error signing message:", signError);
      setError("Failed to sign the message. Please try again.");
      return undefined;
    }
  };

  // Step 1: Upload data to Google Drive
  const executeUploadDataStep = async (
    userInfo: UserInfo,
    signature: string,
    driveInfo: DriveInfo
  ) => {
    console.log("☁️ Setting current step to UPLOAD_DATA");
    setCurrentStep(STEPS.UPLOAD_DATA);

    console.log("☁️ Calling uploadData with:", {
      userInfo: userInfo ? "present" : "missing",
      signature: signature ? "present" : "missing",
      driveInfo: driveInfo ? "present" : "missing",
    });

    const uploadResult = await uploadData(userInfo, signature, driveInfo);
    
    console.log("☁️ Upload result:", uploadResult);
    
    if (!uploadResult) {
      console.error("❌ Upload failed - no result returned");
      setError("Failed to upload data to Google Drive");
      return null;
    }

    console.log("☁️ Setting share URL:", uploadResult.downloadUrl);
    setShareUrl(uploadResult.downloadUrl);
    markStepComplete(STEPS.UPLOAD_DATA);
    return uploadResult;
  };

  // Step 2: Register on blockchain
  const executeBlockchainRegistrationStep = async (
    uploadResult: UploadResponse,
    signature: string
  ) => {
    console.log("⛓️ Setting current step to BLOCKCHAIN_REGISTRATION");
    setCurrentStep(STEPS.BLOCKCHAIN_REGISTRATION);

    console.log("⛓️ Getting DLP public key...");
    // Get DLP public key and encrypt the signature
    const publicKey = await getDlpPublicKey();
    console.log("⛓️ DLP public key received:", publicKey ? "present" : "missing");

    console.log("🔐 Encrypting signature with wallet public key...");
    const encryptedKey = await encryptWithWalletPublicKey(signature, publicKey);
    console.log("🔐 Signature encrypted:", encryptedKey ? "success" : "failed");

    console.log("⛓️ Adding file to blockchain...", {
      downloadUrl: uploadResult.downloadUrl,
      encryptedKey: encryptedKey ? "present" : "missing",
    });
    // Add the file to blockchain
    const txReceipt = await addFile(uploadResult.downloadUrl, encryptedKey);

    console.log("⛓️ Transaction receipt:", txReceipt);

    if (!txReceipt) {
      console.error("❌ Blockchain registration failed");
      // Use the specific contract error if available
      if (contractError) {
        console.error("❌ Contract error:", contractError);
        setError(`Contract error: ${contractError}`);
      } else {
        setError("Failed to add file to blockchain");
      }
      return { fileId: null };
    }

    console.log("⛓️ Extracting file ID from receipt...");
    // Extract file ID from transaction receipt
    const fileId = extractFileIdFromReceipt(txReceipt);
    console.log("⛓️ Extracted file ID:", fileId);
    
    markStepComplete(STEPS.BLOCKCHAIN_REGISTRATION);

    return { fileId, txReceipt, encryptedKey };
  };

  // Steps 3-5: TEE Proof and Reward
  const executeProofAndRewardSteps = async (
    fileId: number,
    encryptedKey: string,
    signature: string
  ) => {
    try {
      console.log("🔐 Starting TEE proof and reward steps...", {
        fileId,
        encryptedKey: encryptedKey ? "present" : "missing",
        signature: signature ? "present" : "missing",
      });

      // Step 3: Request TEE Proof
      console.log("🔐 Step 3: Requesting TEE proof...");
      const proofResult = await executeTeeProofStep(
        fileId,
        encryptedKey,
        signature
      );
      console.log("✅ TEE proof step completed:", proofResult);

      // Step 4: Process Proof
      console.log("🔄 Step 4: Processing proof...");
      await executeProcessProofStep(proofResult, signature);
      console.log("✅ Process proof step completed");

      // Step 5: Claim Reward
      console.log("💰 Step 5: Claiming reward...");
      await executeClaimRewardStep(fileId);
      console.log("✅ Claim reward step completed");
    } catch (proofErr) {
      console.error("💥 Error in TEE/reward process:", proofErr);
      setError(
        proofErr instanceof Error
          ? proofErr.message
          : "Failed to process TEE proof or claim reward"
      );
    }
  };

  // Step 3: Request TEE Proof
  const executeTeeProofStep = async (
    fileId: number,
    encryptedKey: string,
    signature: string
  ) => {
    console.log("🔐 Setting current step to REQUEST_TEE_PROOF");
    setCurrentStep(STEPS.REQUEST_TEE_PROOF);
    
    console.log("🔐 Requesting contribution proof...", {
      fileId,
      encryptedKey: encryptedKey ? "present" : "missing",
      signature: signature ? "present" : "missing",
    });
    
    const proofResult = await requestContributionProof(
      fileId,
      encryptedKey,
      signature
    );

    console.log("🔐 Proof result received:", proofResult);

    console.log("📊 Updating contribution data with TEE job ID...");
    updateContributionData({
      teeJobId: proofResult.jobId,
    });

    markStepComplete(STEPS.REQUEST_TEE_PROOF);
    return proofResult;
  };

  // Step 4: Process Proof
  const executeProcessProofStep = async (
    proofResult: ProofResult,
    signature: string
  ) => {
    console.log("🔄 Setting current step to PROCESS_PROOF");
    setCurrentStep(STEPS.PROCESS_PROOF);

    console.log("📊 Updating contribution data with proof data...");
    // Update contribution data with proof data
    updateContributionData({
      teeProofData: proofResult.proofData,
    });

    // Call the data refinement process
    try {
      console.log("🔄 Starting data refinement...", {
        file_id: proofResult.fileId,
        encryption_key: signature ? "present" : "missing",
      });
      
      const refinementResult = await refine({
        file_id: proofResult.fileId,
        encryption_key: signature,
      });

      console.log("✅ Data refinement completed:", refinementResult);

      markStepComplete(STEPS.PROCESS_PROOF);

      return refinementResult;
    } catch (refineError) {
      console.error("❌ Error during data refinement:", refineError);
      throw refineError;
    }
  };

  // Step 5: Claim Reward
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
    isSigningMessage,
    handleContributeData,
    resetFlow,
  };
}
