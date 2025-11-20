"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, DollarSign, Download, CheckCircle, Clock, XCircle, History, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Vana } from "@opendatalabs/vana-sdk/browser";
import { parseEther } from "viem";

const RUNTIME_URL = process.env.NEXT_PUBLIC_DLP_RUNTIME_URL || "http://localhost:8000";
const TASK_ID = process.env.NEXT_PUBLIC_TASK_ID || "999";
const PERMISSION_ID = 1;

interface Operation {
  operation_id: string;
  operation_name: string;
  status: string;
  permission_id: string | null;
  payment_status: string | null;
  final_price_vana: number | null;
  settlement_tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Artifact {
  artifact_id: string;  // Matches API response
  file_name: string;
  size_bytes: number;   // Matches API response
  mimetype?: string;
  download_url?: string;
}

interface ArtifactData {
  keywords?: string[];
  evolution?: Record<string, any>;
  insights?: Record<string, any>;
  raw?: any;
}

export default function ConsumePage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [mounted, setMounted] = useState(false);

  // My Purchases state
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Record<string, Artifact[]>>({});
  const [artifactData, setArtifactData] = useState<Record<string, ArtifactData>>({});
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const [loadingArtifactData, setLoadingArtifactData] = useState<Set<string>>(new Set());

  // Request flow state
  const [requestStatus, setRequestStatus] = useState<"idle" | "requesting" | "processing" | "pending_payment" | "paying" | "error">("idle");
  const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's operations when address changes
  useEffect(() => {
    if (mounted && address) {
      loadMyOperations();
    }
  }, [mounted, address]);

  if (!mounted) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Thinker DLP Data Access</h1>
      </div>
    );
  }

  const loadMyOperations = async () => {
    if (!address) return;

    setLoadingOperations(true);
    try {
      const response = await fetch(
        `${RUNTIME_URL}/v1/tasks/${TASK_ID}/operations?grantee=${address}&limit=50`
      );
      const data = await response.json();
      setOperations(data.operations || []);

      // Load artifacts for each operation
      for (const op of data.operations || []) {
        if (op.status === "completed") {
          loadArtifacts(op.operation_id);
        }
      }
    } catch (err) {
      console.error("Failed to load operations:", err);
    } finally {
      setLoadingOperations(false);
    }
  };

  const loadArtifacts = async (operationId: string) => {
    try {
      const response = await fetch(
        `${RUNTIME_URL}/v1/tasks/${TASK_ID}/operations/${operationId}/artifacts`
      );
      const data = await response.json();
      setArtifacts(prev => ({
        ...prev,
        [operationId]: data.artifacts || []
      }));
    } catch (err) {
      console.error(`Failed to load artifacts for ${operationId}:`, err);
    }
  };

  const fetchArtifactData = async (artifactId: string, fileName: string) => {
    if (!walletClient || !address) {
      setError("Please connect your wallet");
      return;
    }

    // Mark as loading
    setLoadingArtifactData(prev => new Set(prev).add(artifactId));

    try {
      // Create time-limited signature
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `download:${artifactId}:${timestamp}`;

      const signature = await walletClient.signMessage({ message });

      // Fetch with authentication
      const url = `${RUNTIME_URL}/v1/tasks/${TASK_ID}/artifacts/${artifactId}`;
      const params = new URLSearchParams({
        signature,
        message,
        timestamp: timestamp.toString()
      });

      const response = await fetch(`${url}?${params}`);

      if (response.status === 402) {
        throw new Error("Payment required");
      }

      if (response.status === 403) {
        throw new Error("Access denied");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch data");
      }

      // Parse JSON data
      const text = await response.text();
      const data = JSON.parse(text);

      // Store parsed data
      const parsed: ArtifactData = { raw: data };

      // Extract specific fields based on artifact type
      if (fileName.includes('keyword')) {
        if (data.keywords) {
          parsed.keywords = data.keywords;
        }
        if (data.evolution) {
          parsed.evolution = data.evolution;
        }
        if (data.insights) {
          parsed.insights = data.insights;
        }
      }

      setArtifactData(prev => ({ ...prev, [artifactId]: parsed }));

      // Toggle expanded
      setExpandedArtifacts(prev => {
        const next = new Set(prev);
        next.add(artifactId);
        return next;
      });

    } catch (err) {
      console.error("Failed to fetch artifact data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoadingArtifactData(prev => {
        const next = new Set(prev);
        next.delete(artifactId);
        return next;
      });
    }
  };

  const downloadArtifact = async (artifactId: string, fileName: string) => {
    if (!walletClient || !address) {
      setError("Please connect your wallet");
      return;
    }

    try {
      // Create time-limited signature
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `download:${artifactId}:${timestamp}`;

      console.log("Signing download request:", message);
      const signature = await walletClient.signMessage({ message });

      // Download with authentication
      const url = `${RUNTIME_URL}/v1/tasks/${TASK_ID}/artifacts/${artifactId}`;
      const params = new URLSearchParams({
        signature,
        message,
        timestamp: timestamp.toString()
      });

      const response = await fetch(`${url}?${params}`);

      if (response.status === 402) {
        throw new Error("Payment required - please pay the invoice first");
      }

      if (response.status === 403) {
        throw new Error("Access denied - only the grantee can download this artifact");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Download failed");
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      console.log("Download successful:", fileName);
    } catch (err) {
      console.error("Download failed:", err);
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handlePayInvoice = async (operationId: string, priceVana: number) => {
    if (!address || !walletClient) {
      setError("Please connect your wallet");
      return;
    }

    try {
      const sdk = Vana({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walletClient: walletClient as any,
      });

      const priceWei = parseEther(priceVana.toString());
      const result = await sdk.accessSettlement.settlePaymentWithNative(
        operationId,
        priceWei
      );

      await sdk.publicClient.waitForTransactionReceipt({ hash: result.hash });

      // Refresh operations
      loadMyOperations();
      setError(null);
    } catch (err) {
      let errorMessage = "Payment failed";
      if (err instanceof Error) {
        if (err.message.includes("User rejected")) {
          errorMessage = "Transaction cancelled";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient VANA balance";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    }
  };

  const handleRequestAnalysis = async () => {
    if (!address || !walletClient) {
      setError("Please connect your wallet");
      return;
    }

    setRequestStatus("requesting");
    setError(null);

    try {
      const operationRequest = {
        permission_id: PERMISSION_ID,
        parameters: { top_n: 10 },
      };

      const operationRequestJson = JSON.stringify(operationRequest);
      const signature = await walletClient.signMessage({ message: operationRequestJson });

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      setCurrentOperationId(data.operation_id);
      setRequestStatus("processing");

      // Poll for completion
      pollOperationStatus(data.operation_id);
    } catch (err) {
      let errorMessage = "Request failed";
      if (err instanceof Error) {
        if (err.message.includes("User rejected")) {
          errorMessage = "Signature cancelled";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setRequestStatus("error");
    }
  };

  const pollOperationStatus = async (opId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${RUNTIME_URL}/v1/tasks/${TASK_ID}/operations/${opId}`);
        const data = await response.json();

        if (data.payment_status === "pending") {
          setCurrentPrice(data.final_price_vana?.toString() || null);
          setRequestStatus("pending_payment");
          // DON'T stop polling - keep checking in case payment settles
        } else if (data.payment_status === "settled" && data.status === "completed") {
          setRequestStatus("idle");
          clearInterval(interval);
          // Refresh operations list to show the result
          loadMyOperations();
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    }, 3000);

    // 5 minute timeout
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handlePayCurrent = async () => {
    if (!currentOperationId || !currentPrice) return;

    setRequestStatus("paying");
    try {
      await handlePayInvoice(currentOperationId, parseFloat(currentPrice));
      setRequestStatus("processing");
      pollOperationStatus(currentOperationId);
    } catch (err) {
      setRequestStatus("pending_payment");
    }
  };

  // Render My Purchases view
  const renderMyPurchases = () => {
    if (!address) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please connect your wallet to view your purchases
          </p>
        </div>
      );
    }

    if (loadingOperations) {
      return (
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading your purchases...</span>
        </div>
      );
    }

    if (operations.length === 0) {
      return (
        <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
          <History className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">No purchases yet</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Request an analysis to get started!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {operations.map((op) => (
          <div
            key={op.operation_id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {/* Operation Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm">{op.operation_name}</h3>
                  {op.payment_status === "settled" && (
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                  {op.payment_status === "pending" && (
                    <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {!op.permission_id && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      Free
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {op.operation_id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(op.created_at).toLocaleString()}
                </p>
              </div>
              {op.final_price_vana && (
                <div className="text-right">
                  <p className="text-sm font-medium">{op.final_price_vana} VANA</p>
                </div>
              )}
            </div>

            {/* Payment Required */}
            {op.payment_status === "pending" && op.final_price_vana && (
              <Button
                onClick={() => handlePayInvoice(op.operation_id, op.final_price_vana!)}
                size="sm"
                className="mb-3"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Pay {op.final_price_vana} VANA
              </Button>
            )}

            {/* Artifacts */}
            {artifacts[op.operation_id] && artifacts[op.operation_id].length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Artifacts ({artifacts[op.operation_id].length})
                </p>
                <div className="space-y-3">
                  {artifacts[op.operation_id].map((artifact) => {
                    const isExpanded = expandedArtifacts.has(artifact.artifact_id);
                    const data = artifactData[artifact.artifact_id];
                    const isLoading = loadingArtifactData.has(artifact.artifact_id);
                    const isJsonArtifact = artifact.file_name.endsWith('.json');

                    return (
                      <div
                        key={artifact.artifact_id}
                        className="bg-gray-50 dark:bg-gray-900 rounded overflow-hidden"
                      >
                        {/* Artifact Header */}
                        <div className="flex items-center justify-between p-2">
                          <div className="flex-1">
                            <p className="text-xs font-medium">{artifact.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {(artifact.size_bytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {isJsonArtifact && (
                              <Button
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedArtifacts(prev => {
                                      const next = new Set(prev);
                                      next.delete(artifact.artifact_id);
                                      return next;
                                    });
                                  } else {
                                    fetchArtifactData(artifact.artifact_id, artifact.file_name);
                                  }
                                }}
                                size="sm"
                                variant={isExpanded ? "default" : "outline"}
                                disabled={op.payment_status === "pending" || isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {isExpanded ? "Hide" : "View"}
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              onClick={() => downloadArtifact(artifact.artifact_id, artifact.file_name)}
                              size="sm"
                              variant="outline"
                              disabled={op.payment_status === "pending"}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>

                        {/* Artifact Data Display */}
                        {isExpanded && data && (
                          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-950">
                            {/* Keywords */}
                            {data.keywords && data.keywords.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Top Keywords
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {data.keywords.slice(0, 20).map((keyword: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Evolution Data */}
                            {data.evolution && Object.keys(data.evolution).length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Keyword Evolution
                                </p>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {Object.entries(data.evolution).slice(0, 10).map(([period, keywords]: [string, any]) => (
                                    <div key={period} className="text-xs">
                                      <span className="font-medium text-gray-600 dark:text-gray-400">
                                        {period}:
                                      </span>
                                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                                        {Array.isArray(keywords) ? keywords.join(', ') : JSON.stringify(keywords)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Insights */}
                            {data.insights && Object.keys(data.insights).length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Insights
                                </p>
                                <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                                  {Object.entries(data.insights).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-medium">{key}:</span>{' '}
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Raw Data Fallback */}
                            {!data.keywords && !data.evolution && !data.insights && data.raw && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Data Preview
                                </p>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto max-h-64">
                                  {JSON.stringify(data.raw, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render Request Analysis view
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Thinker DLP Data Access</h1>

        <div className="flex gap-2">
          {/* Refresh Button */}
          {address && (
            <Button
              onClick={() => loadMyOperations()}
              variant="outline"
              size="lg"
              disabled={loadingOperations}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingOperations ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}

          {/* Request New Analysis Button */}
          {address && requestStatus === "idle" && (
            <Button onClick={handleRequestAnalysis} size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Request New Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-6">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Request Status Banner */}
      {requestStatus !== "idle" && (
        <div className="mb-6">
          {requestStatus === "requesting" && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border text-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Submitting request...</p>
            </div>
          )}

          {requestStatus === "processing" && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800 dark:text-blue-200">Processing analysis...</p>
            </div>
          )}

          {requestStatus === "pending_payment" && currentOperationId && currentPrice && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Payment Required
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                    Pay <strong>{currentPrice} VANA</strong> to unlock your analysis results
                  </p>
                  <Button
                    onClick={handlePayCurrent}
                    disabled={requestStatus === "paying"}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {requestStatus === "paying" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay {currentPrice} VANA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Purchases */}
      {renderMyPurchases()}
    </div>
  );
}
