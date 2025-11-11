import { useState } from "react";

/**
 * Hook for interacting with the Vana Runtime Task
 * Calls runtime directly (CORS now enabled on runtime side)
 */

const RUNTIME_URL = process.env.NEXT_PUBLIC_DLP_RUNTIME_URL || "http://localhost:8000";
const TASK_ID = process.env.NEXT_PUBLIC_TASK_ID || "999";

export interface RuntimeTaskResult {
  operation_id: string;
  task_id: number;
  operation_name: string;
  status: string;
  duration_ms?: number;
  result: {
    file_id: number;
    status: string;
    message?: string;
    thought_preview?: string;
    debug_info?: Record<string, unknown>;
  };
}

export const useRuntimeTask = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit a contribution to the runtime task
   * Calls POST /v1/tasks/{task_id}/invoke/contribute?file_id={file_id}
   */
  const submitContribution = async (
    fileId: number
  ): Promise<RuntimeTaskResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log(`📡 Submitting contribution to runtime task: file_id=${fileId}`);

      const url = `${RUNTIME_URL}/v1/tasks/${TASK_ID}/invoke/contribute?file_id=${fileId}`;
      console.log(`POST ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Runtime task request failed: ${response.status} ${errorData.detail || errorData.error || "Unknown error"}`
        );
      }

      const result: RuntimeTaskResult = await response.json();
      
      console.log("✅ Runtime task processed contribution:", result);

      return result;
    } catch (err) {
      console.error("❌ Error submitting to runtime task:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit contribution to runtime task";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get task statistics
   * Calls POST /v1/tasks/{task_id}/invoke/get_stats
   */
  const getTaskStats = async (): Promise<RuntimeTaskResult> => {
    try {
      console.log("📊 Getting task statistics...");

      const url = `${RUNTIME_URL}/v1/tasks/${TASK_ID}/invoke/get_stats`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get task stats: ${response.status}`);
      }

      const result: RuntimeTaskResult = await response.json();
      console.log("✅ Task stats:", result);

      return result;
    } catch (err) {
      console.error("❌ Error getting task stats:", err);
      throw err;
    }
  };

  /**
   * Aggregate keywords from all contributions
   * Calls POST /v1/tasks/{task_id}/invoke/aggregate_keywords
   */
  const aggregateKeywords = async (): Promise<RuntimeTaskResult> => {
    try {
      console.log("🔤 Aggregating keywords...");

      const url = `${RUNTIME_URL}/v1/tasks/${TASK_ID}/invoke/aggregate_keywords`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to aggregate keywords: ${response.status}`);
      }

      const result: RuntimeTaskResult = await response.json();
      console.log("✅ Keywords aggregated:", result);

      return result;
    } catch (err) {
      console.error("❌ Error aggregating keywords:", err);
      throw err;
    }
  };

  /**
   * Query keywords for a specific contributor
   * Calls POST /v1/tasks/{task_id}/invoke/query_keywords
   */
  const queryUserKeywords = async (
    contributorId: string,
    topN: number = 10
  ): Promise<RuntimeTaskResult> => {
    try {
      console.log(`🔍 Querying keywords for contributor: ${contributorId}...`);

      const url = `${RUNTIME_URL}/v1/tasks/${TASK_ID}/invoke/query_keywords`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contributor_id: contributorId,
          top_n: topN,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to query keywords: ${response.status}`);
      }

      const result: RuntimeTaskResult = await response.json();
      console.log("✅ User keywords retrieved:", result);

      return result;
    } catch (err) {
      console.error("❌ Error querying keywords:", err);
      throw err;
    }
  };

  return {
    submitContribution,
    getTaskStats,
    aggregateKeywords,
    queryUserKeywords,
    isProcessing,
    error,
  };
};

