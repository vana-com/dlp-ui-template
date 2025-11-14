"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRuntimeTask } from "./hooks/useRuntimeTask";

interface UserKeywordsProps {
  contributorId: string;
  autoLoad?: boolean;
}

interface KeywordData {
  keyword: string;
  count: number;
  evolution?: Array<{
    contributor_id: string;
    timestamp: string;
    file_id: number;
  }>;
}

interface QueryKeywordsResult {
  keywords?: KeywordData[];
  total_contributions?: number;
}

export function UserKeywords({ contributorId, autoLoad = false }: UserKeywordsProps) {
  const { queryUserKeywords, aggregateKeywords } = useRuntimeTask();
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadKeywords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, aggregate keywords to ensure latest data
      console.log("🔤 Aggregating keywords...");
      await aggregateKeywords();

      // Then query user's keywords
      console.log(`🔍 Querying keywords for: ${contributorId}`);
      const result = await queryUserKeywords(contributorId, 10);

      // Extract keywords from result
      if (result.result) {
        const queryResult = result.result as QueryKeywordsResult;
        const keywordsData = queryResult.keywords || [];
        const total = queryResult.total_contributions || 0;

        setKeywords(keywordsData);
        setTotalContributions(total);
        setHasLoaded(true);
      }
    } catch (err) {
      console.error("Error loading keywords:", err);
      setError(err instanceof Error ? err.message : "Failed to load keywords");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount if requested
  useEffect(() => {
    if (autoLoad && !hasLoaded) {
      loadKeywords();
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasLoaded && !autoLoad) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
              View Your Keyword Insights
            </h3>
            <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
              See the keywords extracted from your thoughts and track your themes over time.
            </p>
            <Button
              onClick={loadKeywords}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" />
                  View My Keywords
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          Unable to load keywords. The task may still be processing contributions.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading your keywords...
          </span>
        </div>
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          No keywords found yet. Your thoughts will be processed soon!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Your Keyword Themes
          </h3>
        </div>
        <Button
          onClick={loadKeywords}
          disabled={isLoading}
          size="sm"
          variant="ghost"
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
        These keywords were extracted from your {totalContributions} thought{totalContributions !== 1 ? 's' : ''}
      </p>

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

      {keywords.length >= 10 && (
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">
          Showing your top 10 keywords
        </p>
      )}
    </div>
  );
}

