/**
 * TODO-TEMP-REMOVE: DELETE THIS ENTIRE FILE BEFORE PRODUCTION
 * 
 * This API route uses the DLP owner's private key to call
 * DatasetRegistry.addPendingFile() on behalf of users.
 * 
 * WHY THIS EXISTS:
 * - DatasetRegistry.addPendingFile() requires FILE_MANAGER_ROLE
 * - Users cannot call it directly
 * - For demo, DLP owner has been granted FILE_MANAGER_ROLE
 * - This backend route acts as a trusted intermediary
 * 
 * WHEN TO REMOVE:
 * - Smart contracts upgraded with public contributeToDataset() function
 * - Update UI to call contract directly
 * - Delete this entire file
 * - Remove DLP_OWNER_PRIVATE_KEY from environment
 * 
 * Search for "TODO-TEMP-REMOVE" across codebase to find all related code.
 */

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mokshaTestnet } from "@/contracts/chains";

// ⚠️ SECURITY: This private key should ONLY be used on testnet
const DLP_OWNER_PRIVATE_KEY = process.env.DLP_OWNER_PRIVATE_KEY as `0x${string}` | undefined;
const DATASET_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_DATASET_REGISTRY_ADDRESS as `0x${string}` | undefined;
const DATASET_ID = parseInt(process.env.NEXT_PUBLIC_DATASET_ID || "0");

// DatasetRegistry ABI - minimal for addPendingFile
const DATASET_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "datasetId", type: "uint256" },
      { internalType: "uint256", name: "fileId", type: "uint256" },
    ],
    name: "addPendingFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    console.log("📝 [TEMP WORKAROUND] Adding file to dataset pending list...");
    console.log("⚠️ WARNING: Using backend private key - DEMO ONLY");

    // Validate environment
    if (!DLP_OWNER_PRIVATE_KEY) {
      console.error("❌ DLP_OWNER_PRIVATE_KEY not configured");
      return NextResponse.json(
        {
          error: "Server configuration error: DLP_OWNER_PRIVATE_KEY not set",
        },
        { status: 500 }
      );
    }

    if (!DATASET_REGISTRY_ADDRESS) {
      console.error("❌ DATASET_REGISTRY_ADDRESS not configured");
      return NextResponse.json(
        {
          error:
            "Server configuration error: DATASET_REGISTRY_ADDRESS not set",
        },
        { status: 500 }
      );
    }

    if (!DATASET_ID || DATASET_ID === 0) {
      console.error("❌ DATASET_ID not configured");
      return NextResponse.json(
        { error: "Server configuration error: DATASET_ID not set" },
        { status: 500 }
      );
    }

    // Parse request
    const { fileId } = await request.json();

    if (!fileId || typeof fileId !== "number") {
      return NextResponse.json(
        { error: "fileId is required and must be a number" },
        { status: 400 }
      );
    }

    console.log(
      `📝 Adding file ${fileId} to dataset ${DATASET_ID} pending list...`
    );

    // Create wallet client with DLP owner's account
    const account = privateKeyToAccount(DLP_OWNER_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: mokshaTestnet,
      transport: http(),
    });

    console.log(`Using DLP owner account: ${account.address}`);

    // Call DatasetRegistry.addPendingFile()
    const hash = await walletClient.writeContract({
      address: DATASET_REGISTRY_ADDRESS,
      abi: DATASET_REGISTRY_ABI,
      functionName: "addPendingFile",
      args: [BigInt(DATASET_ID), BigInt(fileId)],
    });

    console.log(`Transaction sent: ${hash}`);

    // Wait for confirmation
    const publicClient = createPublicClient({
        chain: mokshaTestnet,
        transport: http(),
      });

    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(
      `📝 File ${fileId} added to dataset ${DATASET_ID} pending list`
    );

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      datasetId: DATASET_ID,
      fileId: fileId,
      message: `File ${fileId} added to dataset ${DATASET_ID} pending list`,
      warning:
        "⚠️ This operation used backend private key - TEMPORARY WORKAROUND FOR DEMO",
    });
  } catch (error: unknown) {
    console.error("❌ Error adding file to pending list:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to add file to dataset pending list",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

