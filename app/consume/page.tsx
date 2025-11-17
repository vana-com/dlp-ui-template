"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Vana } from "@opendatalabs/vana-sdk/browser";
import { parseEther } from "viem";

const RUNTIME_URL = process.env.NEXT_PUBLIC_DLP_RUNTIME_URL || "http://localhost:8000";
const TASK_ID = process.env.NEXT_PUBLIC_TASK_ID || "999";
const PERMISSION_ID = 1;

type Status = "idle" | "requesting" | "processing" | "pending_payment" | "paying" | "paid" | "error";

interface KeywordData {
  keyword: string;
  count: number;
}

export default function ConsumePage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [operationId, setOperationId] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering wallet-dependent UI until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Dataset Insights</h1>
      </div>
    );
  }

  const handleRequest = async () => {
    if (!address || !walletClient) {
      setError("Please connect your wallet");
      return;
    }

    setStatus("requesting");
    setError(null);

    try {
      // Build operation request (same pattern as vana-sdk)
      const operationRequest = {
        permission_id: PERMISSION_ID,
        parameters: {
          top_n: 10,
        },
      };

      // Convert to JSON string (what will be signed)
      const operationRequestJson = JSON.stringify(operationRequest);

      // Sign the JSON string (same as vana-sdk and vana-personal-server)
      const signature = await walletClient.signMessage({ message: operationRequestJson });

      // Submit to runtime with personal-server format
      const response = await fetch(
        `${RUNTIME_URL}/v1/tasks/${TASK_ID}/invoke/aggregate_keywords`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grantee_signature: signature,
            operation_request_json: operationRequestJson,
          }),
        }
      );

      if (!response.ok) {
        // Parse error response to show actual server error message
        let errorMessage = `Failed to submit request: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          // Can't parse JSON, use default message
          console.error(parseError)
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setOperationId(data.operation_id);
      setStatus("processing");

      // Poll for status
      pollStatus(data.operation_id);
    } catch (err) {
      // Parse common errors into user-friendly messages
      let errorMessage = "Request failed";
      if (err instanceof Error) {
        if (err.message.includes("User rejected") || err.message.includes("User denied")) {
          errorMessage = "Signature request cancelled. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setStatus("error");
    }
  };

  const pollStatus = async (opId: string) => {
    const interval = setInterval(async () => {
      try {
        //
        // https://vana-runtime-orchestrator-git-feat-pro-779i-47372e-opendatalabs.vercel.app/api/v1/runtime/0xa2e19584bc2a4a293841128bb5b309914f67b865/v1/operations/999-e1ac7b57-eac1d00d
        // RUNTIME_URL = NEXT_PUBLIC_DLP_RUNTIME_URL =
        // https://vana-runtime-orchestrator-git-feat-pro-779i-47372e-opendatalabs.vercel.app/api/v1/runtime/0xa2e19584bc2a4a293841128bb5b309914f67b865
        // url = https://vana-runtime-orchestrator-git-feat-pro-779i-47372e-opendatalabs.vercel.app/api/v1/runtime/0xa2e19584bc2a4a293841128bb5b309914f67b865/tasks/
        const operationStatusUrl = `${RUNTIME_URL}/tasks/${TASK_ID}/operations/${opId}`;
        console.log(`Polling operation status: ${operationStatusUrl}`);
        const response = await fetch(operationStatusUrl);
        const data = await response.json();

        if (data.payment_status === "pending") {
          setPrice(data.final_price_vana);
          setStatus("pending_payment");
          clearInterval(interval);
        } else if (data.payment_status === "settled" && data.status === "completed") {
          // Download and parse results
          // https://6db7674377b0b27b55d9433373f6c4472723a763-8000.dstack-prod7.phala.network/v1/tasks/task-999-e1ac7b57-vana-tas-e49a/operations/999-e1ac7b57-eac1d00d
          const artifactsResponse = await fetch(
            `${RUNTIME_URL}/v1/tasks/${TASK_ID}/operations/${opId}/artifacts`
          );
          const artifactsData = await artifactsResponse.json();

          // Download the first artifact (keyword_evolution.json)
          if (artifactsData.artifacts && artifactsData.artifacts.length > 0) {
            const artifact = artifactsData.artifacts[0];
            const downloadUrl = `${RUNTIME_URL}${artifact.download_url}`;

            const fileResponse = await fetch(downloadUrl);
            const results = await fileResponse.json();

            if (results.top_keywords) {
              setKeywords(results.top_keywords);
            }
          }

          setStatus("paid");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    }, 3000);

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handlePay = async () => {
    // Validate all required values with user-friendly error messages
    if (!address || !walletClient) {
      setError("Please connect your wallet to continue");
      return;
    }

    if (!operationId) {
      setError("Operation ID not found. Please refresh and try again.");
      return;
    }

    if (!price) {
      setError("Price not loaded yet. Please wait a moment and try again.");
      return;
    }

    setStatus("paying");
    setError(null);

    try {
      // Initialize SDK with walletClient (same pattern as vana-app)
      const sdk = Vana({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walletClient: walletClient as any, // Type assertion needed for wagmi walletClient
      });

      const priceWei = parseEther(price.toString());
      const result = await sdk.accessSettlement.settlePaymentWithNative(
        operationId,
        priceWei
      );

      // Wait for confirmation
      await sdk.publicClient.waitForTransactionReceipt({ hash: result.hash });

      // Resume polling
      setStatus("processing");
      pollStatus(operationId);
    } catch (err) {
      // Parse common blockchain errors into user-friendly messages
      let errorMessage = "Payment failed";
      if (err instanceof Error) {
        if (err.message.includes("User rejected")) {
          errorMessage = "Transaction cancelled by user";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient VANA balance to complete payment";
        } else if (err.message.includes("already logged")) {
          errorMessage = "Payment already processed. Please refresh the page.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setStatus("pending_payment");
    }
  };

  // Idle state
  if (status === "idle") {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Dataset Insights.</h1>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                Access Dataset Keywords
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                Query the most common keywords from the entire dataset
              </p>
              <Button
                onClick={handleRequest}
                disabled={!address}
                size="sm"
                variant="outline"
                className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Request Analysis
              </Button>
            </div>
          </div>
        </div>

        {!address && (
          <p className="text-xs text-gray-500 mt-4">
            Please connect your wallet to continue
          </p>
        )}
      </div>
    );
  }

  // Processing/requesting state
  if (status === "requesting" || status === "processing") {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Dataset Insights.</h1>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {status === "requesting" ? "Submitting request..." : "Processing analysis..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Pending payment state
  if (status === "pending_payment") {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Dataset Insights.</h1>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                Payment Required
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                Analysis complete. Pay {price} VANA to unlock results.
              </p>
              <Button
                onClick={handlePay}
                size="sm"
                variant="outline"
                className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                <DollarSign className="mr-2 h-3 w-3" />
                Pay & Unlock
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Paying state
  if (status === "paying") {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Dataset Insights.</h1>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Processing payment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Paid - show results
  if (status === "paid") {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Dataset Insights.</h1>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Dataset Keywords
            </h3>
          </div>

          <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
            Top keywords from the entire dataset
          </p>

          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700"
                >
                  <span className="text-purple-900 dark:text-purple-100">
                    {kw.keyword}
                  </span>
                  <span className="ml-1.5 text-xs text-purple-600 dark:text-purple-400">
                    ×{kw.count}
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              No keywords found in results
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Dataset Insights.</h1>

      <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          {error || "Something went wrong"}
        </p>
        <Button
          onClick={() => setStatus("idle")}
          size="sm"
          variant="outline"
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
